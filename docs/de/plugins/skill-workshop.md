---
read_when:
    - Sie möchten, dass Agenten Korrekturen oder wiederverwendbare Verfahren in Skills für den Arbeitsbereich umwandeln
    - Sie konfigurieren den prozeduralen Skills-Speicher
    - Sie debuggen das Verhalten des Tools skill_workshop
    - Sie entscheiden, ob Sie die automatische Erstellung von Skills aktivieren möchten
summary: Experimentelle Erfassung wiederverwendbarer Abläufe als Arbeitsbereichs-Skills mit Prüfung, Genehmigung, Quarantäne und Skill-Aktualisierung im laufenden Betrieb
title: Skill-Workshop-Plugin
x-i18n:
    generated_at: "2026-05-06T06:59:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c4259777823d256bd00374858b9f47d310e727db360db37f9ba7ad3583d9dc
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop ist **experimentell**. Es ist standardmäßig deaktiviert, seine Capture-Heuristiken und Reviewer-Prompts können sich zwischen Releases ändern, und automatische Schreibvorgänge sollten nur in vertrauenswürdigen Workspaces verwendet werden, nachdem zuerst die Ausgabe im Pending-Modus geprüft wurde.

Skill Workshop ist prozedurales Gedächtnis für Workspace-Skills. Es ermöglicht einem Agenten, wiederverwendbare Workflows, Nutzerkorrekturen, hart erarbeitete Fehlerbehebungen und wiederkehrende Fallstricke in `SKILL.md`-Dateien unter folgendem Pfad umzuwandeln:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Dies unterscheidet sich vom Langzeitgedächtnis:

- **Gedächtnis** speichert Fakten, Präferenzen, Entitäten und früheren Kontext.
- **Skills** speichern wiederverwendbare Verfahren, denen der Agent bei zukünftigen Aufgaben folgen soll.
- **Skill Workshop** ist die Brücke von einem nützlichen Durchlauf zu einem dauerhaften Workspace-Skill, mit Sicherheitsprüfungen und optionaler Genehmigung.

Skill Workshop ist nützlich, wenn der Agent ein Verfahren lernt, etwa:

- wie extern bezogene animierte GIF-Assets validiert werden
- wie Screenshot-Assets ersetzt und Abmessungen überprüft werden
- wie ein repo-spezifisches QA-Szenario ausgeführt wird
- wie ein wiederkehrender Provider-Fehler debuggt wird
- wie eine veraltete lokale Workflow-Notiz repariert wird

Es ist nicht gedacht für:

- Fakten wie „der Nutzer mag Blau“
- breites autobiografisches Gedächtnis
- rohe Transkriptarchivierung
- Secrets, Zugangsdaten oder versteckten Prompt-Text
- einmalige Anweisungen, die sich nicht wiederholen

## Standardzustand

Das gebündelte Plugin ist **experimentell** und **standardmäßig deaktiviert**, sofern es nicht ausdrücklich in `plugins.entries.skill-workshop` aktiviert wird.

Das Plugin-Manifest setzt nicht `enabledByDefault: true`. Der Standardwert `enabled: true` im Konfigurationsschema des Plugins gilt erst, nachdem der Plugin-Eintrag bereits ausgewählt und geladen wurde.

Experimentell bedeutet:

- das Plugin ist ausreichend unterstützt für Opt-in-Tests und Dogfooding
- Vorschlagsspeicherung, Reviewer-Schwellenwerte und Capture-Heuristiken können sich weiterentwickeln
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
- können schwellenwertbasierte Reviewer-Durchläufe Skill-Aktualisierungen vorschlagen
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

`approvalPolicy: "auto"` verwendet weiterhin denselben Scanner und Quarantänepfad. Es wendet keine Vorschläge mit kritischen Befunden an.

## Konfiguration

