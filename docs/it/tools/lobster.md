---
read_when:
    - Vuoi workflow deterministici multi-step con approvazioni esplicite
    - Hai bisogno di riprendere un workflow senza rieseguire i passaggi precedenti
summary: Runtime di workflow tipizzato per OpenClaw con gate di approvazione riprendibili.
title: Lobster
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T09:06:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1dbd73cc90091d02862af183a2f8658d6cbe6623c100baf7992b5e18041edb
    source_path: tools/lobster.md
    workflow: 15
---

Lobster è una shell di workflow che consente a OpenClaw di eseguire sequenze di strumenti multi-step come un'unica operazione deterministica con checkpoint di approvazione espliciti.

Lobster è un livello di authoring sopra il lavoro in background detached. Per l'orchestrazione dei flussi al di sopra delle singole attività, vedi [Task Flow](/it/automation/taskflow) (`openclaw tasks flow`). Per il registro dell'attività delle task, vedi [`openclaw tasks`](/it/automation/tasks).

## Hook

Il tuo assistente può costruire gli strumenti che gestiscono sé stesso. Chiedi un workflow e, 30 minuti dopo, hai una CLI più pipeline che vengono eseguite come una sola chiamata. Lobster è il pezzo mancante: pipeline deterministiche, approvazioni esplicite e stato riprendibile.

## Perché

Oggi i workflow complessi richiedono molte chiamate di strumenti avanti e indietro. Ogni chiamata costa token e l'LLM deve orchestrare ogni passaggio. Lobster sposta questa orchestrazione in un runtime tipizzato:

- **Una chiamata invece di molte**: OpenClaw esegue una chiamata singola allo strumento Lobster e ottiene un risultato strutturato.
- **Approvazioni integrate**: gli effetti collaterali (inviare email, pubblicare commenti) arrestano il workflow fino a esplicita approvazione.
- **Riprendibile**: i workflow arrestati restituiscono un token; approva e riprendi senza rieseguire tutto.

## Perché una DSL invece di programmi normali?

Lobster è intenzionalmente piccolo. L'obiettivo non è "un nuovo linguaggio", ma una specifica di pipeline prevedibile e adatta all'IA con approvazioni e token di ripresa come funzionalità di prima classe.

- **Approve/resume è integrato**: un normale programma può chiedere a un essere umano, ma non può _mettere in pausa e riprendere_ con un token durevole senza che tu debba inventare da solo quel runtime.
- **Determinismo + auditabilità**: le pipeline sono dati, quindi sono facili da registrare, confrontare, riprodurre e revisionare.
- **Superficie vincolata per l'IA**: una grammatica minimale + piping JSON riducono i percorsi di codice “creativi” e rendono realistica la validazione.
- **Criterio di sicurezza incorporato**: timeout, limiti di output, controlli sandbox e allowlist sono applicati dal runtime, non da ogni script.
- **Resta programmabile**: ogni passaggio può chiamare qualsiasi CLI o script. Se vuoi JS/TS, genera file `.lobster` dal codice.

## Come funziona

OpenClaw esegue i workflow Lobster **in-process** usando un runner incorporato. Non viene generato alcun sottoprocesso CLI esterno; il motore di workflow viene eseguito all'interno del processo gateway e restituisce direttamente un envelope JSON.
Se la pipeline si mette in pausa per un'approvazione, lo strumento restituisce un `resumeToken` così puoi continuare più tardi.

## Pattern: piccola CLI + pipe JSON + approvazioni

