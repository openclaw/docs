---
read_when:
    - Sie möchten, dass Agenten Korrekturen oder wiederverwendbare Abläufe in Skills für den Arbeitsbereich umwandeln
    - Sie konfigurieren prozedurales Skill-Gedächtnis
    - Sie debuggen das Verhalten des Tools skill_workshop
    - Sie entscheiden, ob Sie die automatische Skills-Erstellung aktivieren möchten
summary: Experimentelle Erfassung wiederverwendbarer Verfahren als Arbeitsbereichs-Skills mit Prüfung, Genehmigung, Quarantäne und Hot-Refresh von Skills
title: Skill-Workshop-Plugin
x-i18n:
    generated_at: "2026-05-07T13:24:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7dc89644a1ac1d7400b8a03d7a132c1e836b3aca96e66018710945637d5c393
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop ist **experimentell**. Es ist standardmäßig deaktiviert, seine Erfassungsheuristiken und Reviewer-Prompts können sich zwischen Releases ändern, und automatische Schreibvorgänge sollten nur in vertrauenswürdigen Workspaces verwendet werden, nachdem zuerst die Ausgabe im Pending-Modus geprüft wurde.

Skill Workshop ist prozedurales Gedächtnis für Workspace-Skills. Es ermöglicht einem Agenten, wiederverwendbare Workflows, Benutzerkorrekturen, mühsam erarbeitete Fehlerbehebungen und wiederkehrende Fallstricke in `SKILL.md`-Dateien unter folgendem Pfad umzuwandeln:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Dies unterscheidet sich von Langzeitgedächtnis:

- **Gedächtnis** speichert Fakten, Präferenzen, Entitäten und früheren Kontext.
- **Skills** speichern wiederverwendbare Verfahren, die der Agent bei zukünftigen Aufgaben befolgen sollte.
- **Skill Workshop** ist die Brücke von einem nützlichen Durchlauf zu einem dauerhaften Workspace-Skill, mit Sicherheitsprüfungen und optionaler Genehmigung.

Skill Workshop ist nützlich, wenn der Agent ein Verfahren lernt, zum Beispiel:

- wie extern bezogene animierte GIF-Assets validiert werden
- wie Screenshot-Assets ersetzt und Abmessungen verifiziert werden
- wie ein repo-spezifisches QA-Szenario ausgeführt wird
- wie ein wiederkehrender Provider-Fehler debuggt wird
- wie eine veraltete lokale Workflow-Notiz repariert wird

Es ist nicht gedacht für:

- Fakten wie „der Benutzer mag Blau“
- breite autobiografische Erinnerung
- rohe Transkriptarchivierung
- Secrets, Anmeldedaten oder versteckten Prompt-Text
- einmalige Anweisungen, die sich nicht wiederholen werden

## Standardzustand

Das gebündelte Plugin ist **experimentell** und **standardmäßig deaktiviert**, sofern es nicht explizit in `plugins.entries.skill-workshop` aktiviert wird.

Das Plugin-Manifest setzt nicht `enabledByDefault: true`. Der Standardwert `enabled: true` im Plugin-Konfigurationsschema gilt nur, nachdem der Plugin-Eintrag bereits ausgewählt und geladen wurde.

Experimentell bedeutet:

- das Plugin wird ausreichend für Opt-in-Tests und Dogfooding unterstützt
- Vorschlagsspeicherung, Reviewer-Schwellenwerte und Erfassungsheuristiken können sich weiterentwickeln
- ausstehende Genehmigung ist der empfohlene Startmodus
- automatische Anwendung ist für vertrauenswürdige persönliche oder Workspace-Setups gedacht, nicht für gemeinsam genutzte oder feindliche Umgebungen mit viel Eingabe

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
- werden explizite wiederverwendbare Korrekturen als ausstehende Vorschläge eingereiht
- können schwellenwertbasierte Reviewer-Durchläufe Skill-Updates vorschlagen
- wird keine Skill-Datei geschrieben, bis ein ausstehender Vorschlag angewendet wird

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

