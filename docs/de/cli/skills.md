---
read_when:
    - Sie möchten sehen, welche Skills verfügbar und einsatzbereit sind
    - Sie möchten ClawHub durchsuchen oder Skills aus ClawHub, Git oder lokalen Verzeichnissen installieren
    - Sie möchten einen ClawHub-Skill mit ClawHub verifizieren
    - Sie möchten fehlende Binaries/Umgebungsvariablen/Konfiguration für Skills debuggen
summary: CLI-Referenz für `openclaw skills` (search/install/update/verify/list/info/check/workshop)
title: Skills
x-i18n:
    generated_at: "2026-06-27T17:21:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Lokale Skills prüfen, ClawHub durchsuchen, Skills aus ClawHub/Git/lokalen
Verzeichnissen installieren, ClawHub-Skills verifizieren und von ClawHub
nachverfolgte Installationen aktualisieren.

Verwandt:

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
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
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
installiert einen ClawHub-Skill, `install git:owner/repo[@ref]` klont einen
Git-Skill, und `install ./path` kopiert ein lokales Skill-Verzeichnis.
Standardmäßig zielen `install`, `update` und `verify` auf das aktive
`skills/`-Verzeichnis des Workspaces; mit `--global` zielen sie auf das
gemeinsam verwaltete Skills-Verzeichnis. `list`/`info`/`check` prüfen weiterhin
die lokalen Skills, die für den aktuellen Workspace und die aktuelle
Konfiguration sichtbar sind. Workspace-gestützte Befehle ermitteln den Ziel-
Workspace aus `--agent <id>`, dann aus dem aktuellen Arbeitsverzeichnis, wenn es
sich innerhalb eines konfigurierten Agent-Workspace befindet, und danach aus dem
Standard-Agent.

Git- und lokale Verzeichnisinstallationen erwarten `SKILL.md` im Quellstamm. Der
Installations-Slug stammt aus dem Frontmatter-Feld `name` in `SKILL.md`, wenn es
gültig ist, danach aus dem Quellverzeichnis- oder Repository-Namen; verwenden
Sie `--as <slug>`, um ihn zu überschreiben. `--version` gilt nur für ClawHub.
Skill-Installationen unterstützen keine npm-Paketspezifikationen oder
Zip-/Archivpfade, und `openclaw skills update` aktualisiert nur von ClawHub
nachverfolgte Installationen.

Gateway-gestützte Skill-Abhängigkeitsinstallationen, die durch Onboarding oder
Skills-Einstellungen ausgelöst werden, verwenden stattdessen den separaten
Anforderungspfad `skills.install`.

Hinweise:

- `search [query...]` akzeptiert eine optionale Abfrage; lassen Sie sie weg, um
  den standardmäßigen ClawHub-Suchfeed zu durchsuchen.
- `search --limit <n>` begrenzt die zurückgegebenen Ergebnisse.
- `install git:owner/repo[@ref]` installiert einen Git-Skill. Branch-Refs können
  Schrägstriche enthalten, etwa `git:owner/repo@feature/foo`.
- `install ./path/to/skill` installiert ein lokales Verzeichnis, dessen Stamm
  `SKILL.md` enthält.
- `install --as <slug>` überschreibt den abgeleiteten Slug für Git- und lokale
  Verzeichnisinstallationen.
- `install --version <version>` gilt nur für ClawHub-Skill-Refs.
- `install --force` überschreibt einen bestehenden Workspace-Skill-Ordner für
  denselben Slug.
- Installationen und Aktualisierungen von Community-ClawHub-Skills prüfen vor
  dem Download die Vertrauenswürdigkeit. Versionierte Community-Archiv-Releases
  verwenden Vertrauensmetadaten für das exakte Release. Resolver-gestützte
  GitHub-Skills verlassen sich darauf, dass der Installations-Resolver von
  ClawHub Scan- und Force-Install-Richtlinien durchsetzt, bevor er einen
  angehefteten Commit zurückgibt. Bösartige oder blockierte Community-Releases
  werden abgelehnt. Riskante Community-Releases erfordern eine Prüfung und
  `--acknowledge-clawhub-risk`, wenn ein nicht interaktiver Befehl nach dieser
  Prüfung fortfahren soll. Offizielle ClawHub-Skill-Publisher und gebündelte
  OpenClaw-Skill-Quellen umgehen diese Release-Vertrauensabfrage.
