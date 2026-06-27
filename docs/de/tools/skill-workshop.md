---
read_when:
    - Sie möchten, dass der Agent im Chat eine Skill erstellt oder aktualisiert
    - Sie müssen einen generierten Skill-Entwurf prüfen, anwenden, ablehnen oder isolieren.
    - Sie konfigurieren Genehmigung, Autonomie, Speicher oder Limits für den Skill Workshop
sidebarTitle: Skill Workshop
summary: Erstellen und aktualisieren Sie Workspace-Skills über die Skill-Workshop-Prüfung
title: Skill-Workshop
x-i18n:
    generated_at: "2026-06-27T18:21:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 449b9cb4d26731555af97ff5b85a6fed48eecad02c81965ff95d871cc6fe1b33
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop ist OpenClaws geregelter Pfad zum Erstellen und Aktualisieren von Workspace-Skills.

Agents und Operators schreiben aktive `SKILL.md`-Dateien über diesen Pfad nicht direkt. Sie erstellen zuerst einen **Vorschlag**. Ein Vorschlag ist ein ausstehender Entwurf mit dem vorgeschlagenen Skill-Inhalt, der Zielbindung, dem Scanner-Status, Hashes, Supportdatei-Metadaten und Rollback-Metadaten. Er wird erst beim Anwenden zu einem Live-Skill.

Skill Workshop schreibt nur Workspace-Skills. Es verändert keine gebündelten Skills, Plugin-Skills, ClawHub-Skills, Extra-Root-Skills, verwalteten Skills, Personal-Agent-Skills oder System-Skills.

## Funktionsweise

- **Vorschlag zuerst:** generierter Skill-Inhalt wird als `PROPOSAL.md` gespeichert, nicht als `SKILL.md`.
- **Anwenden ist der einzige Live-Schreibvorgang:** Erstellen, Aktualisieren und Überarbeiten ändern keine aktiven Skills.
- **Workspace-begrenzt:** Erstellungen zielen auf den Workspace-Root `skills/`. Aktualisierungen sind nur für schreibbare Workspace-Skills erlaubt.
- **Kein Überschreiben:** Erstellen schlägt fehl, wenn der Ziel-Skill bereits vorhanden ist.
- **Hash-gebunden:** Aktualisierungsvorschläge werden an den aktuellen Ziel-Hash gebunden und werden veraltet, wenn sich der Live-Skill vor dem Anwenden ändert.
- **Scanner-gesteuert:** Beim Anwenden wird vor dem Schreiben erneut gescannt.
- **Wiederherstellbar:** Beim Anwenden werden Rollback-Metadaten geschrieben, bevor Live-Dateien geändert werden.
- **Konsistente Oberflächen:** Chat, CLI und Gateway rufen alle denselben Skill-Workshop-Dienst auf.

## Lebenszyklus

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

Nur `pending`-Vorschläge können überarbeitet, angewendet, abgelehnt oder unter Quarantäne gestellt werden.

## Chat

Fragen Sie den Agent nach dem gewünschten Skill. Der Agent ruft `skill_workshop` auf und gibt eine Vorschlags-ID zurück.

Erstellen:

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

Einen vorhandenen Workspace-Skill aktualisieren:

```text
Update trip-planning to also check seat maps before booking.
```

Einen ausstehenden Vorschlag iterieren:

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

Standardmäßig zeigen vom Agent initiiertes `apply`, `reject` und `quarantine` vor der Ausführung eine Genehmigungsaufforderung an. Setzen Sie `skills.workshop.approvalPolicy` auf `"auto"`, um die Aufforderung in vertrauenswürdigen Umgebungen zu überspringen.

## CLI

Einen neuen Skill-Vorschlag erstellen:

```bash
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md
```

Einen Aktualisierungsvorschlag für einen vorhandenen Workspace-Skill erstellen:

```bash
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md
```

Auflisten und prüfen:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
```

Vor der Genehmigung überarbeiten:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
```

Den Vorschlag abschließen:

