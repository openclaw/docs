---
read_when:
    - Sie möchten deterministische mehrstufige Workflows mit expliziten Genehmigungen
    - Sie müssen einen Workflow fortsetzen, ohne frühere Schritte erneut auszuführen
summary: Typisierte Workflow-Laufzeit für OpenClaw mit wiederaufnehmbaren Genehmigungsschranken.
title: Lobster
x-i18n:
    generated_at: "2026-04-06T03:13:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1014945d104ef8fdca0d30be89e35136def1b274c6403b06de29e8502b8124b
    source_path: tools/lobster.md
    workflow: 15
---

# Lobster

Lobster ist eine Workflow-Shell, mit der OpenClaw mehrstufige Tool-Sequenzen als einen einzelnen, deterministischen Vorgang mit expliziten Genehmigungs-Checkpoints ausführen kann.

Lobster ist eine Authoring-Ebene über losgelöster Hintergrundarbeit. Für Flow-Orchestrierung oberhalb einzelner Aufgaben siehe [Task Flow](/de/automation/taskflow) (`openclaw tasks flow`). Für das Aktivitätsjournal von Aufgaben siehe [`openclaw tasks`](/de/automation/tasks).

## Hook

Ihr Assistent kann die Tools bauen, mit denen er sich selbst verwaltet. Fragen Sie nach einem Workflow, und 30 Minuten später haben Sie eine CLI plus Pipelines, die als ein Aufruf laufen. Lobster ist das fehlende Teil: deterministische Pipelines, explizite Genehmigungen und wiederaufnehmbarer Zustand.

## Warum

Heute erfordern komplexe Workflows viele Tool-Aufrufe mit Hin und Her. Jeder Aufruf kostet Tokens, und das LLM muss jeden Schritt orchestrieren. Lobster verlagert diese Orchestrierung in eine typisierte Laufzeit:

- **Ein Aufruf statt vieler**: OpenClaw führt einen einzelnen Lobster-Tool-Aufruf aus und erhält ein strukturiertes Ergebnis.
- **Genehmigungen integriert**: Nebenwirkungen (E-Mail senden, Kommentar posten) halten den Workflow an, bis er ausdrücklich genehmigt wird.
- **Wiederaufnehmbar**: Angehaltene Workflows geben ein Token zurück; Sie genehmigen und setzen fort, ohne alles erneut auszuführen.

## Warum ein DSL statt normaler Programme?

Lobster ist absichtlich klein gehalten. Das Ziel ist nicht „eine neue Sprache“, sondern eine vorhersagbare, KI-freundliche Pipeline-Spezifikation mit erstklassigen Genehmigungen und Resume-Tokens.

- **Genehmigen/Fortsetzen ist integriert**: Ein normales Programm kann einen Menschen auffordern, aber es kann nicht _anhalten und fortsetzen_ mit einem dauerhaften Token, ohne dass Sie diese Laufzeit selbst erfinden.
- **Determinismus + Auditierbarkeit**: Pipelines sind Daten und daher leicht zu protokollieren, zu diffen, erneut abzuspielen und zu prüfen.
- **Begrenzte Oberfläche für KI**: Eine kleine Grammatik + JSON-Piping reduziert „kreative“ Codepfade und macht Validierung realistisch.
- **Sicherheitsrichtlinie eingebaut**: Timeouts, Output-Obergrenzen, Sandbox-Prüfungen und Zulassungslisten werden von der Laufzeit erzwungen, nicht von jedem Skript.
- **Trotzdem programmierbar**: Jeder Schritt kann jede CLI oder jedes Skript aufrufen. Wenn Sie JS/TS möchten, generieren Sie `.lobster`-Dateien aus Code.

## So funktioniert es

OpenClaw führt Lobster-Workflows **im Prozess** mit einem eingebetteten Runner aus. Es wird kein externer CLI-Subprozess gestartet; die Workflow-Engine läuft innerhalb des Gateway-Prozesses und gibt direkt ein JSON-Envelope zurück.
Wenn die Pipeline für eine Genehmigung pausiert, gibt das Tool ein `resumeToken` zurück, sodass Sie später fortsetzen können.