| Schlüssel            | Standard    | Bereich / Werte                            | Bedeutung                                                            |
| -------------------- | ----------- | ------------------------------------------ | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                    | Aktiviert das Plugin, nachdem der Plugin-Eintrag geladen wurde.      |
| `autoCapture`        | `true`      | boolean                                    | Aktiviert Capture/Review nach erfolgreichen Agenten-Durchläufen.     |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                      | Vorschläge einreihen oder sichere Vorschläge automatisch schreiben.   |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Wählt explizites Korrektur-Capture, LLM-Reviewer, beides oder nichts. |
| `reviewInterval`     | `15`        | `1..200`                                   | Reviewer nach so vielen erfolgreichen Durchläufen ausführen.         |
| `reviewMinToolCalls` | `8`         | `1..500`                                   | Reviewer nach so vielen beobachteten Tool-Aufrufen ausführen.        |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                             | Timeout für den eingebetteten Reviewer-Durchlauf.                    |
| `maxPending`         | `50`        | `1..200`                                   | Maximale Anzahl ausstehender/quarantänisierter Vorschläge pro Workspace. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                             | Maximale Größe generierter Skill-/Support-Dateien.                   |

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

## Capture-Pfade

Skill Workshop hat drei Capture-Pfade.

### Tool-Vorschläge

Das Modell kann `skill_workshop` direkt aufrufen, wenn es ein wiederverwendbares Verfahren erkennt oder wenn der Nutzer darum bittet, einen Skill zu speichern oder zu aktualisieren.

Dies ist der expliziteste Pfad und funktioniert auch mit `autoCapture: false`.

### Heuristisches Capture

Wenn `autoCapture` aktiviert ist und `reviewMode` auf `heuristic` oder `hybrid` steht, scannt das Plugin erfolgreiche Durchläufe nach ausdrücklichen Korrekturformulierungen des Nutzers:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Die Heuristik erstellt einen Vorschlag aus der neuesten passenden Nutzeranweisung. Sie verwendet Themenhinweise, um Skill-Namen für häufige Workflows auszuwählen:

- Aufgaben mit animierten GIFs -> `animated-gif-workflow`
- Screenshot- oder Asset-Aufgaben -> `screenshot-asset-workflow`
- QA- oder Szenarioaufgaben -> `qa-scenario-workflow`
- GitHub-PR-Aufgaben -> `github-pr-workflow`
- Fallback -> `learned-workflows`

Heuristisches Capture ist absichtlich eng gefasst. Es ist für klare Korrekturen und wiederholbare Prozessnotizen gedacht, nicht für allgemeine Transkriptzusammenfassungen.

### LLM-Reviewer

Wenn `autoCapture` aktiviert ist und `reviewMode` auf `llm` oder `hybrid` steht, führt das Plugin nach Erreichen der Schwellenwerte einen kompakten eingebetteten Reviewer aus.

Der Reviewer erhält:

- den jüngsten Transkripttext, begrenzt auf die letzten 12.000 Zeichen
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

## Lebenszyklus von Vorschlägen

Jede generierte Aktualisierung wird zu einem Vorschlag mit:

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

Vorschlagsstatus:

- `pending` - wartet auf Genehmigung
- `applied` - in `<workspace>/skills` geschrieben
- `rejected` - vom Operator/Modell abgelehnt
- `quarantined` - durch kritische Scanner-Befunde blockiert

Der Status wird pro Workspace im Gateway-Statusverzeichnis gespeichert:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Ausstehende und quarantäneisolierte Vorschläge werden nach Skill-Name und Änderungs-Payload dedupliziert. Der Speicher behält die neuesten ausstehenden/quarantäneisolierten Vorschläge bis zu `maxPending`.

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

Listet quarantäneisolierte Vorschläge auf.

```json
{ "action": "list_quarantine" }
```

Verwenden Sie dies, wenn die automatische Erfassung scheinbar nichts tut und die Logs `skill-workshop: quarantined <skill>` erwähnen.

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
  <Accordion title="Sicheres Schreiben erzwingen (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="Ausstehend unter automatischer Richtlinie erzwingen (apply: false)">

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

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` lehnt quarantäneisolierte Vorschläge ab:

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

Supportdateien sind arbeitsbereichsbezogen, pfadgeprüft, durch `maxSkillBytes`
bytebegrenzt, gescannt und werden atomar geschrieben.

## Skill-Schreibvorgänge

Skill Workshop schreibt nur unter:

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill-Namen werden normalisiert:

- in Kleinbuchstaben umgewandelt
- Folgen von Nicht-`[a-z0-9_-]` werden zu `-`
- führende/abschließende Nicht-Alphanumerika werden entfernt
- maximale Länge ist 80 Zeichen
- endgültiger Name muss `[a-z0-9][a-z0-9_-]{1,79}` entsprechen

Für `create`:

- wenn der Skill nicht existiert, schreibt Skill Workshop eine neue `SKILL.md`
- wenn er bereits existiert, hängt Skill Workshop den Inhalt an `## Workflow` an