`approvalPolicy: "auto"` verwendet weiterhin denselben Scanner- und Quarantänepfad. Es wendet keine Vorschläge mit kritischen Befunden an.

## Konfiguration

| Schlüssel            | Standard    | Bereich / Werte                            | Bedeutung                                                            |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Aktiviert das Plugin, nachdem der Plugin-Eintrag geladen wurde.      |
| `autoCapture`        | `true`      | boolean                                     | Aktiviert Erfassung/Review nach erfolgreichen Agent-Durchläufen.     |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Vorschläge einreihen oder sichere Vorschläge automatisch schreiben.  |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Wählt explizite Korrekturerfassung, LLM-Reviewer, beides oder keines. |
| `reviewInterval`     | `15`        | `1..200`                                    | Reviewer nach so vielen erfolgreichen Durchläufen ausführen.         |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Reviewer nach so vielen beobachteten Tool-Aufrufen ausführen.        |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Timeout für den eingebetteten Reviewer-Durchlauf.                    |
| `maxPending`         | `50`        | `1..200`                                    | Maximale Anzahl ausstehender/quarantänisierter Vorschläge pro Workspace. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Maximale Größe generierter Skill-/Unterstützungsdateien.             |

Empfohlene Profile:

```json5
// Conservative: explicit tool use only, no automatic capture.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: capture automatically, but require approval.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: write safe proposals immediately.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: no reviewer LLM call, only explicit correction phrases.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Erfassungspfade

Skill Workshop hat drei Erfassungspfade.

### Tool-Vorschläge

Das Modell kann `skill_workshop` direkt aufrufen, wenn es ein wiederverwendbares Verfahren erkennt oder wenn der Benutzer es bittet, einen Skill zu speichern oder zu aktualisieren.

Dies ist der expliziteste Pfad und funktioniert auch mit `autoCapture: false`.

### Heuristische Erfassung

Wenn `autoCapture` aktiviert ist und `reviewMode` `heuristic` oder `hybrid` ist, durchsucht das Plugin erfolgreiche Durchläufe nach expliziten Benutzerkorrekturphrasen:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Die Heuristik erstellt einen Vorschlag aus der neuesten passenden Benutzeranweisung. Sie verwendet Themenhinweise, um Skill-Namen für häufige Workflows zu wählen:

- Aufgaben mit animierten GIFs -> `animated-gif-workflow`
- Screenshot- oder Asset-Aufgaben -> `screenshot-asset-workflow`
- QA- oder Szenarioaufgaben -> `qa-scenario-workflow`
- GitHub-PR-Aufgaben -> `github-pr-workflow`
- Fallback -> `learned-workflows`

Die heuristische Erfassung ist absichtlich eng gefasst. Sie ist für klare Korrekturen und wiederholbare Prozessnotizen gedacht, nicht für allgemeine Transkriptzusammenfassungen.

### LLM-Reviewer

Wenn `autoCapture` aktiviert ist und `reviewMode` `llm` oder `hybrid` ist, führt das Plugin einen kompakten eingebetteten Reviewer aus, nachdem Schwellenwerte erreicht wurden.

Der Reviewer erhält:

- den aktuellen Transkripttext, begrenzt auf die letzten 12.000 Zeichen
- bis zu 12 vorhandene Workspace-Skills
- bis zu 2.000 Zeichen aus jedem vorhandenen Skill
- reine JSON-Anweisungen

Der Reviewer hat keine Tools:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Der Reviewer gibt entweder `{ "action": "none" }` oder einen Vorschlag zurück. Das Feld `action` ist `create`, `append` oder `replace` - bevorzugen Sie `append`/`replace`, wenn bereits ein relevanter Skill existiert; verwenden Sie `create` nur, wenn kein vorhandener Skill passt.

Beispiel für `create`:

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

`append` fügt `section` + `body` hinzu. `replace` ersetzt `oldText` durch `newText` im benannten Skill.

## Vorschlagslebenszyklus

Jedes generierte Update wird zu einem Vorschlag mit:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- optionalem `agentId`
- optionalem `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` oder `reviewer`
- `status`
- `change`
- optionalen `scanFindings`
- optionalem `quarantineReason`

Vorschlagsstatus:

- `pending` - wartet auf Genehmigung
- `applied` - nach `<workspace>/skills` geschrieben
- `rejected` - vom Operator/Modell abgelehnt
- `quarantined` - durch kritische Scanner-Befunde blockiert

Der Status wird pro Workspace im Gateway-Statusverzeichnis gespeichert:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Ausstehende und in Quarantäne verschobene Vorschläge werden anhand des Skill-Namens und des Änderungs-
Payloads dedupliziert. Der Store behält die neuesten ausstehenden/in Quarantäne verschobenen Vorschläge bis
`maxPending`.

## Tool-Referenz

Das Plugin registriert ein Agent-Tool:

```text
skill_workshop
```

### `status`

Zählt Vorschläge nach Status für den aktiven Workspace.

```json
{ "action": "status" }
```

Ergebnisform:

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

Listet ausstehende Vorschläge auf.

```json
{ "action": "list_pending" }
```

So listen Sie einen anderen Status auf:

```json
{ "action": "list_pending", "status": "applied" }
```

Gültige `status`-Werte:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Listet in Quarantäne verschobene Vorschläge auf.

```json
{ "action": "list_quarantine" }
```

Verwenden Sie dies, wenn die automatische Erfassung scheinbar nichts tut und die Logs
`skill-workshop: quarantined <skill>` erwähnen.

### `inspect`

Ruft einen Vorschlag anhand der ID ab.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Erstellt einen Vorschlag. Mit `approvalPolicy: "pending"` (Standard) wird dieser in die Warteschlange gestellt, statt geschrieben zu werden.

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

<AccordionGroup>
  <Accordion title="Sofortiges Schreiben im Auto-Modus anfordern (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

Mit `approvalPolicy: "pending"` stellt `apply: true` den Vorschlag weiterhin in die Warteschlange. Prüfen Sie ihn und verwenden Sie dann
die Aktion `apply` nach der Genehmigung.

  </Accordion>

  <Accordion title="Unter Auto-Policy als ausstehend erzwingen (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="An einen benannten Abschnitt anhängen">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="Exakten Text ersetzen">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

Wendet einen ausstehenden Vorschlag an.

Mit `approvalPolicy: "pending"` fragt diese Aktion vor dem Schreiben des
Workspace-Skills nach Operator-Genehmigung.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` lehnt in Quarantäne verschobene Vorschläge ab:

