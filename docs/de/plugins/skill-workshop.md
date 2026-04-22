---
read_when:
    - Sie möchten, dass Agenten Korrekturen oder wiederverwendbare Abläufe in Workspace-Skills umwandeln
    - Sie konfigurieren prozedurales Skill-Memory
    - Sie debuggen das Tool-Verhalten von `skill_workshop`
    - Sie entscheiden, ob Sie die automatische Skill-Erstellung aktivieren möchten
summary: Experimentelle Erfassung wiederverwendbarer Abläufe als Workspace-Skills mit Review, Genehmigung, Quarantäne und Hot-Skill-Aktualisierung
title: Skill-Workshop-Plugin
x-i18n:
    generated_at: "2026-04-22T04:26:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62dcb3e1a71999bfc39a95dc3d0984d3446c8a58f7d91a914dfc7256b4e79601
    source_path: plugins/skill-workshop.md
    workflow: 15
---

# Skill-Workshop-Plugin

Skill Workshop ist **experimentell**. Es ist standardmäßig deaktiviert, seine Erfassungs-
Heuristiken und Reviewer-Prompts können sich zwischen Releases ändern, und automatische
Schreibvorgänge sollten nur in vertrauenswürdigen Workspaces verwendet werden, nachdem zuerst die Ausgabe im Pending-Modus geprüft wurde.

Skill Workshop ist prozedurales Memory für Workspace-Skills. Es ermöglicht einem Agenten,
wiederverwendbare Workflows, Benutzerkorrekturen, mühsam errungene Fixes und wiederkehrende Fallstricke
in `SKILL.md`-Dateien unter folgendem Pfad umzuwandeln:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Das unterscheidet sich von Langzeit-Memory:

- **Memory** speichert Fakten, Präferenzen, Entitäten und vergangenen Kontext.
- **Skills** speichern wiederverwendbare Abläufe, denen der Agent bei zukünftigen Aufgaben folgen soll.
- **Skill Workshop** ist die Brücke von einem nützlichen Zug zu einem dauerhaften Workspace-
  Skill, mit Sicherheitsprüfungen und optionaler Genehmigung.

Skill Workshop ist nützlich, wenn der Agent einen Ablauf lernt wie zum Beispiel:

- wie extern bezogene animierte GIF-Assets validiert werden
- wie Screenshot-Assets ersetzt und Abmessungen geprüft werden
- wie ein repo-spezifisches QA-Szenario ausgeführt wird
- wie ein wiederkehrender Fehler eines Anbieters debuggt wird
- wie eine veraltete lokale Workflow-Notiz repariert wird

Es ist nicht vorgesehen für:

- Fakten wie „der Benutzer mag Blau“
- allgemeines autobiografisches Memory
- rohe Archivierung von Transkripten
- Secrets, Anmeldedaten oder versteckten Prompt-Text
- einmalige Anweisungen, die sich nicht wiederholen

## Standardzustand

Das gebündelte Plugin ist **experimentell** und **standardmäßig deaktiviert**, es sei denn, es wird
explizit in `plugins.entries.skill-workshop` aktiviert.

Das Plugin-Manifest setzt nicht `enabledByDefault: true`. Der Standardwert `enabled: true`
innerhalb des Plugin-Konfigurationsschemas gilt nur, nachdem der Plugin-Eintrag bereits
ausgewählt und geladen wurde.

Experimentell bedeutet:

- das Plugin wird ausreichend unterstützt für Opt-in-Tests und Dogfooding
- Proposal-Speicherung, Reviewer-Schwellenwerte und Erfassungsheuristiken können sich weiterentwickeln
- Pending-Genehmigung ist der empfohlene Startmodus
- Auto-Apply ist für vertrauenswürdige persönliche/Workspace-Setups gedacht, nicht für gemeinsam genutzte oder hostile Umgebungen mit vielen Eingaben

## Aktivieren

Minimale sichere Konfiguration:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

Mit dieser Konfiguration:

