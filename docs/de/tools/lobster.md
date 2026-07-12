---
read_when:
    - Sie möchten deterministische mehrstufige Workflows mit expliziten Genehmigungen
    - Sie müssen einen Workflow fortsetzen, ohne frühere Schritte erneut auszuführen
summary: Typisierte Workflow-Laufzeit für OpenClaw mit fortsetzbaren Genehmigungspunkten.
title: Lobster
x-i18n:
    generated_at: "2026-07-12T16:05:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster führt mehrstufige Tool-Pipelines als einen einzigen deterministischen Tool-Aufruf aus, mit
expliziten Genehmigungspunkten und Fortsetzungstoken. Es befindet sich eine Ebene über
abgekoppelter Hintergrundarbeit: Informationen zur Orchestrierung von Abläufen über viele abgekoppelte Aufgaben hinweg
finden Sie unter [TaskFlow](/de/automation/taskflow) (`openclaw tasks flow`); Informationen zum
Aktivitätsprotokoll der Aufgaben finden Sie unter [Hintergrundaufgaben](/de/automation/tasks).

## Warum

Ohne Lobster erfordert ein mehrstufiger Auftrag viele Tool-Aufrufe mit Hin- und Rückweg, wobei das
Modell jeden Schritt orchestriert. Lobster verlagert diese Orchestrierung in eine typisierte
Runtime:

- **Ein Aufruf statt vieler**: Ein einzelner Lobster-Tool-Aufruf gibt ein strukturiertes
  Ergebnis für die gesamte Pipeline zurück.
- **Integrierte Genehmigungen**: Seiteneffekte (Senden, Veröffentlichen, Löschen) halten den Workflow an,
  bis sie ausdrücklich genehmigt werden.
- **Fortsetzbar**: Ein angehaltener Workflow gibt ein Token zurück; Sie können ihn genehmigen und fortsetzen, ohne
  frühere Schritte erneut auszuführen.

Lobster ist eine kleine, eingeschränkte DSL statt einer universellen Skriptsprache:
Genehmigen/Fortsetzen ist ein dauerhaftes, integriertes Grundelement; Pipelines sind Daten (einfach zu
protokollieren, vergleichen, wiederholen und überprüfen); die kleine Grammatik begrenzt „kreative“ Codepfade, sodass
die Validierung realistisch bleibt; Zeitüberschreitungen, Ausgabebegrenzungen, Sandbox-Prüfungen und
Positivlisten werden von der Runtime durchgesetzt, nicht von jedem einzelnen Skript. Jeder Schritt kann dennoch
eine beliebige CLI oder ein beliebiges Skript aufrufen – generieren Sie `.lobster`-Dateien mit anderen Tools, wenn Sie
eine umfangreichere Erstellungssprache wünschen.

Ohne Lobster sieht eine wiederkehrende E-Mail-Sichtung folgendermaßen aus:

```text
Benutzer: „Prüfe meine E-Mails und entwirf Antworten“
→ openclaw ruft gmail.list auf
→ LLM fasst zusammen
→ Benutzer: „Entwirf Antworten auf Nr. 2 und Nr. 5“
→ LLM erstellt Entwürfe
→ Benutzer: „Sende Nr. 2“
→ openclaw ruft gmail.send auf
(täglich wiederholen, ohne Erinnerung daran, was gesichtet wurde)
```

