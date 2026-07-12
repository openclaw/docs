---
read_when:
    - Sie möchten deterministische mehrstufige Workflows mit ausdrücklichen Genehmigungen.
    - Sie müssen einen Workflow fortsetzen, ohne frühere Schritte erneut auszuführen
summary: Typisierte Workflow-Laufzeit für OpenClaw mit fortsetzbaren Freigabeschranken.
title: Hummer
x-i18n:
    generated_at: "2026-07-12T02:14:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster führt mehrstufige Tool-Pipelines als einen einzigen deterministischen Tool-Aufruf aus, mit
expliziten Genehmigungsprüfpunkten und Fortsetzungstoken. Es befindet sich eine Ebene über
abgekoppelter Hintergrundarbeit: Informationen zur Orchestrierung von Abläufen über viele abgekoppelte Aufgaben hinweg
finden Sie unter [Task Flow](/de/automation/taskflow) (`openclaw tasks flow`); Informationen zum
Aktivitätsprotokoll der Aufgaben finden Sie unter [Hintergrundaufgaben](/de/automation/tasks).

## Warum

Ohne Lobster erfordert ein mehrstufiger Auftrag viele Tool-Aufrufe mit Hin- und Rückgabe, wobei das
Modell jeden Schritt orchestriert. Lobster verlagert diese Orchestrierung in eine typisierte
Laufzeitumgebung:

- **Ein Aufruf statt vieler**: Ein einziger Lobster-Tool-Aufruf gibt ein strukturiertes
  Ergebnis für die gesamte Pipeline zurück.
- **Integrierte Genehmigungen**: Nebeneffekte (Senden, Veröffentlichen, Löschen) halten den Workflow an,
  bis sie ausdrücklich genehmigt werden.
- **Fortsetzbar**: Ein angehaltener Workflow gibt ein Token zurück; genehmigen Sie ihn und setzen Sie ihn fort, ohne
  frühere Schritte erneut auszuführen.

Lobster ist eine kleine, eingeschränkte DSL und keine allgemeine Skriptsprache:
Genehmigen/Fortsetzen ist ein dauerhaftes, integriertes Grundelement; Pipelines sind Daten (einfach zu
protokollieren, vergleichen, wiederzugeben und zu prüfen); die kleine Grammatik begrenzt „kreative“ Codepfade, sodass
die Validierung realistisch bleibt; Zeitüberschreitungen, Ausgabebegrenzungen, Sandbox-Prüfungen und
Positivlisten werden von der Laufzeitumgebung erzwungen, nicht von jedem einzelnen Skript. Jeder Schritt kann weiterhin
jede CLI oder jedes Skript aufrufen – generieren Sie `.lobster`-Dateien mit anderen Werkzeugen, wenn Sie
eine ausdrucksstärkere Erstellungssprache wünschen.

Ohne Lobster sieht eine wiederkehrende E-Mail-Sichtung folgendermaßen aus:

```text
Benutzer: „Prüfen Sie meine E-Mails und entwerfen Sie Antworten“
→ openclaw ruft gmail.list auf
→ LLM fasst zusammen
→ Benutzer: „Entwerfen Sie Antworten auf Nr. 2 und Nr. 5“
→ LLM erstellt Entwürfe
→ Benutzer: „Senden Sie Nr. 2“
→ openclaw ruft gmail.send auf
(tägliche Wiederholung, ohne Erinnerung daran, was gesichtet wurde)
```

Mit Lobster ist derselbe Auftrag ein einzelner Aufruf, der zur Genehmigung anhält und anschließend fortgesetzt wird:

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

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

## Funktionsweise

OpenClaw führt Lobster-Workflows **prozessintern** aus und verwendet dabei das gebündelte
Paket `@clawdbot/lobster` als eingebetteten Runner. Es wird kein externer `lobster`-
Unterprozess gestartet; der Tool-Aufruf gibt direkt einen JSON-Umschlag zurück. Wenn die
Pipeline zur Genehmigung anhält, enthält der Umschlag ein Fortsetzungstoken (oder eine kurze
Genehmigungs-ID), sodass Sie später fortfahren können.

## Aktivieren

Lobster ist ein **optionales** Plugin-Tool und standardmäßig nicht aktiviert. Es wird
gebündelt ausgeliefert, daher ist kein separater Installationsschritt erforderlich – erlauben Sie einfach das Tool:

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

<Note>
`alsoAllow` fügt `lobster` zusätzlich zum aktiven Tool-Profil hinzu, ohne
andere Kern-Tools einzuschränken. Verwenden Sie `tools.allow` nur, wenn Sie stattdessen einen restriktiven
Positivlistenmodus wünschen.
</Note>

Für Tool-Kontexte in einer Sandbox ist das Tool vollständig deaktiviert.

