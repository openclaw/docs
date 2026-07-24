---
read_when:
    - Sie möchten sehen, welche Skills verfügbar und einsatzbereit sind
    - Sie möchten ClawHub durchsuchen oder Skills aus ClawHub, Git oder lokalen Verzeichnissen installieren
    - Sie möchten einen ClawHub-Skill mit ClawHub verifizieren
    - Sie möchten fehlende Binärdateien/Umgebungsvariablen/Konfigurationen für Skills debuggen
summary: CLI-Referenz für `openclaw skills` (suchen/installieren/aktualisieren/verifizieren/auflisten/Informationen anzeigen/prüfen/Workshop)
title: Skills
x-i18n:
    generated_at: "2026-07-24T04:20:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Lokale Skills prüfen, ClawHub durchsuchen, Skills aus ClawHub/Git/lokalen
Verzeichnissen installieren, ClawHub-Skills verifizieren und von ClawHub verwaltete Installationen aktualisieren.

Verwandte Themen:

- Skills-System: [Skills](/de/tools/skills)
- Skill Workshop: [Skill Workshop](/de/tools/skill-workshop)
- Skills-Konfiguration: [Skills-Konfiguration](/de/tools/skills-config)
- ClawHub-Installationen: [ClawHub](/de/clawhub/cli)

