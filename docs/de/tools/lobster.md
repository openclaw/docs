---
read_when:
    - Sie möchten deterministische mehrstufige Workflows mit expliziten Freigaben
    - Sie müssen einen Workflow fortsetzen, ohne frühere Schritte erneut auszuführen
summary: Typisierte Workflow-Laufzeitumgebung für OpenClaw mit fortsetzbaren Genehmigungs-Gates.
title: Hummer
x-i18n:
    generated_at: "2026-04-30T07:18:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1700bcfdbcf4558cb908935834e9059221d0d26ad78ed6f9e2158f7e0b83edbd
    source_path: tools/lobster.md
    workflow: 16
---

Lobster ist eine Workflow-Shell, mit der OpenClaw mehrstufige Tool-Sequenzen als eine einzelne, deterministische Operation mit expliziten Genehmigungs-Checkpoints ausführen kann.

Lobster ist eine Authoring-Ebene über abgekoppelter Hintergrundarbeit. Für Flow-Orchestrierung oberhalb einzelner Aufgaben siehe [TaskFlow](/de/automation/taskflow) (`openclaw tasks flow`). Für das Aufgabenaktivitätsprotokoll siehe [`openclaw tasks`](/de/automation/tasks).

## Hook

Ihr Assistent kann die Tools erstellen, mit denen er sich selbst verwaltet. Fordern Sie einen Workflow an, und 30 Minuten später haben Sie eine CLI plus Pipelines, die als ein einziger Aufruf laufen. Lobster ist das fehlende Element: deterministische Pipelines, explizite Genehmigungen und fortsetzbarer Zustand.

## Warum

Komplexe Workflows erfordern heute viele Tool-Aufrufe im Hin und Her. Jeder Aufruf kostet Tokens, und das LLM muss jeden Schritt orchestrieren. Lobster verlagert diese Orchestrierung in eine typisierte Runtime:

- **Ein Aufruf statt vieler**: OpenClaw führt einen Lobster-Tool-Aufruf aus und erhält ein strukturiertes Ergebnis.
- **Genehmigungen integriert**: Seiteneffekte (E-Mail senden, Kommentar posten) halten den Workflow an, bis sie explizit genehmigt werden.
- **Fortsetzbar**: Angehaltene Workflows geben ein Token zurück; genehmigen und fortsetzen, ohne alles erneut auszuführen.

## Warum eine DSL statt einfacher Programme?

Lobster ist bewusst klein gehalten. Das Ziel ist nicht „eine neue Sprache“, sondern eine vorhersehbare, KI-freundliche Pipeline-Spezifikation mit Genehmigungen und Fortsetzungs-Tokens als Grundfunktionen.

- **Genehmigen/Fortsetzen ist integriert**: Ein normales Programm kann einen Menschen um Eingabe bitten, aber es kann nicht mit einem dauerhaften Token _pausieren und fortgesetzt werden_, ohne dass Sie diese Runtime selbst erfinden.
- **Determinismus + Auditierbarkeit**: Pipelines sind Daten, daher lassen sie sich leicht protokollieren, vergleichen, erneut abspielen und prüfen.
- **Begrenzte Oberfläche für KI**: Eine kleine Grammatik + JSON-Piping reduziert „kreative“ Codepfade und macht Validierung realistisch.
- **Sicherheitsrichtlinie eingebaut**: Timeouts, Ausgabelimits, Sandbox-Prüfungen und Allowlists werden von der Runtime durchgesetzt, nicht von jedem einzelnen Skript.
- **Trotzdem programmierbar**: Jeder Schritt kann jede CLI oder jedes Skript aufrufen. Wenn Sie JS/TS verwenden möchten, generieren Sie `.lobster`-Dateien aus Code.

## Funktionsweise

OpenClaw führt Lobster-Workflows **in-process** mit einem eingebetteten Runner aus. Es wird kein externer CLI-Subprozess gestartet; die Workflow-Engine läuft im Gateway-Prozess und gibt direkt einen JSON-Umschlag zurück.
Wenn die Pipeline für eine Genehmigung pausiert, gibt das Tool ein `resumeToken` zurück, damit Sie später fortfahren können.

## Muster: kleine CLI + JSON-Pipes + Genehmigungen

Erstellen Sie kleine Befehle, die JSON sprechen, und verketten Sie sie dann zu einem einzigen Lobster-Aufruf. (Die folgenden Beispielbefehlsnamen können Sie durch Ihre eigenen ersetzen.)

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

KI löst den Workflow aus; Lobster führt die Schritte aus. Genehmigungs-Gates halten Seiteneffekte explizit und auditierbar.

Beispiel: Eingabeelemente in Tool-Aufrufe abbilden:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Reine JSON-LLM-Schritte (llm-task)

Aktivieren Sie für Workflows, die einen **strukturierten LLM-Schritt** benötigen, das optionale
Plugin-Tool `llm-task` und rufen Sie es aus Lobster auf. So bleibt der Workflow
deterministisch, während Sie weiterhin mit einem Modell klassifizieren, zusammenfassen oder Entwürfe erstellen können.

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

Details und Konfigurationsoptionen finden Sie unter [LLM Task](/de/tools/llm-task).

## Workflow-Dateien (.lobster)

Lobster kann YAML/JSON-Workflow-Dateien mit den Feldern `name`, `args`, `steps`, `env`, `condition` und `approval` ausführen. Setzen Sie in OpenClaw-Tool-Aufrufen `pipeline` auf den Dateipfad.

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
- `condition` (oder `when`) kann Schritte auf Basis von `$step.approved` steuern.

## Lobster installieren