Für `append`:

- wenn der Skill existiert, hängt Skill Workshop an den angeforderten Abschnitt an
- wenn er nicht existiert, erstellt Skill Workshop einen minimalen Skill und hängt dann an

Für `replace`:

- der Skill muss bereits existieren
- `oldText` muss exakt vorhanden sein
- nur der erste exakte Treffer wird ersetzt

Alle Schreibvorgänge sind atomar und aktualisieren den In-Memory-Snapshot der Skills sofort, sodass
der neue oder aktualisierte Skill ohne Gateway-Neustart sichtbar werden kann.

## Sicherheitsmodell

Skill Workshop verfügt über einen Sicherheitsscanner für generierte `SKILL.md`-Inhalte und
Supportdateien.

Kritische Befunde stellen Vorschläge unter Quarantäne:

| Regel-ID                               | Blockiert Inhalte, die ...                                            |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | den Agent anweisen, frühere/höhere Anweisungen zu ignorieren          |
| `prompt-injection-system`              | System-Prompts, Developer-Nachrichten oder versteckte Anweisungen erwähnen |
| `prompt-injection-tool`                | dazu ermutigen, Tool-Berechtigungen/Genehmigungen zu umgehen          |
| `shell-pipe-to-shell`                  | `curl`/`wget` enthalten, das an `sh`, `bash` oder `zsh` weitergeleitet wird |
| `secret-exfiltration`                  | anscheinend Env-/Prozess-Env-Daten über das Netzwerk senden           |

Warnbefunde werden beibehalten, blockieren aber für sich genommen nicht:

| Regel-ID             | Warnt bei ...                     |
| -------------------- | --------------------------------- |
| `destructive-delete` | breiten Befehlen im Stil von `rm -rf` |
| `unsafe-permissions` | Berechtigungsnutzung im Stil von `chmod 777` |

Unter Quarantäne gestellte Vorschläge:

- behalten `scanFindings`
- behalten `quarantineReason`
- erscheinen in `list_quarantine`
- können nicht über `apply` angewendet werden

Um einen unter Quarantäne gestellten Vorschlag wiederherzustellen, erstellen Sie einen neuen sicheren Vorschlag, aus dem
der unsichere Inhalt entfernt wurde. Bearbeiten Sie das Store-JSON nicht von Hand.

## Prompt-Hinweise

Wenn aktiviert, fügt Skill Workshop einen kurzen Prompt-Abschnitt ein, der den Agent anweist,
`skill_workshop` für dauerhafte prozedurale Erinnerung zu verwenden.

Die Hinweise betonen:

- Prozeduren, nicht Fakten/Präferenzen
- Korrekturen durch Benutzer
- nicht offensichtliche erfolgreiche Prozeduren
- wiederkehrende Fallstricke
- Reparatur veralteter/dünner/falscher Skills durch Anhängen/Ersetzen
- Speichern wiederverwendbarer Prozeduren nach langen Tool-Schleifen oder schwierigen Fehlerbehebungen
- kurze imperative Skill-Texte
- keine Transkript-Dumps

Der Schreibmodus-Text ändert sich mit `approvalPolicy`:

- Pending-Modus: Vorschläge in die Warteschlange stellen; nur nach ausdrücklicher Genehmigung anwenden
- Auto-Modus: sichere Workspace-Skill-Updates anwenden, wenn sie klar wiederverwendbar sind

## Kosten und Laufzeitverhalten

Heuristische Erfassung ruft kein Modell auf.

LLM-Review verwendet einen eingebetteten Lauf auf dem aktiven/standardmäßigen Agent-Modell. Sie ist
schwellenwertbasiert, sodass sie standardmäßig nicht bei jedem Turn ausgeführt wird.