- ist das Tool `skill_workshop` verfügbar
- werden explizite wiederverwendbare Korrekturen als Pending-Proposals in die Warteschlange gestellt
- können reviewerbasierte Durchläufe anhand von Schwellenwerten Skill-Updates vorschlagen
- wird keine Skill-Datei geschrieben, bis ein Pending-Proposal angewendet wird

Verwenden Sie automatische Schreibvorgänge nur in vertrauenswürdigen Workspaces:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` verwendet weiterhin denselben Scanner- und Quarantänepfad. Es
wendet keine Proposals mit kritischen Findings an.

## Konfiguration

| Schlüssel            | Standard    | Bereich / Werte                             | Bedeutung                                                            |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Aktiviert das Plugin, nachdem der Plugin-Eintrag geladen wurde.      |
| `autoCapture`        | `true`      | boolean                                     | Aktiviert Erfassung/Review nach einem erfolgreichen Agent-Zug.       |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Proposals in die Warteschlange stellen oder sichere Proposals automatisch schreiben. |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Wählt explizite Korrekturerfassung, LLM-Reviewer, beides oder keines von beidem. |
| `reviewInterval`     | `15`        | `1..200`                                    | Führt den Reviewer nach dieser Anzahl erfolgreicher Züge aus.        |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Führt den Reviewer nach dieser Anzahl beobachteter Tool-Aufrufe aus. |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Timeout für den eingebetteten Reviewer-Lauf.                         |
| `maxPending`         | `50`        | `1..200`                                    | Maximale Anzahl ausstehender/quarantänisierter Proposals pro Workspace. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Maximale Größe generierter Skill-/Support-Dateien.                   |

Empfohlene Profile:

```json5
// Konservativ: nur explizite Tool-Nutzung, keine automatische Erfassung.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review zuerst: automatisch erfassen, aber Genehmigung verlangen.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Vertrauenswürdige Automatisierung: sichere Proposals sofort schreiben.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Kostengünstig: kein Reviewer-LLM-Aufruf, nur explizite Korrekturphrasen.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Erfassungspfade

Skill Workshop hat drei Erfassungspfade.

### Tool-Vorschläge

Das Modell kann `skill_workshop` direkt aufrufen, wenn es einen wiederverwendbaren Ablauf sieht
oder wenn der Benutzer es auffordert, einen Skill zu speichern/aktualisieren.

Dies ist der expliziteste Pfad und funktioniert sogar mit `autoCapture: false`.

### Heuristische Erfassung

Wenn `autoCapture` aktiviert ist und `reviewMode` auf `heuristic` oder `hybrid` steht, scannt das
Plugin erfolgreiche Züge nach expliziten Benutzerkorrekturphrasen:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Die Heuristik erstellt ein Proposal aus der neuesten passenden Benutzeranweisung. Sie
verwendet Themenhinweise, um Skill-Namen für häufige Workflows auszuwählen:

- Aufgaben mit animierten GIFs -> `animated-gif-workflow`
- Screenshot- oder Asset-Aufgaben -> `screenshot-asset-workflow`
- QA- oder Szenario-Aufgaben -> `qa-scenario-workflow`
- GitHub-PR-Aufgaben -> `github-pr-workflow`
- Fallback -> `learned-workflows`

Die heuristische Erfassung ist absichtlich eng gefasst. Sie ist für klare Korrekturen und
wiederholbare Prozesshinweise gedacht, nicht für allgemeine Zusammenfassungen von Transkripten.

### LLM-Reviewer

Wenn `autoCapture` aktiviert ist und `reviewMode` auf `llm` oder `hybrid` steht, führt das Plugin
nach Erreichen von Schwellenwerten einen kompakten eingebetteten Reviewer aus.

Der Reviewer erhält:

- den aktuellen Transkripttext, begrenzt auf die letzten 12.000 Zeichen
- bis zu 12 bestehende Workspace-Skills
- bis zu 2.000 Zeichen aus jedem bestehenden Skill
- reine JSON-Anweisungen

Der Reviewer hat keine Tools:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Er kann zurückgeben:

```json
{ "action": "none" }
```

oder ein Skill-Proposal:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

Er kann auch an einen bestehenden Skill anhängen:

```json
{
  "action": "append",
  "skillName": "qa-scenario-workflow",
  "title": "QA Scenario Workflow",
  "reason": "Animated media QA needs reusable checks",
  "description": "QA scenario workflow.",
  "section": "Workflow",
  "body": "- For animated GIF tasks, verify frame count and attribution before passing."
}
```

Oder exakten Text in einem bestehenden Skill ersetzen:

```json
{
  "action": "replace",
  "skillName": "screenshot-asset-workflow",
  "title": "Screenshot Asset Workflow",
  "reason": "Old validation missed image optimization",
  "oldText": "- Replace the screenshot asset.",
  "newText": "- Replace the screenshot asset, preserve dimensions, optimize the PNG, and run the relevant validation gate."
}
```

Bevorzugen Sie `append` oder `replace`, wenn bereits ein relevanter Skill existiert. Verwenden Sie `create`
nur dann, wenn kein bestehender Skill passt.

## Proposal-Lebenszyklus

Jedes generierte Update wird zu einem Proposal mit:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- optional `agentId`
- optional `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` oder `reviewer`
- `status`
- `change`
- optional `scanFindings`
- optional `quarantineReason`

Proposal-Status:

- `pending` - wartet auf Genehmigung
- `applied` - geschrieben nach `<workspace>/skills`
- `rejected` - vom Operator/Modell abgelehnt
- `quarantined` - durch kritische Findings des Scanners blockiert

Der Zustand wird pro Workspace im Gateway-State-Verzeichnis gespeichert unter:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Pending- und quarantänisierte Proposals werden nach Skill-Name und Change-
Payload dedupliziert. Der Store behält die neuesten Pending-/quarantänisierten Proposals bis zu
`maxPending`.

## Tool-Referenz

Das Plugin registriert ein Agent-Tool:

```text
skill_workshop
```

### `status`

Zählt Proposals nach Zustand für den aktiven Workspace.

```json
{ "action": "status" }
```

Form des Ergebnisses:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

Listet Pending-Proposals auf.

```json
{ "action": "list_pending" }
```

Um einen anderen Status aufzulisten:

```json
{ "action": "list_pending", "status": "applied" }
```

Gültige Werte für `status`:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Listet quarantänisierte Proposals auf.

```json
{ "action": "list_quarantine" }
```

Verwenden Sie dies, wenn automatische Erfassung scheinbar nichts tut und in den Logs
`skill-workshop: quarantined <skill>` erscheint.

### `inspect`

Ruft ein Proposal per ID ab.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Erstellt ein Proposal. Mit `approvalPolicy: "pending"` wird dies standardmäßig in die Warteschlange gestellt.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

Einen sicheren Schreibvorgang erzwingen:

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

Pending erzwingen, selbst bei `approvalPolicy: "auto"`:

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

An einen Abschnitt anhängen:

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

Exakten Text ersetzen:

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

### `apply`

Wendet ein Pending-Proposal an.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` verweigert quarantänisierte Proposals:

```text
quarantined proposal cannot be applied
```

### `reject`

Markiert ein Proposal als abgelehnt.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Schreibt eine unterstützende Datei innerhalb eines bestehenden oder vorgeschlagenen Skill-Verzeichnisses.

Erlaubte Support-Verzeichnisse auf oberster Ebene:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

Beispiel:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

Support-Dateien sind auf den Workspace begrenzt, pfadgeprüft, durch
`maxSkillBytes` byte-begrenzt, werden gescannt und atomar geschrieben.

## Skill-Schreibvorgänge

Skill Workshop schreibt nur unter:

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill-Namen werden normalisiert:

- kleingeschrieben
- Folgen von Zeichen außerhalb von `[a-z0-9_-]` werden zu `-`
- führende/nachgestellte nicht alphanumerische Zeichen werden entfernt
- maximale Länge ist 80 Zeichen
- der finale Name muss auf `[a-z0-9][a-z0-9_-]{1,79}` passen

Für `create`:

- wenn der Skill nicht existiert, schreibt Skill Workshop ein neues `SKILL.md`
- wenn er bereits existiert, hängt Skill Workshop den Body an `## Workflow` an