## Muster: kleine CLI + JSON-Pipes + Genehmigungen

Bauen Sie kleine Befehle, die JSON sprechen, und verketten Sie sie dann zu einem einzelnen Lobster-Aufruf. (Die Befehlsnamen unten sind Beispiele — ersetzen Sie sie durch Ihre eigenen.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

Wenn die Pipeline eine Genehmigung anfordert, setzen Sie sie mit dem Token fort:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

KI löst den Workflow aus; Lobster führt die Schritte aus. Genehmigungsschranken machen Nebenwirkungen explizit und auditierbar.

Beispiel: Eingabeelemente in Tool-Aufrufe abbilden:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Nur-JSON-LLM-Schritte (llm-task)

Für Workflows, die einen **strukturierten LLM-Schritt** benötigen, aktivieren Sie das optionale
Plugin-Tool `llm-task` und rufen Sie es aus Lobster auf. So bleibt der Workflow
deterministisch, während Sie weiterhin mit einem Modell klassifizieren/zusammenfassen/entwerfen können.

Aktivieren Sie das Tool:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

Verwenden Sie es in einer Pipeline:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

Siehe [LLM Task](/de/tools/llm-task) für Details und Konfigurationsoptionen.

## Workflow-Dateien (.lobster)

Lobster kann YAML-/JSON-Workflow-Dateien mit den Feldern `name`, `args`, `steps`, `env`, `condition` und `approval` ausführen. Setzen Sie in OpenClaw-Tool-Aufrufen `pipeline` auf den Dateipfad.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

Hinweise:

- `stdin: $step.stdout` und `stdin: $step.json` übergeben die Ausgabe eines vorherigen Schritts.
- `condition` (oder `when`) kann Schritte anhand von `$step.approved` steuern.

## Lobster installieren

Gebündelte Lobster-Workflows laufen im Prozess; kein separates `lobster`-Binary ist erforderlich. Der eingebettete Runner wird mit dem Lobster-Plugin ausgeliefert.

Wenn Sie die eigenständige Lobster-CLI für Entwicklung oder externe Pipelines benötigen, installieren Sie sie aus dem [Lobster-Repo](https://github.com/openclaw/lobster) und stellen Sie sicher, dass `lobster` auf `PATH` liegt.

## Das Tool aktivieren

Lobster ist ein **optionales** Plugin-Tool (standardmäßig nicht aktiviert).

Empfohlen (additiv, sicher):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Oder pro Agent:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

Vermeiden Sie `tools.allow: ["lobster"]`, es sei denn, Sie möchten im restriktiven Allowlist-Modus arbeiten.

Hinweis: Zulassungslisten sind Opt-in für optionale Plugins. Wenn Ihre Zulassungsliste nur
Plugin-Tools nennt (wie `lobster`), lässt OpenClaw Core-Tools aktiviert. Um Core-
Tools einzuschränken, nehmen Sie auch die gewünschten Core-Tools oder -Gruppen in die Zulassungsliste auf.

## Beispiel: E-Mail-Triage

Ohne Lobster:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Mit Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Gibt ein JSON-Envelope zurück (gekürzt):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

Benutzer genehmigt → fortsetzen:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Ein Workflow. Deterministisch. Sicher.

## Tool-Parameter

### `run`

Eine Pipeline im Tool-Modus ausführen.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Eine Workflow-Datei mit Argumenten ausführen:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Einen angehaltenen Workflow nach der Genehmigung fortsetzen.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Optionale Eingaben

- `cwd`: Relatives Arbeitsverzeichnis für die Pipeline (muss innerhalb des Gateway-Arbeitsverzeichnisses bleiben).
- `timeoutMs`: Workflow abbrechen, wenn diese Dauer überschritten wird (Standard: 20000).
- `maxStdoutBytes`: Workflow abbrechen, wenn die Ausgabe diese Größe überschreitet (Standard: 512000).
- `argsJson`: JSON-String, der an `lobster run --args-json` übergeben wird (nur für Workflow-Dateien).

## Output-Envelope

Lobster gibt ein JSON-Envelope mit einem von drei Statuswerten zurück:

- `ok` → erfolgreich abgeschlossen
- `needs_approval` → pausiert; `requiresApproval.resumeToken` ist zum Fortsetzen erforderlich
- `cancelled` → ausdrücklich abgelehnt oder abgebrochen

Das Tool stellt das Envelope sowohl in `content` (formatiertes JSON) als auch in `details` (rohes Objekt) bereit.

## Genehmigungen

Wenn `requiresApproval` vorhanden ist, prüfen Sie den Prompt und entscheiden Sie:

- `approve: true` → fortsetzen und mit Nebenwirkungen weitermachen
- `approve: false` → den Workflow abbrechen und finalisieren

Verwenden Sie `approve --preview-from-stdin --limit N`, um Genehmigungsanfragen eine JSON-Vorschau anzuhängen, ohne benutzerdefinierten `jq`-/Heredoc-Glue. Resume-Tokens sind jetzt kompakt: Lobster speichert den Resume-Zustand des Workflows unter seinem State-Dir und gibt einen kleinen Token-Schlüssel zurück.

## OpenProse

OpenProse passt gut zu Lobster: Verwenden Sie `/prose`, um die Vorbereitung mit mehreren Agenten zu orchestrieren, und führen Sie dann eine Lobster-Pipeline für deterministische Genehmigungen aus. Wenn ein Prose-Programm Lobster benötigt, erlauben Sie das Tool `lobster` für Sub-Agenten über `tools.subagents.tools`. Siehe [OpenProse](/de/prose).

## Sicherheit

- **Nur lokal im Prozess** — Workflows werden innerhalb des Gateway-Prozesses ausgeführt; vom Plugin selbst erfolgen keine Netzwerkaufrufe.
- **Keine Geheimnisse** — Lobster verwaltet kein OAuth; es ruft OpenClaw-Tools auf, die das tun.
- **Sandbox-bewusst** — deaktiviert, wenn der Tool-Kontext gesandboxed ist.
- **Gehärtet** — Timeouts und Output-Obergrenzen werden vom eingebetteten Runner erzwungen.

## Fehlerbehebung

- **`lobster timed out`** → `timeoutMs` erhöhen oder eine lange Pipeline aufteilen.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` erhöhen oder die Ausgabegröße reduzieren.
- **`lobster returned invalid JSON`** → sicherstellen, dass die Pipeline im Tool-Modus läuft und nur JSON ausgibt.
- **`lobster failed`** → Gateway-Logs auf Fehlerdetails des eingebetteten Runners prüfen.

## Mehr erfahren

- [Plugins](/de/tools/plugin)
- [Plugin tool authoring](/de/plugins/building-plugins#registering-agent-tools)

## Fallstudie: Community-Workflows

Ein öffentliches Beispiel: eine CLI für ein „Second Brain“ plus Lobster-Pipelines, die drei Markdown-Vaults verwalten (persönlich, Partner, gemeinsam). Die CLI gibt JSON für Statistiken, Inbox-Listen und Stale-Scans aus; Lobster verkettet diese Befehle zu Workflows wie `weekly-review`, `inbox-triage`, `memory-consolidation` und `shared-task-sync`, jeweils mit Genehmigungsschranken. KI übernimmt Bewertungen (Kategorisierung), wenn verfügbar, und fällt andernfalls auf deterministische Regeln zurück.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Verwandt

- [Automation & Tasks](/de/automation) — Planung von Lobster-Workflows
- [Automation Overview](/de/automation) — alle Automatisierungsmechanismen
- [Tools Overview](/de/tools) — alle verfügbaren Agent-Tools