```text
quarantined proposal cannot be applied
```

### `reject`

Markiert einen Vorschlag als abgelehnt.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Schreibt eine unterstützende Datei in ein vorhandenes oder vorgeschlagenes Skill-Verzeichnis.

Zulässige Support-Verzeichnisse auf oberster Ebene:

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

Unterstützungsdateien sind auf den Workspace beschränkt, pfadgeprüft, durch
`maxSkillBytes` bytebegrenzt, werden gescannt und atomar geschrieben.

## Skill-Schreibvorgänge

Skill Workshop schreibt nur unter:

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill-Namen werden normalisiert:

- in Kleinbuchstaben umgewandelt
- Folgen von Nicht-`[a-z0-9_-]` werden zu `-`
- führende/abschließende Nicht-Alphanumerika werden entfernt
- die maximale Länge beträgt 80 Zeichen
- der endgültige Name muss `[a-z0-9][a-z0-9_-]{1,79}` entsprechen

Für `create`:

- wenn der Skill nicht existiert, schreibt Skill Workshop eine neue `SKILL.md`
- wenn er bereits existiert, hängt Skill Workshop den Body an `## Workflow` an

Für `append`:

- wenn der Skill existiert, hängt Skill Workshop an den angeforderten Abschnitt an
- wenn er nicht existiert, erstellt Skill Workshop einen minimalen Skill und hängt dann an