Der Reviewer:

- verwendet den gleichen konfigurierten Provider-/Modellkontext, wenn verfügbar
- fällt auf die Laufzeit-Standards des Agent zurück
- hat `reviewTimeoutMs`
- verwendet leichtgewichtigen Bootstrap-Kontext
- hat keine Tools
- schreibt nichts direkt
- kann nur einen Vorschlag ausgeben, der den normalen Scanner- und
  Genehmigungs-/Quarantänepfad durchläuft

Wenn der Reviewer fehlschlägt, eine Zeitüberschreitung hat oder ungültiges JSON zurückgibt, protokolliert das Plugin eine
Warn-/Debug-Meldung und überspringt diesen Review-Durchlauf.

## Betriebsmuster

Verwenden Sie Skill Workshop, wenn der Benutzer sagt:

- "beim nächsten Mal X tun"
- "ab jetzt Y bevorzugen"
- "sicherstellen, dass Z verifiziert wird"
- "dies als Workflow speichern"
- "das hat eine Weile gedauert; merken Sie sich den Prozess"
- "den lokalen Skill hierfür aktualisieren"

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
- sagt dem nächsten Agent nicht, was zu tun ist

## Debugging

Prüfen, ob das Plugin geladen ist:

```bash
openclaw plugins list --enabled
```

Vorschlagsanzahlen aus einem Agent-/Tool-Kontext prüfen:

```json
{ "action": "status" }
```

Ausstehende Vorschläge prüfen:

```json
{ "action": "list_pending" }
```

Unter Quarantäne gestellte Vorschläge prüfen:

```json
{ "action": "list_quarantine" }
```

Häufige Symptome:

| Symptom                              | Wahrscheinliche Ursache                                                             | Prüfung                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Tool ist nicht verfügbar             | Plugin-Eintrag ist nicht aktiviert                                                  | `plugins.entries.skill-workshop.enabled` und `openclaw plugins list` |
| Kein automatischer Vorschlag erscheint | `autoCapture: false`, `reviewMode: "off"` oder Schwellenwerte nicht erreicht        | Konfiguration, Vorschlagsstatus, Gateway-Logs                        |
| Heuristik hat nicht erfasst          | Benutzerformulierung passte nicht zu Korrekturmustern                               | Explizites `skill_workshop.suggest` verwenden oder LLM-Reviewer aktivieren |
| Reviewer hat keinen Vorschlag erstellt | Reviewer gab `none` oder ungültiges JSON zurück oder hatte eine Zeitüberschreitung  | Gateway-Logs, `reviewTimeoutMs`, Schwellenwerte                      |
| Vorschlag wird nicht angewendet      | `approvalPolicy: "pending"`                                                         | `list_pending`, dann `apply`                                         |
| Vorschlag ist aus Pending verschwunden | Doppelter Vorschlag wiederverwendet, maximale Pending-Bereinigung oder angewendet/abgelehnt/quarantänisiert | `status`, `list_pending` mit Statusfiltern, `list_quarantine`        |
| Skill-Datei existiert, aber Modell übersieht sie | Skill-Snapshot nicht aktualisiert oder Skill-Gating schließt sie aus                | `openclaw skills`-Status und Eignung des Workspace-Skills            |

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

## Wann Auto-Anwenden nicht aktiviert werden sollte

Vermeiden Sie `approvalPolicy: "auto"`, wenn:

- der Workspace sensible Prozeduren enthält
- der Agent an nicht vertrauenswürdiger Eingabe arbeitet
- Skills in einem breiten Team geteilt werden
- Sie Prompts oder Scanner-Regeln noch feinabstimmen
- das Modell häufig feindliche Web-/E-Mail-Inhalte verarbeitet

Verwenden Sie zuerst den Pending-Modus. Wechseln Sie erst dann in den Auto-Modus, nachdem Sie die Art von
Skills geprüft haben, die der Agent in diesem Workspace vorschlägt.

## Zugehörige Dokumentation

- [Skills](/de/tools/skills)
- [Plugins](/de/tools/plugin)
- [Tests](/de/reference/test)