## Befehle

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --force-install
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --force-install
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`, `update` und `verify` verwenden ClawHub direkt. `install @owner/<slug>`
installiert einen ClawHub-Skill, `install git:owner/repo[@ref]` klont einen Git-Skill
und `install ./path` kopiert ein lokales Skill-Verzeichnis. Standardmäßig zielen `install`,
`update` und `verify` auf das Verzeichnis `skills/` des aktiven Workspace; mit
`--global` zielen sie auf das gemeinsam genutzte Verzeichnis für verwaltete Skills. `list`/`info`/`check`
prüfen weiterhin die lokalen Skills, die für den aktuellen Workspace und die aktuelle Konfiguration sichtbar sind.
Workspace-basierte Befehle bestimmen den Ziel-Workspace zuerst anhand von `--agent <id>`,
dann anhand des aktuellen Arbeitsverzeichnisses, wenn es sich innerhalb eines konfigurierten Agenten-Workspace
befindet, und anschließend anhand des Standardagenten.

Bei Installationen aus Git und lokalen Verzeichnissen wird `SKILL.md` im Quellstammverzeichnis erwartet. Der
Installations-Slug wird aus `name` im Frontmatter von `SKILL.md` übernommen, wenn er gültig ist, andernfalls
aus dem Namen des Quellverzeichnisses oder Repositorys; mit `--as <slug>` kann er überschrieben werden.
`--version` gilt nur für ClawHub. Skill-Installationen unterstützen weder npm-Paketspezifikationen
noch ZIP-/Archivpfade, und `openclaw skills update` aktualisiert ausschließlich
von ClawHub verwaltete Installationen.

Gateway-basierte Installationen von Skill-Abhängigkeiten, die beim Onboarding oder in den Skills-
Einstellungen ausgelöst werden, verwenden stattdessen den separaten Anfragepfad `skills.install`.

Hinweise:

| Flag/Verhalten                    | Beschreibung                                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | Optionale Suchanfrage; lassen Sie sie weg, um den standardmäßigen ClawHub-Suchfeed zu durchsuchen.                                                                                                                                                                                  |
| `search --limit <n>`             | Begrenzt die Anzahl der zurückgegebenen Ergebnisse.                                                                                                                                                                                                                                |
| `install git:owner/repo[@ref]`   | Installiert einen Git-Skill. Branch-Referenzen können Schrägstriche enthalten, beispielsweise `git:owner/repo@feature/foo`.                                                                                                                                                                  |
| `install ./path/to/skill`        | Installiert ein lokales Verzeichnis, dessen Stammverzeichnis `SKILL.md` enthält.                                                                                                                                                                                           |
| `install --as <slug>`            | Überschreibt den abgeleiteten Slug für Installationen aus Git und lokalen Verzeichnissen.                                                                                                                                                                                          |
| `install --version <version>`    | Gilt nur für ClawHub-Skill-Referenzen.                                                                                                                                                                                                                                             |
| `install --force`                | Überschreibt einen vorhandenen Workspace-Skill-Ordner mit demselben Slug.                                                                                                                                                                                                          |
| `install/update --force-install` | Installiert einen ausstehenden GitHub-basierten ClawHub-Skill, bevor der Scan von ClawHub abgeschlossen ist.                                                                                                                                                                       |
| `--global`                       | Zielt auf das gemeinsam genutzte Verzeichnis für verwaltete Skills; kann nicht mit `--agent <id>` kombiniert werden.                                                                                                                                                           |
| `--agent <id>`                   | Zielt auf einen konfigurierten Agenten-Workspace; überschreibt die Ableitung aus dem aktuellen Arbeitsverzeichnis.                                                                                                                                                                  |
| `update @owner/<slug>`           | Aktualisiert einen einzelnen verwalteten Skill. Fügen Sie `--global` hinzu, um statt des Workspace das gemeinsam genutzte Verzeichnis für verwaltete Skills zu verwenden.                                                                                                    |
| `update --all`                   | Aktualisiert verwaltete ClawHub-Installationen im ausgewählten Workspace oder mit `--global` im gemeinsam genutzten Verzeichnis für verwaltete Skills.                                                                                                                       |
| `verify @owner/<slug>`           | Gibt standardmäßig den JSON-Umschlag `clawhub.skill.verify.v1` von ClawHub aus. Ein Flag `--json` ist nicht vorhanden, da JSON bereits der Standard ist. Reine Slugs werden aus Kompatibilitätsgründen akzeptiert, wenn der Skill bereits installiert oder eindeutig ist; inhaberqualifizierte Referenzen vermeiden Mehrdeutigkeiten beim Herausgeber. |
| `verify`-Provenienz              | Wenn ClawHub eine serverseitig aufgelöste Quellprovenienz zurückgibt, enthält das Verifizierungs-JSON auch einen auf einen Commit festgelegten `openclaw.verifiedSourceUrl`. Nicht verfügbare oder selbst deklarierte Quell-URLs verbleiben nur im Rohprovenienz-Umschlag und werden nicht hochgestuft. |
| `verify`-Versionsauswahl        | `verify` verwendet `.clawhub/origin.json` für installierte ClawHub-Skills und verifiziert daher die installierte Version anhand der Registry, aus der sie stammt. `--version` und `--tag` überschreiben die Versionsauswahl, behalten jedoch diese installierte Registry bei, wenn Ursprungsmetadaten vorhanden sind. |
| `verify --card`                  | Gibt das generierte Skill-Card-Markdown anstelle von JSON aus. Wird mit einem von null verschiedenen Status beendet, wenn ClawHub `ok: false` oder `decision: "fail"` zurückgibt; nicht signierte Signaturen dienen nur zur Information, sofern sich die ClawHub-Richtlinie nicht ändert. |
| Skill-Card-Fingerabdruck           | Installierte ClawHub-Bundles können eine generierte `skill-card.md` enthalten. OpenClaw behandelt die Verifizierung als Entscheidung des ClawHub-Servers und lehnt einen installierten Skill nicht allein deshalb ab, weil diese generierte Karte den Bundle-Fingerabdruck ändert. |
| `check --agent <id>`             | Prüft den Workspace des ausgewählten Agenten und meldet, welche einsatzbereiten Skills für die Prompt- oder Befehlsoberfläche dieses Agenten tatsächlich sichtbar sind.                                                                                                              |
| `list`                           | Standardaktion, wenn kein Unterbefehl angegeben ist.                                                                                                                                                                                                                               |
| Ausgabe von `list`/`info`/`check`     | Die gerenderte Ausgabe wird an stdout gesendet. Mit `--json` verbleibt die maschinenlesbare Nutzlast für Pipes und Skripte auf stdout.                                                                                                                                     |

Bei Installationen und Aktualisierungen von Community-Skills aus ClawHub wird vor dem Herunterladen die Vertrauenswürdigkeit
geprüft. Versionierte Community-Archiv-Releases verwenden Vertrauensmetadaten für das exakte Release.
Resolver-basierte GitHub-Skills stützen sich auf den Installations-Resolver von ClawHub, um
Scan- und erzwungene Installationsrichtlinien durchzusetzen, bevor er einen festgelegten Commit zurückgibt; verwenden Sie
`--force-install`, um einen ausstehenden GitHub-basierten Skill zu installieren, bevor dieser Scan
abgeschlossen ist. Schädliche oder blockierte Community-Releases werden abgelehnt. Riskante
Community-Releases erfordern eine Prüfung und `--acknowledge-clawhub-risk`, wenn ein
nicht interaktiver Befehl nach dieser Prüfung fortgesetzt werden soll. Offizielle ClawHub-
Skill-Herausgeber und mitgelieferte OpenClaw-Skill-Quellen umgehen diese Aufforderung zur Prüfung der Release-Vertrauenswürdigkeit.

## Skill Workshop

`openclaw skills workshop` verwaltet ausstehende Skill-Vorschläge im ausgewählten
Workspace. Vorschläge sind erst nach ihrer Anwendung aktive Skills. Informationen zur
Speicherung von Vorschlägen, zu Schutzmaßnahmen für Unterstützungsdateien, zu Gateway-Methoden und zur Genehmigungsrichtlinie finden Sie unter
[Skill-Workshop](/de/tools/skill-workshop).

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Wiederholbare QA-Checkliste" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Wiederholbare QA-Checkliste" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplikat"
openclaw skills workshop quarantine <proposal-id> --reason "Sicherheitsüberprüfung erforderlich"
```

`propose-create`, `propose-update` und `revise` akzeptieren außerdem `--goal <text>`
und `--evidence <text>`, um die Motivation des Vorschlags und unterstützende
Hinweise zusammen mit dem Inhalt von `--proposal`/`--proposal-dir` zu erfassen.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Skills](/de/tools/skills)