Für `replace`:

- der Skill muss bereits existieren
- `oldText` muss exakt vorhanden sein
- nur der erste exakte Treffer wird ersetzt

Alle Schreibvorgänge sind atomar und aktualisieren den In-Memory-Skills-Snapshot sofort, sodass
der neue oder aktualisierte Skill ohne Gateway-Neustart sichtbar werden kann.

## Sicherheitsmodell

Skill Workshop verfügt über einen Sicherheitsscanner für generierte `SKILL.md`-Inhalte und Unterstützungsdateien.

Kritische Befunde stellen Vorschläge unter Quarantäne:

| Regel-ID                               | Blockiert Inhalte, die ...                                             |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | den Agent anweisen, vorherige/höhere Anweisungen zu ignorieren         |
| `prompt-injection-system`              | System-Prompts, Entwicklernachrichten oder versteckte Anweisungen referenzieren |
| `prompt-injection-tool`                | das Umgehen von Tool-Berechtigungen/Genehmigungen fördern              |
| `shell-pipe-to-shell`                  | `curl`/`wget` per Pipe an `sh`, `bash` oder `zsh` übergeben            |
| `secret-exfiltration`                  | anscheinend Env-/Prozess-Env-Daten über das Netzwerk senden            |

Warnbefunde bleiben erhalten, blockieren aber nicht für sich allein:

| Regel-ID             | Warnt bei ...                    |
| -------------------- | -------------------------------- |
| `destructive-delete` | breiten Befehlen im Stil von `rm -rf` |
| `unsafe-permissions` | Berechtigungsnutzung im Stil von `chmod 777` |

Unter Quarantäne gestellte Vorschläge:

- behalten `scanFindings`
- behalten `quarantineReason`
- erscheinen in `list_quarantine`
- können nicht über `apply` angewendet werden

Um einen unter Quarantäne gestellten Vorschlag wiederherzustellen, erstellen Sie einen neuen sicheren Vorschlag, aus dem
der unsichere Inhalt entfernt wurde. Bearbeiten Sie das Store-JSON nicht von Hand.

## Prompt-Anleitung

Wenn aktiviert, fügt Skill Workshop einen kurzen Prompt-Abschnitt ein, der den Agent anweist,
`skill_workshop` für dauerhaften prozeduralen Speicher zu verwenden.

Die Anleitung betont:

- Verfahren, nicht Fakten/Präferenzen
- Korrekturen durch Benutzer
- nicht offensichtliche erfolgreiche Verfahren
- wiederkehrende Fallstricke
- Reparatur veralteter/dünner/falscher Skills durch Anhängen/Ersetzen
- Speichern wiederverwendbarer Verfahren nach langen Tool-Schleifen oder schwierigen Korrekturen
- kurze imperative Skill-Texte
- keine Transkript-Dumps

Der Schreibmodustext ändert sich mit `approvalPolicy`:

- Pending-Modus: Vorschläge in die Warteschlange stellen; `apply` nach ausdrücklicher Genehmigung verwenden
- Auto-Modus: sichere Workspace-Skill-Aktualisierungen anwenden, sofern nicht `apply: false` stattdessen in die Warteschlange stellt

## Kosten und Laufzeitverhalten

Heuristische Erfassung ruft kein Modell auf.

LLM-Review verwendet einen eingebetteten Lauf auf dem aktiven/standardmäßigen Agent-Modell. Sie ist
schwellenwertbasiert, sodass sie standardmäßig nicht in jedem Turn läuft.

Der Reviewer:

- verwendet den gleichen konfigurierten Provider-/Modellkontext, wenn verfügbar
- fällt auf Runtime-Agent-Standards zurück
- hat `reviewTimeoutMs`
- verwendet leichtgewichtigen Bootstrap-Kontext
- hat keine Tools
- schreibt nichts direkt
- kann nur einen Vorschlag ausgeben, der den normalen Scanner- und
  Genehmigungs-/Quarantänepfad durchläuft