Gebündelte Lobster-Workflows laufen in-process; es ist keine separate `lobster`-Binärdatei erforderlich. Der eingebettete Runner wird mit dem Lobster-Plugin ausgeliefert.

Wenn Sie die eigenständige Lobster-CLI für Entwicklung oder externe Pipelines benötigen, installieren Sie sie aus dem [Lobster-Repo](https://github.com/openclaw/lobster) und stellen Sie sicher, dass `lobster` in `PATH` verfügbar ist.

## Tool aktivieren

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

Verwenden Sie `tools.allow: ["lobster"]` nur, wenn Sie bewusst im restriktiven Allowlist-Modus arbeiten möchten.

<Note>
Allowlists sind für optionale Plugins Opt-in. Wenn Ihre Allowlist nur Plugin-Tools nennt (wie `lobster`), lässt OpenClaw Core-Tools aktiviert. Um Core-Tools einzuschränken, nehmen Sie auch die gewünschten Core-Tools oder -Gruppen in die Allowlist auf.
</Note>

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

Gibt einen JSON-Umschlag zurück (gekürzt):

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

Führen Sie eine Pipeline im Tool-Modus aus.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Führen Sie eine Workflow-Datei mit Argumenten aus:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Setzen Sie einen angehaltenen Workflow nach der Genehmigung fort.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Optionale Eingaben

- `cwd`: Relatives Arbeitsverzeichnis für die Pipeline (muss innerhalb des Gateway-Arbeitsverzeichnisses bleiben).
- `timeoutMs`: Bricht den Workflow ab, wenn er diese Dauer überschreitet (Standard: 20000).
- `maxStdoutBytes`: Bricht den Workflow ab, wenn die Ausgabe diese Größe überschreitet (Standard: 512000).
- `argsJson`: JSON-String, der an `lobster run --args-json` übergeben wird (nur Workflow-Dateien).

## Ausgabe-Umschlag

Lobster gibt einen JSON-Umschlag mit einem von drei Statuswerten zurück:

- `ok` → erfolgreich abgeschlossen
- `needs_approval` → pausiert; `requiresApproval.resumeToken` ist zum Fortsetzen erforderlich
- `cancelled` → explizit abgelehnt oder abgebrochen

Das Tool stellt den Umschlag sowohl in `content` (formatiertes JSON) als auch in `details` (Rohobjekt) bereit.

## Genehmigungen

Wenn `requiresApproval` vorhanden ist, prüfen Sie den Prompt und entscheiden Sie:

- `approve: true` → fortsetzen und Seiteneffekte ausführen
- `approve: false` → abbrechen und den Workflow abschließen

Verwenden Sie `approve --preview-from-stdin --limit N`, um Genehmigungsanforderungen ohne eigenen jq-/Heredoc-Klebecode eine JSON-Vorschau anzuhängen. Fortsetzungs-Tokens sind jetzt kompakt: Lobster speichert den Workflow-Fortsetzungszustand in seinem Zustandsverzeichnis und gibt einen kleinen Token-Schlüssel zurück.

## OpenProse

OpenProse passt gut zu Lobster: Verwenden Sie `/prose`, um die Vorbereitung mit mehreren Agenten zu orchestrieren, und führen Sie anschließend eine Lobster-Pipeline für deterministische Genehmigungen aus. Wenn ein Prose-Programm Lobster benötigt, erlauben Sie das Tool `lobster` für Sub-Agents über `tools.subagents.tools`. Siehe [OpenProse](/de/prose).

## Sicherheit

- **Nur lokal in-process** — Workflows werden im Gateway-Prozess ausgeführt; keine Netzwerkaufrufe durch das Plugin selbst.
- **Keine Secrets** — Lobster verwaltet kein OAuth; es ruft OpenClaw-Tools auf, die das tun.
- **Sandbox-bewusst** — deaktiviert, wenn der Tool-Kontext in einer Sandbox läuft.
- **Gehärtet** — Timeouts und Ausgabelimits werden vom eingebetteten Runner durchgesetzt.

## Fehlerbehebung

- **`lobster timed out`** → erhöhen Sie `timeoutMs` oder teilen Sie eine lange Pipeline auf.
- **`lobster output exceeded maxStdoutBytes`** → erhöhen Sie `maxStdoutBytes` oder reduzieren Sie die Ausgabegröße.
- **`lobster returned invalid JSON`** → stellen Sie sicher, dass die Pipeline im Tool-Modus läuft und nur JSON ausgibt.
- **`lobster failed`** → prüfen Sie die Gateway-Logs auf Fehlerdetails des eingebetteten Runners.

## Mehr erfahren

- [Plugins](/de/tools/plugin)
- [Plugin-Tool-Authoring](/de/plugins/building-plugins#registering-agent-tools)

## Fallstudie: Community-Workflows

Ein öffentliches Beispiel: eine „Second Brain“-CLI plus Lobster-Pipelines, die drei Markdown-Vaults verwalten (persönlich, Partner, gemeinsam). Die CLI gibt JSON für Statistiken, Inbox-Listen und Scans auf veraltete Inhalte aus; Lobster verkettet diese Befehle zu Workflows wie `weekly-review`, `inbox-triage`, `memory-consolidation` und `shared-task-sync`, jeweils mit Genehmigungs-Gates. KI übernimmt, wenn verfügbar, die Bewertung (Kategorisierung) und fällt andernfalls auf deterministische Regeln zurück.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Verwandt

- [Automatisierung & Aufgaben](/de/automation) — Lobster-Workflows planen
- [Automatisierungsüberblick](/de/automation) — alle Automatisierungsmechanismen
- [Tool-Überblick](/de/tools) — alle verfügbaren Agent-Tools