Wenn Sie die eigenständige Lobster-CLI für die Entwicklung oder externe Pipelines
(außerhalb des eingebetteten Gateway-Runners) benötigen, installieren Sie sie aus dem
[Lobster-Repository](https://github.com/openclaw/lobster) und nehmen Sie `lobster` in
`PATH` auf.

## Muster: kleine CLI + JSON-Pipes + Genehmigungen

Erstellen Sie kleine Befehle, die JSON verarbeiten, und verketten Sie sie anschließend in einem einzigen Lobster-Aufruf.
(Die folgenden Befehlsnamen sind Beispiele – ersetzen Sie sie durch Ihre eigenen.)

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

Beispiel: Eingabeelemente auf Tool-Aufrufe abbilden:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Ausschließlich JSON verwendende LLM-Schritte (llm-task)

Aktivieren Sie für einen **strukturierten LLM-Schritt** innerhalb eines Workflows das optionale
Plugin-Tool `llm-task` und rufen Sie es aus Lobster auf:

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
        "tools": { "alsoAllow": ["llm-task"] }
      }
    ]
  }
}
```

### Wichtige Einschränkung: eingebettetes Lobster im Vergleich zu `openclaw.invoke`

Das gebündelte Lobster-Plugin führt Workflows **prozessintern** innerhalb des Gateway aus.
In diesem eingebetteten Modus übernimmt `openclaw.invoke` **nicht** automatisch einen
Gateway-URL-/Authentifizierungskontext für verschachtelte OpenClaw-CLI-Tool-Aufrufe.

Das bedeutet, dass dieses Muster **derzeit im eingebetteten Runner nicht zuverlässig ist**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Verwenden Sie das folgende Beispiel nur, wenn Sie die **eigenständige Lobster-CLI** in einer
Umgebung ausführen, in der `openclaw.invoke` bereits mit dem richtigen
Gateway-/Authentifizierungskontext konfiguriert ist.

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

Wenn Sie derzeit das eingebettete Lobster-Plugin verwenden, bevorzugen Sie entweder:

- einen direkten `llm-task`-Tool-Aufruf außerhalb von Lobster oder
- Schritte ohne `openclaw.invoke` innerhalb der Lobster-Pipeline, bis eine unterstützte
  eingebettete Bridge hinzugefügt wird.

Weitere Informationen und Konfigurationsoptionen finden Sie unter [LLM-Aufgabe](/de/tools/llm-task).

## Workflow-Dateien (.lobster)

Lobster kann YAML-/JSON-Workflow-Dateien mit den Feldern `name`, `args`, `steps`, `env`,
`condition` und `approval` ausführen. Setzen Sie `pipeline` im Tool-Aufruf auf den Dateipfad.

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
- `condition` (oder `when`) kann Schritte abhängig von `$step.approved` ausführen.

## Tool-Parameter

### `run`

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

| Feld             | Standardwert | Hinweise                                                                                                                       |
| ---------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `pipeline`       | erforderlich | Inline-Pipeline-Zeichenfolge oder ein auf `.lobster`/`.yaml`/`.yml`/`.json` endender Pfad zu einer Workflow-Datei.              |
| `cwd`            | Gateway-CWD  | Relatives Arbeitsverzeichnis; muss innerhalb des Gateway-Arbeitsverzeichnisses aufgelöst werden (absolute Pfade werden abgelehnt). |
| `timeoutMs`      | `20000`      | Bricht die Ausführung ab, wenn der Wert überschritten wird.                                                                    |
| `maxStdoutBytes` | `512000`     | Bricht die Ausführung ab, wenn die erfasste Standardausgabe oder Standardfehlerausgabe diese Größe überschreitet.               |
| `argsJson`       | -            | JSON-Zeichenfolge mit Argumenten für eine Workflow-Datei (wird bei Inline-Pipelines ignoriert).                                 |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` akzeptiert entweder `token` (das vollständige Fortsetzungstoken aus `requiresApproval`)
oder `approvalId` (die kurze ID aus demselben Objekt) – verwenden Sie den Wert, den die angehaltene
Ausführung zurückgegeben hat. `approve` ist erforderlich.

### Verwalteter Task-Flow-Modus

Die Übergabe von `flowControllerId` und `flowGoal` bei `run` (oder `flowId` und
`flowExpectedRevision` bei `resume`) leitet den Aufruf über die verwaltete
[Task-Flow](/de/automation/taskflow)-API der Plugin-Laufzeitumgebung, anstatt
einen einfachen Umschlag zurückzugeben: OpenClaw erstellt einen dauerhaften Ablaufdatensatz oder setzt ihn fort, wendet den
Lobster-Umschlag darauf an (`waiting` bei Genehmigung, `succeeded`/`failed` bei
Abschluss) und gibt `{ ok, envelope, flow, mutation }` zurück. Dieser Modus erfordert
eine gebundene Task-Flow-Laufzeitumgebung und ist für Plugin-/Controller-Code vorgesehen, der
einen dauerhaften Ablaufstatus über Gateway-Neustarts hinweg benötigt, nicht für die typische spontane Nutzung durch Agenten.