```bash
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## Vorschlagsinhalt

Solange der Vorschlag ausstehend ist, wird er als `PROPOSAL.md` mit nur für Vorschläge vorgesehenem Frontmatter gespeichert:

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Beim Anwenden schreibt Skill Workshop die aktive `SKILL.md` und entfernt nur für Vorschläge vorgesehene Felder: `status`, Vorschlags-`version` und Vorschlags-`date`.

## Supportdateien

Verwenden Sie `--proposal-dir`, wenn der vorgeschlagene Skill Dateien neben `PROPOSAL.md` benötigt:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

Das Verzeichnis muss `PROPOSAL.md` enthalten. Supportdateien müssen unter folgenden Verzeichnissen liegen:

- `assets/`
- `examples/`
- `references/`
- `scripts/`
- `templates/`

Skill Workshop scannt, hasht und speichert Supportdateien mit dem Vorschlag. Sie werden erst beim Anwenden neben die Live-`SKILL.md` geschrieben.

Abgelehnte Supportdateipfade umfassen absolute Pfade, versteckte Pfadsegmente, Pfad-Traversal, überlappende Pfade, ausführbare Dateien aus Vorschlagsverzeichnissen, Nicht-UTF-8-Text, Nullbytes und Dateien außerhalb der Standard-Supportordner.

## Agent-Tool

Das Modell verwendet `skill_workshop`:

```text
action: create | update | revise | list | inspect | apply | reject | quarantine
```

Agents müssen `skill_workshop` für generierte Skill-Arbeiten verwenden. Sie dürfen Vorschlagsdateien nicht über `write`, `edit`, `exec`, Shell-Befehle oder direkte Dateisystemoperationen erstellen oder ändern.

<Note>
`skill_workshop` ist ein integriertes Agent-Tool und in `tools.profile: "coding"` enthalten. Wenn eine strengere Richtlinie es ausblendet, fügen Sie `skill_workshop` zur aktiven Liste `tools.allow` hinzu, oder verwenden Sie `tools.alsoAllow: ["skill_workshop"]`, wenn der Scope ein Profil ohne explizites `tools.allow` verwendet. Sandbox-Ausführungen erstellen das hostseitige Skill-Workshop-Tool nicht. Führen Sie Aktionen zur Vorschlagsprüfung daher aus einer normalen hostseitigen Agent-Sitzung oder über die CLI aus.
</Note>

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

- `autonomous.enabled`: erlaubt OpenClaw, nach erfolgreichen Durchläufen aus dauerhaften Konversationssignalen ausstehende Vorschläge zu erstellen. Standard: `false`.
- `allowSymlinkTargetWrites`: erlaubt dem Anwenden, durch Workspace-Skill-Symlinks zu schreiben, deren reales Ziel in `skills.load.allowSymlinkTargets` aufgeführt ist. Standard: `false`.
- `approvalPolicy: "pending"`: erfordert vor vom Agent initiiertem `apply`, `reject` oder `quarantine` eine Genehmigungsaufforderung.
- `approvalPolicy: "auto"`: überspringt diese Genehmigungsaufforderung. Der Agent muss die Aktion weiterhin aufrufen.
- `maxPending`: begrenzt ausstehende und quarantänisierte Vorschläge pro Workspace.
- `maxSkillBytes`: begrenzt die Größe des Vorschlagstexts. Standard: `40000`.

Vorschlagsbeschreibungen sind immer auf 160 Byte begrenzt.

## Gateway-Methoden

```text
skills.proposals.list
skills.proposals.inspect
skills.proposals.create
skills.proposals.update
skills.proposals.revise
skills.proposals.apply
skills.proposals.reject
skills.proposals.quarantine
```

Schreibgeschützte Methoden erfordern `operator.read`. Ändernde Methoden erfordern `operator.admin`.

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

Standard-Zustandsverzeichnis: `~/.openclaw`.

- `proposal.json`: kanonischer Vorschlagsdatensatz.
- `proposals.json`: schneller Listenindex, aus Vorschlagsordnern wiederherstellbar.
- `PROPOSAL.md`: ausstehender Skill-Vorschlag.
- `rollback.json`: Wiederherstellungsmetadaten, die geschrieben werden, bevor Anwenden Live-Dateien ändert.

## Limits

- Beschreibung: 160 Byte.
- Vorschlagstext: `skills.workshop.maxSkillBytes` (Standard 40.000).
- Supportdateien: 64 pro Vorschlag.
- Supportdateigröße: jeweils 256 KB, insgesamt 2 MB.
- Ausstehende und quarantänisierte Vorschläge: `skills.workshop.maxPending` pro Workspace (Standard 50).

## Fehlerbehebung

| Problem                                        | Lösung                                                                                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Kürzen Sie `description` auf 160 Byte oder weniger.                                                                                                                                                                                                                     |
| `Skill proposal content is too large`          | Kürzen Sie den Vorschlagstext oder erhöhen Sie `skills.workshop.maxSkillBytes`.                                                                                                                                                                                         |
| `Target skill changed after proposal creation` | Überarbeiten Sie den Vorschlag gegen das aktuelle Ziel oder erstellen Sie einen neuen Vorschlag.                                                                                                                                                                         |
| `Proposal scan failed`                         | Prüfen Sie die Scanner-Ergebnisse und überarbeiten oder quarantänisieren Sie den Vorschlag anschließend.                                                                                                                                                                |
| `untrusted symlink target`                     | Konfigurieren Sie `skills.load.allowSymlinkTargets` und aktivieren Sie `skills.workshop.allowSymlinkTargetWrites` nur für absichtlich gemeinsam genutzte Skill-Roots.                                                                                                  |
| `Support file paths must be under one of...`   | Verschieben Sie Supportdateien unter `assets/`, `examples/`, `references/`, `scripts/` oder `templates/`.                                                                                                                                                              |
| Vorschlag wird nicht in der Liste angezeigt    | Prüfen Sie den ausgewählten `--agent`-Workspace und `OPENCLAW_STATE_DIR`.                                                                                                                                                                                               |
| Agent kann `skill_workshop` nicht aufrufen     | Prüfen Sie die aktive Tool-Richtlinie und den Ausführungsmodus. `coding` enthält das Tool; restriktive `tools.allow`-Richtlinien müssen es explizit aufführen, und Sandbox-Ausführungen müssen eine normale hostseitige Agent-Sitzung oder die CLI verwenden. |

## Verwandte Themen

- [Skills](/de/tools/skills) für Ladereihenfolge, Priorität und Sichtbarkeit
- [Skills erstellen](/de/tools/creating-skills) für handgeschriebene `SKILL.md`-Grundlagen
- [Skills-Konfiguration](/de/tools/skills-config) für das vollständige `skills.workshop`-Schema
- [Skills-CLI](/de/cli/skills) für `openclaw skills`-Befehle