Mit Lobster ist derselbe Auftrag ein einziger Aufruf, der zur Genehmigung anhält und anschließend fortgesetzt wird:

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 benötigen Antworten, 2 erfordern Maßnahmen" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "2 Antwortentwürfe senden?",
    "items": [],
    "resumeToken": "..."
  }
}
```

## Funktionsweise

OpenClaw führt Lobster-Workflows **prozessintern** mit dem gebündelten
Paket `@clawdbot/lobster` als eingebettetem Runner aus. Es wird kein externer `lobster`-
Unterprozess gestartet; der Tool-Aufruf gibt direkt einen JSON-Umschlag zurück. Wenn die
Pipeline zur Genehmigung anhält, enthält der Umschlag ein Fortsetzungstoken (oder eine kurze
Genehmigungs-ID), damit Sie sie später fortsetzen können.

## Aktivieren

Lobster ist ein **optionales** Plugin-Tool und standardmäßig nicht aktiviert. Es wird
gebündelt ausgeliefert, sodass kein separater Installationsschritt erforderlich ist – erlauben Sie einfach das Tool:

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
[Lobster-Repository](https://github.com/openclaw/lobster) und fügen Sie `lobster` zu
`PATH` hinzu.

## Muster: kleine CLI + JSON-Pipes + Genehmigungen

Erstellen Sie kleine Befehle, die JSON verwenden, und verketten Sie sie dann in einem einzigen Lobster-Aufruf.
(Die folgenden Beispielbefehlsnamen können Sie durch Ihre eigenen ersetzen.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Änderungen anwenden?'",
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

Beispiel: Eingabeelemente Tool-Aufrufen zuordnen:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## LLM-Schritte ausschließlich mit JSON (llm-task)

Aktivieren Sie für einen **strukturierten LLM-Schritt** innerhalb eines Workflows das optionale
Plugin-Tool `llm-task` und rufen Sie es über Lobster auf:

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

### Wichtige Einschränkung: eingebettetes Lobster gegenüber `openclaw.invoke`

Das gebündelte Lobster-Plugin führt Workflows **prozessintern** innerhalb des Gateways aus.
In diesem eingebetteten Modus übernimmt `openclaw.invoke` **nicht** automatisch einen
Gateway-URL-/Authentifizierungskontext für verschachtelte Tool-Aufrufe der OpenClaw-CLI.

Das bedeutet, dass dieses Muster **im eingebetteten Runner derzeit nicht zuverlässig ist**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Verwenden Sie das folgende Beispiel nur, wenn Sie die **eigenständige Lobster-CLI** in einer
Umgebung ausführen, in der `openclaw.invoke` bereits mit dem richtigen
Gateway-/Authentifizierungskontext konfiguriert ist.

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Gib anhand der Eingabe-E-Mail die Absicht und einen Entwurf zurück.",
  "thinking": "low",
  "input": { "subject": "Hallo", "body": "Können Sie helfen?" },
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

- einen direkten Tool-Aufruf von `llm-task` außerhalb von Lobster oder
- Schritte ohne `openclaw.invoke` innerhalb der Lobster-Pipeline, bis eine unterstützte
  eingebettete Brücke hinzugefügt wird.

Weitere Einzelheiten und Konfigurationsoptionen finden Sie unter [LLM-Aufgabe](/de/tools/llm-task).

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
- `condition` (oder `when`) kann Schritte abhängig von `$step.approved` steuern.

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

| Feld             | Standardwert | Hinweise                                                                                                            |
| ---------------- | ------------ | ------------------------------------------------------------------------------------------------------------------- |
| `pipeline`       | erforderlich | Inline-Pipeline-Zeichenfolge oder ein auf `.lobster`/`.yaml`/`.yml`/`.json` endender Pfad zu einer Workflow-Datei.   |
| `cwd`            | Gateway-cwd  | Relatives Arbeitsverzeichnis; muss innerhalb des Gateway-Arbeitsverzeichnisses aufgelöst werden (absolute Pfade werden abgelehnt). |
| `timeoutMs`      | `20000`      | Bricht die Ausführung bei Überschreitung ab.                                                                        |
| `maxStdoutBytes` | `512000`     | Bricht die Ausführung ab, wenn die erfasste Standardausgabe oder Standardfehlerausgabe diese Größe überschreitet.   |
| `argsJson`       | -            | JSON-Zeichenfolge mit Argumenten für eine Workflow-Datei (wird bei Inline-Pipelines ignoriert).                      |

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

### Verwalteter TaskFlow-Modus

Die Übergabe von `flowControllerId` und `flowGoal` bei `run` (oder `flowId` und
`flowExpectedRevision` bei `resume`) führt den Aufruf über die verwaltete
[TaskFlow](/de/automation/taskflow)-API der Plugin-Runtime, statt einen
reinen Umschlag zurückzugeben: OpenClaw erstellt einen dauerhaften Ablaufdatensatz oder setzt ihn fort, wendet den
Lobster-Umschlag darauf an (`waiting` bei einer Genehmigung, `succeeded`/`failed` beim
Abschluss) und gibt `{ ok, envelope, flow, mutation }` zurück. Dieser Modus erfordert
eine gebundene TaskFlow-Runtime und ist für Plugin-/Controller-Code vorgesehen, der
dauerhaften Ablaufstatus über Gateway-Neustarts hinweg benötigt, nicht für die typische spontane Nutzung durch Agenten.

## Ausgabeumschlag

Lobster gibt einen JSON-Umschlag mit einem von drei Statuswerten zurück:

- `ok` – erfolgreich abgeschlossen
- `needs_approval` – angehalten; `requiresApproval` enthält ein `resumeToken` und eine
  kurze `approvalId`, mit denen die Ausführung jeweils fortgesetzt werden kann
- `cancelled` – ausdrücklich abgelehnt oder abgebrochen

Das Tool stellt den Umschlag sowohl in `content` (formatiertes JSON) als auch in `details`
(Rohobjekt) bereit.

## Genehmigungen

Wenn `requiresApproval` vorhanden ist, prüfen Sie die Aufforderung und entscheiden Sie:

- `approve: true` – fortsetzen und Seiteneffekte ausführen
- `approve: false` – abbrechen und den Workflow abschließen

Verwenden Sie `approve --preview-from-stdin --limit N`, um Genehmigungsanfragen eine JSON-Vorschau
ohne benutzerdefinierte jq-/Heredoc-Verkettung hinzuzufügen. Der Fortsetzungsstatus wird als
kleine JSON-Dateien im Lobster-Statusverzeichnis (`~/.lobster/state` standardmäßig,
überschreibbar mit `LOBSTER_STATE_DIR`) gespeichert; das Token selbst codiert nur einen
Verweis auf diesen Status, nicht den vollständigen Pipeline-Status.

## OpenProse

OpenProse lässt sich gut mit Lobster kombinieren: Verwenden Sie `/prose`, um die Vorbereitung mit mehreren Agenten
zu orchestrieren, und führen Sie anschließend eine Lobster-Pipeline für deterministische Genehmigungen aus. Wenn ein Prose-
Programm Lobster benötigt, erlauben Sie das Tool `lobster` für Unteragenten über
`tools.subagents.tools`. Weitere Informationen finden Sie unter [OpenProse](/de/prose).

## Sicherheit

- **Nur lokal und prozessintern** – Workflows werden innerhalb des Gateway-Prozesses ausgeführt; das
  Plugin selbst führt keine Netzwerkaufrufe aus.
- **Keine Secrets** – Lobster verwaltet OAuth nicht; es ruft OpenClaw-Tools auf, die dies
  tun.
- **Sandbox-kompatibel** – deaktiviert, wenn sich der Tool-Kontext in einer Sandbox befindet.
- **Gehärtet** – Zeitüberschreitungen und Ausgabebegrenzungen werden vom eingebetteten Runner durchgesetzt.

## Fehlerbehebung

| Fehler                                                        | Ursache/Behebung                                                                      |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | Die Pipeline hat `timeoutMs` überschritten. Erhöhen Sie den Wert oder teilen Sie die Pipeline auf. |
| `lobster stdout exceeded maxStdoutBytes` (oder `stderr`)       | Die erfasste Ausgabe hat die Begrenzung überschritten. Erhöhen Sie `maxStdoutBytes` oder reduzieren Sie die Ausgabe. |
| `run --args-json must be valid JSON`                           | `argsJson` (bei Ausführungen von Workflow-Dateien) konnte nicht geparst werden. Korrigieren Sie die JSON-Zeichenfolge. |
| `lobster runtime failed` (oder eine andere `runtime_error`-Meldung) | Die eingebettete Runtime hat einen Fehlerumschlag zurückgegeben. Prüfen Sie die Gateway-Protokolle auf Details. |

## Weitere Informationen

- [Plugins](/de/tools/plugin)
- [Erstellung von Plugin-Tools](/de/plugins/building-plugins#registering-agent-tools)

## Fallstudie: Community-Workflows

Ein öffentliches Beispiel: eine „Second Brain“-CLI plus Lobster-Pipelines, die drei
Markdown-Vaults verwalten (persönlich, Partner, gemeinsam). Die CLI gibt JSON für Statistiken,
Posteingangslisten und Prüfungen auf veraltete Einträge aus; Lobster verkettet diese Befehle zu Workflows
wie `weekly-review`, `inbox-triage`, `memory-consolidation` und
`shared-task-sync`, jeweils mit Genehmigungspunkten. KI übernimmt, sofern verfügbar, Aufgaben, die
Urteilsvermögen erfordern (Kategorisierung), und greift andernfalls auf deterministische Regeln
zurück.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repository: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Verwandte Themen

- [Automatisierung](/de/automation) – alle Automatisierungsmechanismen
- [Werkzeugübersicht](/de/tools) – alle verfügbaren Agentenwerkzeuge