## Ausgabeumschlag

Lobster gibt einen JSON-Umschlag mit einem von drei Statuswerten zurück:

- `ok` – erfolgreich abgeschlossen
- `needs_approval` – pausiert; `requiresApproval` enthält ein `resumeToken` und eine
  kurze `approvalId`, mit denen die Ausführung jeweils fortgesetzt werden kann
- `cancelled` – ausdrücklich abgelehnt oder abgebrochen

Das Tool stellt den Umschlag sowohl in `content` (formatiertes JSON) als auch in `details`
(Rohobjekt) bereit.

## Genehmigungen

Wenn `requiresApproval` vorhanden ist, prüfen Sie die Aufforderung und entscheiden Sie:

- `approve: true` – fortsetzen und mit Nebeneffekten fortfahren
- `approve: false` – abbrechen und den Workflow abschließen

Verwenden Sie `approve --preview-from-stdin --limit N`, um Genehmigungsanforderungen eine JSON-Vorschau hinzuzufügen,
ohne eigene jq-/Heredoc-Verknüpfungen zu benötigen. Der Fortsetzungsstatus wird als
kleine JSON-Dateien im Lobster-Statusverzeichnis gespeichert (standardmäßig `~/.lobster/state`,
mit `LOBSTER_STATE_DIR` überschreibbar); das Token selbst kodiert lediglich einen
Verweis auf diesen Status, nicht den vollständigen Pipeline-Status.

## OpenProse

OpenProse ergänzt Lobster gut: Verwenden Sie `/prose`, um die Vorbereitung durch mehrere Agenten
zu orchestrieren, und führen Sie anschließend eine Lobster-Pipeline für deterministische Genehmigungen aus. Wenn ein Prose-
Programm Lobster benötigt, erlauben Sie das Tool `lobster` für Unteragenten über
`tools.subagents.tools`. Weitere Informationen finden Sie unter [OpenProse](/de/prose).

## Sicherheit

- **Nur lokal und prozessintern** – Workflows werden innerhalb des Gateway-Prozesses ausgeführt; das
  Plugin selbst führt keine Netzwerkaufrufe aus.
- **Keine Geheimnisse** – Lobster verwaltet kein OAuth; es ruft OpenClaw-Tools auf, die
  dies übernehmen.
- **Sandbox-konform** – deaktiviert, wenn sich der Tool-Kontext in einer Sandbox befindet.
- **Gehärtet** – Zeitüberschreitungen und Ausgabebegrenzungen werden vom eingebetteten Runner erzwungen.

## Fehlerbehebung

| Fehler                                                        | Ursache/Behebung                                                                                                  |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | Die Pipeline hat `timeoutMs` überschritten. Erhöhen Sie den Wert oder teilen Sie die Pipeline auf.                 |
| `lobster stdout exceeded maxStdoutBytes` (oder `stderr`)       | Die erfasste Ausgabe hat die Begrenzung überschritten. Erhöhen Sie `maxStdoutBytes` oder reduzieren Sie die Ausgabe. |
| `run --args-json must be valid JSON`                           | `argsJson` (Ausführungen von Workflow-Dateien) konnte nicht analysiert werden. Korrigieren Sie die JSON-Zeichenfolge. |
| `lobster runtime failed` (oder eine andere `runtime_error`-Meldung) | Die eingebettete Laufzeitumgebung hat einen Fehlerumschlag zurückgegeben. Prüfen Sie die Gateway-Protokolle auf Details. |

## Weitere Informationen

- [Plugins](/de/tools/plugin)
- [Erstellung von Plugin-Tools](/de/plugins/building-plugins#registering-agent-tools)

## Fallstudie: Community-Workflows

Ein öffentliches Beispiel: eine „zweites Gehirn“-CLI mit Lobster-Pipelines, die drei Markdown-Tresore verwalten (persönlich, Partner, gemeinsam). Die CLI gibt JSON für Statistiken, Posteingangslisten und Scans nach veralteten Inhalten aus. Lobster verkettet diese Befehle zu Workflows wie `weekly-review`, `inbox-triage`, `memory-consolidation` und `shared-task-sync`, jeweils mit Freigabeschritten. Die KI übernimmt, sofern verfügbar, Entscheidungen (Kategorisierung) und greift andernfalls auf deterministische Regeln zurück.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repository: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Verwandte Themen

- [Automatisierung](/de/automation) – alle Automatisierungsmechanismen
- [Werkzeugübersicht](/de/tools) – alle verfügbaren Agentenwerkzeuge