- `--global` zielt auf das gemeinsam verwaltete Skills-Verzeichnis und kann nicht
  mit `--agent <id>` kombiniert werden.
- `--agent <id>` zielt auf einen konfigurierten Agent-Workspace und überschreibt
  die Ableitung aus dem aktuellen Arbeitsverzeichnis.
- `update @owner/<slug>` aktualisiert einen einzelnen nachverfolgten Skill. Fügen
  Sie `--global` hinzu, um statt des Workspaces das gemeinsam verwaltete
  Skills-Verzeichnis als Ziel zu verwenden.
- `update --all` aktualisiert nachverfolgte ClawHub-Installationen im
  ausgewählten Workspace oder, in Kombination mit `--global`, im gemeinsam
  verwalteten Skills-Verzeichnis.
- `verify @owner/<slug>` gibt standardmäßig den JSON-Umschlag
  `clawhub.skill.verify.v1` von ClawHub aus. Es gibt kein `--json`-Flag, weil
  JSON bereits die Standardeinstellung ist. Bloße Slugs bleiben aus
  Kompatibilitätsgründen akzeptiert, wenn der Skill bereits installiert oder
  eindeutig ist; inhaberqualifizierte Refs vermeiden jedoch Mehrdeutigkeiten beim
  Publisher.
- Wenn ClawHub serverseitig aufgelöste Quellherkunft zurückgibt, enthält das
  Verifizierungs-JSON außerdem eine auf einen Commit angeheftete
  `openclaw.verifiedSourceUrl`. Nicht verfügbare oder selbst deklarierte
  Quell-URLs verbleiben nur im rohen Herkunftsumschlag und werden nicht
  hochgestuft.
- `verify` verwendet `.clawhub/origin.json` für installierte ClawHub-Skills und
  verifiziert daher die installierte Version gegen die Registry, aus der sie
  stammt. `--version` und `--tag` überschreiben die Versionsauswahl, behalten
  aber diese installierte Registry bei, wenn Herkunftsmetadaten vorhanden sind.
- `verify --card` gibt das generierte Skill-Card-Markdown statt JSON aus. Der
  Befehl beendet sich mit einem von null verschiedenen Exit-Code, wenn ClawHub
  `ok: false` oder `decision: "fail"` zurückgibt; nicht signierte Signaturen sind
  informativ, sofern sich die ClawHub-Richtlinie nicht ändert.
- Installierte ClawHub-Bundles können eine generierte `skill-card.md` enthalten.
  OpenClaw behandelt Verifizierung als ClawHub-Serverentscheidung und lehnt
  einen installierten Skill nicht allein deshalb ab, weil diese generierte Karte
  den Bundle-Fingerprint ändert.
- `check --agent <id>` prüft den Workspace des ausgewählten Agent und meldet,
  welche einsatzbereiten Skills tatsächlich für die Prompt- oder
  Befehlsoberfläche dieses Agent sichtbar sind.
- `list` ist die Standardaktion, wenn kein Unterbefehl angegeben wird.
- `list`, `info` und `check` schreiben ihre gerenderte Ausgabe nach stdout. Mit
  `--json` bedeutet das, dass die maschinenlesbare Nutzlast für Pipes und
  Skripte auf stdout bleibt.

## Skill Workshop

`openclaw skills workshop` verwaltet ausstehende Skill-Vorschläge im
ausgewählten Workspace. Vorschläge sind erst aktive Skills, wenn sie angewendet
wurden. Informationen zu Vorschlagsspeicher, Schutzmaßnahmen für Support-Dateien,
Gateway-Methoden und Genehmigungsrichtlinie finden Sie unter
[Skill Workshop](/de/tools/skill-workshop).

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Skills](/de/tools/skills)