Für `append`:

- wenn der Skill existiert, hängt Skill Workshop an den angeforderten Abschnitt an
- wenn er nicht existiert, erstellt Skill Workshop einen minimalen Skill und hängt dann an

Für `replace`:

- der Skill muss bereits existieren
- `oldText` muss exakt vorhanden sein
- nur die erste exakte Übereinstimmung wird ersetzt

Alle Schreibvorgänge sind atomar und aktualisieren den In-Memory-Snapshot der Skills sofort, sodass
der neue oder aktualisierte Skill ohne Neustart des Gateways sichtbar werden kann.

## Sicherheitsmodell

Skill Workshop hat einen Sicherheitsscanner für generierten `SKILL.md`-Inhalt und Support-
Dateien.

Kritische Findings verschieben Proposals in Quarantäne:

| Regel-ID                               | Blockiert Inhalte, die ...                                              |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | dem Agenten sagen, frühere/höhere Anweisungen zu ignorieren             |
| `prompt-injection-system`              | auf System-Prompts, Developer-Messages oder versteckte Anweisungen verweisen |
| `prompt-injection-tool`                | dazu ermutigen, Tool-Berechtigung/Genehmigung zu umgehen                |
| `shell-pipe-to-shell`                  | `curl`/`wget` enthalten, die in `sh`, `bash` oder `zsh` gepiped werden  |
| `secret-exfiltration`                  | den Eindruck erwecken, env-/Prozess-env-Daten über das Netzwerk zu senden |

Warn-Findings bleiben erhalten, blockieren aber für sich genommen nicht:

| Regel-ID             | Warnt bei ...                     |
| -------------------- | --------------------------------- |
| `destructive-delete` | breit gefassten Befehlen im Stil von `rm -rf` |
| `unsafe-permissions` | Berechtigungsverwendung im Stil von `chmod 777` |

Quarantänisierte Proposals:

- behalten `scanFindings`
- behalten `quarantineReason`
- erscheinen in `list_quarantine`
- können nicht über `apply` angewendet werden

Um sich von einem quarantänisierten Proposal zu erholen, erstellen Sie ein neues sicheres Proposal, bei dem der
unsichere Inhalt entfernt wurde. Bearbeiten Sie das Store-JSON nicht von Hand.

## Prompt-Anleitung

Wenn aktiviert, injiziert Skill Workshop einen kurzen Prompt-Abschnitt, der dem Agenten
sagt, `skill_workshop` für dauerhaftes prozedurales Memory zu verwenden.

Die Anleitung betont:

- Abläufe, nicht Fakten/Präferenzen
- Benutzerkorrekturen
- nicht offensichtliche erfolgreiche Abläufe
- wiederkehrende Fallstricke
- Reparatur veralteter/dünner/falscher Skills durch Anhängen/Ersetzen
- Speichern wiederverwendbarer Abläufe nach langen Tool-Schleifen oder schwierigen Fixes
- kurzen imperativen Skill-Text
- keine Transkript-Dumps

Der Text des Schreibmodus ändert sich mit `approvalPolicy`:

- Pending-Modus: Vorschläge in die Warteschlange stellen; erst nach expliziter Genehmigung anwenden
- Auto-Modus: sichere Workspace-Skill-Updates anwenden, wenn sie klar wiederverwendbar sind

## Kosten und Laufzeitverhalten

Heuristische Erfassung ruft kein Modell auf.

LLM-Review verwendet einen eingebetteten Lauf auf dem aktiven/Standard-Agent-Modell. Es
ist schwellenwertbasiert, sodass es standardmäßig nicht bei jedem Zug ausgeführt wird.

Der Reviewer:

- verwendet denselben konfigurierten Anbieter-/Modellkontext, wenn verfügbar
- greift auf Laufzeit-Standardwerte des Agenten zurück
- hat `reviewTimeoutMs`
- verwendet leichtgewichtigen Bootstrap-Kontext
- hat keine Tools
- schreibt nichts direkt
- kann nur ein Proposal ausgeben, das den normalen Scanner- und
  Genehmigungs-/Quarantänepfad durchläuft