Costruisci piccoli comandi che parlano JSON, poi concatenali in una singola chiamata Lobster. (I nomi dei comandi d'esempio qui sotto sono solo esempi — sostituiscili con i tuoi.)

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

Se la pipeline richiede approvazione, riprendi con il token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

L'IA attiva il workflow; Lobster esegue i passaggi. I gate di approvazione mantengono gli effetti collaterali espliciti e verificabili.

Esempio: mappa elementi in input in chiamate di strumenti:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Passaggi LLM solo JSON (llm-task)

Per workflow che richiedono un **passaggio LLM strutturato**, abilita lo strumento plugin facoltativo
`llm-task` e chiamalo da Lobster. Questo mantiene il workflow
deterministico permettendoti comunque di classificare/riassumere/preparare bozze con un modello.

Abilita lo strumento:

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

Usalo in una pipeline:

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

Vedi [LLM Task](/it/tools/llm-task) per dettagli e opzioni di configurazione.

## File di workflow (.lobster)

Lobster può eseguire file di workflow YAML/JSON con campi `name`, `args`, `steps`, `env`, `condition` e `approval`. Nelle chiamate di strumenti OpenClaw, imposta `pipeline` sul percorso del file.

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

Note:

- `stdin: $step.stdout` e `stdin: $step.json` passano l'output di un passaggio precedente.
- `condition` (o `when`) può fare da gate ai passaggi in base a `$step.approved`.

## Installa Lobster

I workflow Lobster bundled vengono eseguiti in-process; non è richiesto alcun binario `lobster` separato. Il runner incorporato viene distribuito con il plugin Lobster.

Se ti serve la CLI Lobster standalone per sviluppo o pipeline esterne, installala dal [repo Lobster](https://github.com/openclaw/lobster) e assicurati che `lobster` sia in `PATH`.

## Abilita lo strumento

Lobster è uno strumento plugin **facoltativo** (non abilitato per impostazione predefinita).

Consigliato (additivo, sicuro):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Oppure per agente:

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

Evita di usare `tools.allow: ["lobster"]` a meno che tu non intenda eseguire in modalità allowlist restrittiva.

Nota: le allowlist sono opt-in per i plugin facoltativi. Se la tua allowlist nomina solo
strumenti plugin (come `lobster`), OpenClaw mantiene abilitati gli strumenti core. Per limitare gli strumenti core,
includi nell'allowlist anche gli strumenti o i gruppi core che vuoi.

## Esempio: triage email

Senza Lobster:

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

Con Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Restituisce un envelope JSON (troncato):

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

L'utente approva → riprendi:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Un solo workflow. Deterministico. Sicuro.

## Parametri dello strumento

### `run`

Esegue una pipeline in modalità strumento.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Esegue un file di workflow con argomenti:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Continua un workflow arrestato dopo l'approvazione.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Input facoltativi

- `cwd`: directory di lavoro relativa per la pipeline (deve restare all'interno della directory di lavoro del gateway).
- `timeoutMs`: interrompe il workflow se supera questa durata (predefinito: 20000).
- `maxStdoutBytes`: interrompe il workflow se l'output supera questa dimensione (predefinito: 512000).
- `argsJson`: stringa JSON passata a `lobster run --args-json` (solo file di workflow).

## Envelope di output

Lobster restituisce un envelope JSON con uno di tre stati:

- `ok` → terminato con successo
- `needs_approval` → in pausa; `requiresApproval.resumeToken` è richiesto per riprendere
- `cancelled` → negato o annullato esplicitamente

Lo strumento espone l'envelope sia in `content` (JSON formattato) sia in `details` (oggetto grezzo).

## Approvazioni

Se `requiresApproval` è presente, esamina il prompt e decidi:

- `approve: true` → riprendi e continua gli effetti collaterali
- `approve: false` → annulla e finalizza il workflow

Usa `approve --preview-from-stdin --limit N` per allegare un'anteprima JSON alle richieste di approvazione senza usare glue personalizzato jq/heredoc. I token di ripresa sono ora compatti: Lobster archivia lo stato di ripresa del workflow nella propria directory di stato e restituisce una piccola chiave token.

## OpenProse

OpenProse si abbina bene con Lobster: usa `/prose` per orchestrare preparazione multi-agente, poi esegui una pipeline Lobster per approvazioni deterministiche. Se un programma Prose ha bisogno di Lobster, consenti lo strumento `lobster` per i sub-agent tramite `tools.subagents.tools`. Vedi [OpenProse](/it/prose).

## Sicurezza

- **Solo locale in-process** — i workflow vengono eseguiti all'interno del processo gateway; nessuna chiamata di rete dal plugin stesso.
- **Nessun segreto** — Lobster non gestisce OAuth; chiama strumenti OpenClaw che lo fanno.
- **Consapevole della sandbox** — disabilitato quando il contesto dello strumento è sandboxed.
- **Rinforzato** — timeout e limiti di output applicati dal runner incorporato.

## Risoluzione dei problemi

- **`lobster timed out`** → aumenta `timeoutMs` oppure dividi una pipeline lunga.
- **`lobster output exceeded maxStdoutBytes`** → aumenta `maxStdoutBytes` oppure riduci la dimensione dell'output.
- **`lobster returned invalid JSON`** → assicurati che la pipeline sia eseguita in modalità strumento e stampi solo JSON.
- **`lobster failed`** → controlla i log del gateway per i dettagli dell'errore del runner incorporato.

## Scopri di più

- [Plugin](/it/tools/plugin)
- [Authoring di strumenti plugin](/it/plugins/building-plugins#registering-agent-tools)

## Caso di studio: workflow della community

Un esempio pubblico: una CLI “second brain” + pipeline Lobster che gestiscono tre vault Markdown (personale, partner, condiviso). La CLI emette JSON per statistiche, elenchi inbox e scansioni stale; Lobster concatena questi comandi in workflow come `weekly-review`, `inbox-triage`, `memory-consolidation` e `shared-task-sync`, ognuno con gate di approvazione. L'IA gestisce il giudizio (classificazione) quando disponibile e ricorre a regole deterministiche quando non lo è.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Correlati

- [Automation & Tasks](/it/automation) — pianificazione dei workflow Lobster
- [Panoramica dell'automazione](/it/automation) — tutti i meccanismi di automazione
- [Panoramica degli strumenti](/it/tools) — tutti gli strumenti dell'agente disponibili