Wenn der Reviewer fehlschlägt, ein Timeout erreicht oder ungültiges JSON zurückgibt, protokolliert das Plugin eine
Warn-/Debugmeldung und überspringt diesen Review-Durchlauf.

## Betriebsmuster

Verwenden Sie Skill Workshop, wenn der Benutzer sagt:

- "next time, do X"
- "from now on, prefer Y"
- "make sure to verify Z"
- "save this as a workflow"
- "this took a while; remember the process"
- "update the local skill for this"

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
- enthält störende einmalige Details
- sagt dem nächsten Agent nicht, was zu tun ist

## Debugging

Prüfen Sie, ob das Plugin geladen ist:

```bash
openclaw plugins list --enabled
```

Vorschlagszahlen aus einem Agent-/Tool-Kontext prüfen:

```json
{ "action": "status" }
```

Ausstehende Vorschläge prüfen:

```json
{ "action": "list_pending" }
```

Vorschläge in Quarantäne prüfen:

```json
{ "action": "list_quarantine" }
```

Häufige Symptome:

| Symptom                              | Wahrscheinliche Ursache                                                            | Prüfung                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Tool ist nicht verfügbar             | Plugin-Eintrag ist nicht aktiviert                                                  | `plugins.entries.skill-workshop.enabled` und `openclaw plugins list` |
| Kein automatischer Vorschlag erscheint | `autoCapture: false`, `reviewMode: "off"` oder Schwellenwerte nicht erreicht       | Konfiguration, Vorschlagsstatus, Gateway-Logs                        |
| Heuristik hat nicht erfasst          | Benutzerformulierung passte nicht zu Korrekturmustern                               | Explizites `skill_workshop.suggest` verwenden oder LLM-Reviewer aktivieren |
| Reviewer hat keinen Vorschlag erstellt | Reviewer gab `none`, ungültiges JSON zurück oder erreichte ein Timeout             | Gateway-Logs, `reviewTimeoutMs`, Schwellenwerte                      |
| Vorschlag wird nicht angewendet      | `approvalPolicy: "pending"`                                                         | `list_pending`, dann `apply`                                         |
| Vorschlag ist aus Pending verschwunden | Doppelter Vorschlag wiederverwendet, maximales Pending-Pruning oder angewendet/abgelehnt/quarantänisiert | `status`, `list_pending` mit Statusfiltern, `list_quarantine`        |
| Skill-Datei existiert, aber Modell übersieht sie | Skill-Snapshot nicht aktualisiert oder Skill-Gating schließt sie aus              | Status von `openclaw skills` und Workspace-Skill-Eignung             |

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

Deterministische Abdeckung ausführen:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

Reviewer-Abdeckung ausführen:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Das Reviewer-Szenario ist absichtlich separat, weil es
`reviewMode: "llm"` aktiviert und den eingebetteten Reviewer-Durchlauf ausübt.

## Wann Auto-Anwendung nicht aktiviert werden sollte

Vermeiden Sie `approvalPolicy: "auto"`, wenn:

- der Workspace sensible Verfahren enthält
- der Agent mit nicht vertrauenswürdiger Eingabe arbeitet
- Skills in einem breiten Team geteilt werden
- Sie Prompts oder Scanner-Regeln noch abstimmen
- das Modell häufig feindliche Web-/E-Mail-Inhalte verarbeitet

Verwenden Sie zuerst den Pending-Modus. Wechseln Sie erst dann in den Auto-Modus, nachdem Sie die Art von
Skills geprüft haben, die der Agent in diesem Workspace vorschlägt.

## Zugehörige Dokumentation

- [Skills](/de/tools/skills)
- [Plugins](/de/tools/plugin)
- [Testing](/de/reference/test)