Wenn der Reviewer fehlschlägt, ein Timeout erreicht oder ungültiges JSON zurückgibt, protokolliert das Plugin eine
Warn-/Debug-Meldung und überspringt diesen Review-Durchlauf.

## Betriebsmuster

Verwenden Sie Skill Workshop, wenn der Benutzer sagt:

- „next time, do X“
- „from now on, prefer Y“
- „make sure to verify Z“
- „save this as a workflow“
- „this took a while; remember the process“
- „update the local skill for this“

Guter Skill-Text:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Schlechter Skill-Text:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Gründe, warum die schlechte Version nicht gespeichert werden sollte:

- transkriptförmig
- nicht imperativ
- enthält verrauschte einmalige Details
- sagt dem nächsten Agenten nicht, was zu tun ist

## Debugging

Prüfen Sie, ob das Plugin geladen ist:

```bash
openclaw plugins list --enabled
```

Prüfen Sie Proposal-Zähler aus einem Agent-/Tool-Kontext:

```json
{ "action": "status" }
```

Pending-Proposals prüfen:

```json
{ "action": "list_pending" }
```

Quarantänisierte Proposals prüfen:

```json
{ "action": "list_quarantine" }
```

Häufige Symptome:

| Symptom                              | Wahrscheinliche Ursache                                                           | Prüfen                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Tool ist nicht verfügbar             | Plugin-Eintrag ist nicht aktiviert                                                | `plugins.entries.skill-workshop.enabled` und `openclaw plugins list` |
| Kein automatisches Proposal erscheint | `autoCapture: false`, `reviewMode: "off"` oder Schwellenwerte nicht erreicht     | Konfiguration, Proposal-Status, Gateway-Logs                        |
| Heuristik hat nicht erfasst          | Formulierung des Benutzers passte nicht zu Korrekturmustern                       | Verwenden Sie explizit `skill_workshop.suggest` oder aktivieren Sie den LLM-Reviewer |
| Reviewer hat kein Proposal erstellt  | Reviewer gab `none`, ungültiges JSON zurück oder lief in Timeout                  | Gateway-Logs, `reviewTimeoutMs`, Schwellenwerte                     |
| Proposal wird nicht angewendet       | `approvalPolicy: "pending"`                                                       | `list_pending`, dann `apply`                                        |
| Proposal ist aus Pending verschwunden | Doppelte Proposal wiederverwendet, Pruning wegen max. Pending oder angewendet/abgelehnt/quarantänisiert | `status`, `list_pending` mit Statusfiltern, `list_quarantine` |
| Skill-Datei existiert, aber das Modell verpasst sie | Skill-Snapshot nicht aktualisiert oder Skill-Gating schließt sie aus             | Status von `openclaw skills` und Eignung von Workspace-Skills       |

Relevante Logs:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA-Szenarien

Repo-gestützte QA-Szenarien:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

Führen Sie die deterministische Abdeckung aus:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

Führen Sie die Reviewer-Abdeckung aus:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Das Reviewer-Szenario ist absichtlich separat, weil es
`reviewMode: "llm"` aktiviert und den eingebetteten Reviewer-Durchlauf testet.

## Wann Auto-Apply nicht aktiviert werden sollte

Vermeiden Sie `approvalPolicy: "auto"`, wenn:

- der Workspace sensible Abläufe enthält
- der Agent mit nicht vertrauenswürdigen Eingaben arbeitet
- Skills mit einem breiten Team geteilt werden
- Sie Prompts oder Scanner-Regeln noch abstimmen
- das Modell häufig hostile Web-/E-Mail-Inhalte verarbeitet

Verwenden Sie zuerst den Pending-Modus. Wechseln Sie erst in den Auto-Modus, nachdem Sie geprüft haben, welche Art von
Skills der Agent in diesem Workspace vorschlägt.

## Zugehörige Dokumentation

- [Skills](/de/tools/skills)
- [Plugins](/de/tools/plugin)
- [Testing](/de/reference/test)
