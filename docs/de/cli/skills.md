---
read_when:
    - Sie möchten sehen, welche Skills verfügbar und einsatzbereit sind
    - Sie möchten ClawHub durchsuchen oder Skills aus ClawHub, Git oder lokalen Verzeichnissen installieren
    - Sie möchten einen ClawHub-Skill mit ClawHub verifizieren
    - Sie möchten fehlende Binärdateien, Umgebungsvariablen oder Konfigurationen für Skills debuggen
summary: CLI-Referenz für `openclaw skills` (suchen/installieren/aktualisieren/verifizieren/auflisten/Informationen anzeigen/prüfen/Workshop)
title: Skills
x-i18n:
    generated_at: "2026-07-12T01:34:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Lokale Skills prüfen, ClawHub durchsuchen, Skills aus ClawHub, Git oder lokalen Verzeichnissen installieren, ClawHub-Skills verifizieren und von ClawHub nachverfolgte Installationen aktualisieren.

Verwandte Themen:

- Skills-System: [Skills](/de/tools/skills)
- Skill-Workshop: [Skill-Workshop](/de/tools/skill-workshop)
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

`search`, `update` und `verify` verwenden ClawHub direkt. `install @owner/<slug>` installiert einen ClawHub-Skill, `install git:owner/repo[@ref]` klont einen Git-Skill und `install ./path` kopiert ein lokales Skill-Verzeichnis. Standardmäßig verwenden `install`, `update` und `verify` das Verzeichnis `skills/` des aktiven Arbeitsbereichs als Ziel; mit `--global` verwenden sie das gemeinsam verwaltete Skills-Verzeichnis. `list`/`info`/`check` prüfen weiterhin die lokalen Skills, die für den aktuellen Arbeitsbereich und die aktuelle Konfiguration sichtbar sind. Arbeitsbereichsbasierte Befehle ermitteln den Zielarbeitsbereich zunächst über `--agent <id>`, anschließend über das aktuelle Arbeitsverzeichnis, sofern es sich innerhalb eines konfigurierten Agenten-Arbeitsbereichs befindet, und schließlich über den Standardagenten.

Bei Installationen aus Git und lokalen Verzeichnissen wird `SKILL.md` im Quellstammverzeichnis erwartet. Der Installations-Slug stammt aus dem Frontmatter-Feld `name` in `SKILL.md`, sofern dieses gültig ist, andernfalls aus dem Namen des Quellverzeichnisses oder Repositorys; verwenden Sie `--as <slug>`, um ihn zu überschreiben. `--version` gilt nur für ClawHub. Skill-Installationen unterstützen weder npm-Paketspezifikationen noch ZIP-/Archivpfade, und `openclaw skills update` aktualisiert ausschließlich von ClawHub nachverfolgte Installationen.

Gateway-basierte Installationen von Skill-Abhängigkeiten, die beim Onboarding oder über die Skills-Einstellungen ausgelöst werden, verwenden stattdessen den separaten Anfragepfad `skills.install`.

Hinweise:

| Flag/Verhalten                   | Beschreibung                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | Optionale Suchanfrage; lassen Sie sie weg, um den standardmäßigen ClawHub-Suchfeed zu durchsuchen.                                                                                                                                                                                                                                            |
| `search --limit <n>`             | Begrenzt die Anzahl der zurückgegebenen Ergebnisse.                                                                                                                                                                                                                                                                                          |
| `install git:owner/repo[@ref]`   | Installiert einen Git-Skill. Branch-Referenzen dürfen Schrägstriche enthalten, beispielsweise `git:owner/repo@feature/foo`.                                                                                                                                                                                                                   |
| `install ./path/to/skill`        | Installiert ein lokales Verzeichnis, dessen Stammverzeichnis `SKILL.md` enthält.                                                                                                                                                                                                                                                              |
| `install --as <slug>`            | Überschreibt den ermittelten Slug für Installationen aus Git und lokalen Verzeichnissen.                                                                                                                                                                                                                                                      |
| `install --version <version>`    | Gilt nur für ClawHub-Skill-Referenzen.                                                                                                                                                                                                                                                                                                       |
| `install --force`                | Überschreibt einen vorhandenen Skill-Ordner im Arbeitsbereich mit demselben Slug.                                                                                                                                                                                                                                                             |
| `install/update --force-install` | Installiert einen ausstehenden GitHub-basierten ClawHub-Skill, bevor der Scan von ClawHub abgeschlossen ist.                                                                                                                                                                                                                                  |
| `--global`                       | Verwendet das gemeinsam verwaltete Skills-Verzeichnis als Ziel; kann nicht mit `--agent <id>` kombiniert werden.                                                                                                                                                                                                                              |
| `--agent <id>`                   | Verwendet den Arbeitsbereich eines konfigurierten Agenten als Ziel und überschreibt die Ermittlung anhand des aktuellen Arbeitsverzeichnisses.                                                                                                                                                                                                |
| `update @owner/<slug>`           | Aktualisiert einen einzelnen nachverfolgten Skill. Fügen Sie `--global` hinzu, um anstelle des Arbeitsbereichs das gemeinsam verwaltete Skills-Verzeichnis als Ziel zu verwenden.                                                                                                                                                              |
| `update --all`                   | Aktualisiert nachverfolgte ClawHub-Installationen im ausgewählten Arbeitsbereich oder mit `--global` im gemeinsam verwalteten Skills-Verzeichnis.                                                                                                                                                                                             |
| `verify @owner/<slug>`           | Gibt standardmäßig den JSON-Umschlag `clawhub.skill.verify.v1` von ClawHub aus. Es gibt kein Flag `--json`, da JSON bereits die Standardeinstellung ist. Reine Slugs werden aus Kompatibilitätsgründen akzeptiert, wenn der Skill bereits installiert oder eindeutig ist; Referenzen mit Eigentümerangabe vermeiden Mehrdeutigkeiten beim Herausgeber. |
| `verify`-Herkunft                | Wenn ClawHub eine serverseitig ermittelte Quellherkunft zurückgibt, enthält das Verifizierungs-JSON außerdem eine auf einen Commit festgelegte `openclaw.verifiedSourceUrl`. Nicht verfügbare oder selbst deklarierte Quell-URLs verbleiben ausschließlich im unverarbeiteten Herkunftsumschlag und werden nicht übernommen.                        |
| `verify`-Versionsauswahl         | `verify` verwendet `.clawhub/origin.json` für installierte ClawHub-Skills und verifiziert daher die installierte Version anhand der Registry, aus der sie stammt. `--version` und `--tag` überschreiben die Versionsauswahl, behalten jedoch die installierte Registry bei, sofern Herkunftsmetadaten vorhanden sind.                          |
| `verify --card`                  | Gibt anstelle von JSON das generierte Skill-Card-Markdown aus. Beendet sich mit einem von null verschiedenen Status, wenn ClawHub `ok: false` oder `decision: "fail"` zurückgibt; nicht signierte Signaturen dienen nur zur Information, sofern sich die ClawHub-Richtlinie nicht ändert.                                                          |
| Skill-Card-Fingerabdruck         | Installierte ClawHub-Pakete können eine generierte Datei `skill-card.md` enthalten. OpenClaw behandelt die Verifizierung als Entscheidung des ClawHub-Servers und lehnt einen installierten Skill nicht allein deshalb ab, weil diese generierte Karte den Fingerabdruck des Pakets verändert.                                                     |
| `check --agent <id>`             | Prüft den Arbeitsbereich des ausgewählten Agenten und meldet, welche einsatzbereiten Skills tatsächlich in der Prompt- oder Befehlsoberfläche dieses Agenten sichtbar sind.                                                                                                                                                                   |
| `list`                           | Standardaktion, wenn kein Unterbefehl angegeben wird.                                                                                                                                                                                                                                                                                        |
| Ausgabe von `list`/`info`/`check` | Die gerenderte Ausgabe wird an stdout gesendet. Mit `--json` verbleibt die maschinenlesbare Nutzlast für Pipes und Skripte auf stdout.                                                                                                                                                                                                          |

Bei Installationen und Aktualisierungen von Community-Skills aus ClawHub wird vor dem Herunterladen die Vertrauenswürdigkeit geprüft. Versionierte Community-Archivveröffentlichungen verwenden Vertrauensmetadaten der exakten Veröffentlichung. Resolver-basierte GitHub-Skills verwenden den Installations-Resolver von ClawHub, um die Scan- und Force-Install-Richtlinie durchzusetzen, bevor er einen festgelegten Commit zurückgibt; verwenden Sie `--force-install`, um einen ausstehenden GitHub-basierten Skill zu installieren, bevor dieser Scan abgeschlossen ist. Bösartige oder gesperrte Community-Veröffentlichungen werden abgelehnt. Riskante Community-Veröffentlichungen erfordern eine Prüfung und `--acknowledge-clawhub-risk`, wenn ein nicht interaktiver Befehl nach dieser Prüfung fortgesetzt werden soll. Offizielle Herausgeber von ClawHub-Skills und gebündelte OpenClaw-Skill-Quellen umgehen diese Aufforderung zur Prüfung der Veröffentlichungsvertrauenswürdigkeit.

## Skill-Workshop

`openclaw skills workshop` verwaltet ausstehende Skill-Vorschläge im ausgewählten Arbeitsbereich. Vorschläge sind erst nach ihrer Anwendung aktive Skills. Informationen zur Speicherung von Vorschlägen, zu Schutzmaßnahmen für unterstützende Dateien, zu Gateway-Methoden und zur Genehmigungsrichtlinie finden Sie unter [Skill-Workshop](/de/tools/skill-workshop).

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
Hinweise zusammen mit dem Inhalt aus `--proposal`/`--proposal-dir` festzuhalten.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Skills](/de/tools/skills)
