---
read_when:
    - Vuoi workflow deterministici a più passaggi con approvazioni esplicite
    - Hai bisogno di riprendere un workflow senza rieseguire i passaggi precedenti
summary: Runtime di workflow tipizzato per OpenClaw con gate di approvazione riprendibili.
title: Lobster
x-i18n:
    generated_at: "2026-04-05T14:07:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82718c15d571406ad6f1507de22a528fdab873edfc6aafae10742e500f6a5eda
    source_path: tools/lobster.md
    workflow: 15
---

# Lobster

Lobster è una shell per workflow che consente a OpenClaw di eseguire sequenze di strumenti in più passaggi come un'unica operazione deterministica con checkpoint di approvazione espliciti.

Lobster è un livello di authoring sopra il lavoro in background separato. Per l'orchestrazione dei flussi sopra le singole attività, vedi [Task Flow](/it/automation/taskflow) (`openclaw tasks flow`). Per il registro delle attività delle task, vedi [`openclaw tasks`](/it/automation/tasks).

## Hook

Il tuo assistente può creare gli strumenti che gestiscono sé stesso. Chiedi un workflow e, 30 minuti dopo, hai una CLI più pipeline che vengono eseguite con una sola chiamata. Lobster è il pezzo mancante: pipeline deterministiche, approvazioni esplicite e stato riprendibile.

## Perché

Oggi, i workflow complessi richiedono molte chiamate agli strumenti avanti e indietro. Ogni chiamata consuma token e l'LLM deve orchestrare ogni passaggio. Lobster sposta questa orchestrazione in un runtime tipizzato:

- **Una chiamata invece di molte**: OpenClaw esegue una sola chiamata allo strumento Lobster e ottiene un risultato strutturato.
- **Approvazioni integrate**: gli effetti collaterali (inviare email, pubblicare commenti) interrompono il workflow finché non vengono approvati esplicitamente.
- **Riprendibile**: i workflow interrotti restituiscono un token; approva e riprendi senza rieseguire tutto.

## Perché un DSL invece di semplici programmi?

Lobster è intenzionalmente piccolo. L'obiettivo non è "un nuovo linguaggio", ma una specifica di pipeline prevedibile e adatta all'IA con approvazioni di prima classe e token di ripresa.

- **Approva/riprendi è integrato**: un programma normale può chiedere l'intervento di una persona, ma non può _mettere in pausa e riprendere_ con un token durevole senza che tu debba inventare quel runtime.
- **Determinismo + verificabilità**: le pipeline sono dati, quindi sono facili da registrare, confrontare, rieseguire e revisionare.
- **Superficie vincolata per l'IA**: una grammatica piccola + piping JSON riduce i percorsi di codice “creativi” e rende realistica la validazione.
- **Criteri di sicurezza incorporati**: timeout, limiti di output, controlli sandbox e allowlist sono applicati dal runtime, non da ogni script.
- **Ancora programmabile**: ogni passaggio può chiamare qualsiasi CLI o script. Se vuoi JS/TS, genera file `.lobster` dal codice.

## Come funziona

OpenClaw avvia la CLI locale `lobster` in **modalità tool** e analizza un envelope JSON da stdout.
Se la pipeline si mette in pausa per un'approvazione, lo strumento restituisce un `resumeToken` così puoi continuare più tardi.

## Pattern: piccola CLI + pipe JSON + approvazioni

Crea piccoli comandi che parlano JSON, poi concatenali in una singola chiamata Lobster. (I nomi dei comandi nell'esempio qui sotto sono solo indicativi: sostituiscili con i tuoi.)

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

Esempio: mappare elementi di input in chiamate agli strumenti:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Passaggi LLM solo JSON (llm-task)

Per i workflow che richiedono un **passaggio LLM strutturato**, abilita lo strumento plugin facoltativo
`llm-task` e chiamalo da Lobster. Questo mantiene il workflow
deterministico pur consentendoti di classificare/riassumere/redigere con un modello.

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

Vedi [LLM Task](/tools/llm-task) per dettagli e opzioni di configurazione.

## File di workflow (.lobster)

Lobster può eseguire file di workflow YAML/JSON con campi `name`, `args`, `steps`, `env`, `condition` e `approval`. Nelle chiamate strumento di OpenClaw, imposta `pipeline` sul percorso del file.

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
- `condition` (o `when`) può controllare i passaggi in base a `$step.approved`.

## Installa Lobster

Installa la CLI Lobster sullo **stesso host** che esegue il Gateway di OpenClaw (vedi il [repository Lobster](https://github.com/openclaw/lobster)) e assicurati che `lobster` sia nel `PATH`.

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
includi nell'allowlist anche gli strumenti o i gruppi core che desideri.

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

Esegue una pipeline in modalità tool.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Esegui un file di workflow con argomenti:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Continua un workflow interrotto dopo l'approvazione.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Input facoltativi

- `cwd`: Directory di lavoro relativa per la pipeline (deve rimanere all'interno della directory di lavoro del processo corrente).
- `timeoutMs`: Termina il sottoprocesso se supera questa durata (predefinito: 20000).
- `maxStdoutBytes`: Termina il sottoprocesso se stdout supera questa dimensione (predefinito: 512000).
- `argsJson`: Stringa JSON passata a `lobster run --args-json` (solo file di workflow).

## Envelope di output

Lobster restituisce un envelope JSON con uno di tre stati:

- `ok` → terminato con successo
- `needs_approval` → in pausa; `requiresApproval.resumeToken` è necessario per riprendere
- `cancelled` → negato o annullato esplicitamente

Lo strumento espone l'envelope sia in `content` (JSON formattato) sia in `details` (oggetto grezzo).

## Approvazioni

Se `requiresApproval` è presente, esamina il prompt e decidi:

- `approve: true` → riprendi e continua gli effetti collaterali
- `approve: false` → annulla e finalizza il workflow

Usa `approve --preview-from-stdin --limit N` per allegare un'anteprima JSON alle richieste di approvazione senza colla personalizzata con jq/heredoc. I token di ripresa ora sono compatti: Lobster archivia lo stato di ripresa del workflow nella propria directory di stato e restituisce una piccola chiave token.

## OpenProse

OpenProse si abbina bene a Lobster: usa `/prose` per orchestrare la preparazione multi-agente, poi esegui una pipeline Lobster per approvazioni deterministiche. Se un programma Prose ha bisogno di Lobster, consenti lo strumento `lobster` ai sotto-agenti tramite `tools.subagents.tools`. Vedi [OpenProse](/it/prose).

## Sicurezza

- **Solo sottoprocessi locali** — nessuna chiamata di rete dal plugin stesso.
- **Nessun segreto** — Lobster non gestisce OAuth; chiama gli strumenti OpenClaw che lo fanno.
- **Consapevole della sandbox** — disabilitato quando il contesto dello strumento è in sandbox.
- **Rinforzato** — nome dell'eseguibile fisso (`lobster`) nel `PATH`; timeout e limiti di output applicati.

## Risoluzione dei problemi

- **`lobster subprocess timed out`** → aumenta `timeoutMs` oppure suddividi una pipeline lunga.
- **`lobster output exceeded maxStdoutBytes`** → aumenta `maxStdoutBytes` oppure riduci la dimensione dell'output.
- **`lobster returned invalid JSON`** → assicurati che la pipeline venga eseguita in modalità tool e stampi solo JSON.
- **`lobster failed (code …)`** → esegui la stessa pipeline in un terminale per ispezionare stderr.

## Approfondisci

- [Plugin](/tools/plugin)
- [Creazione di strumenti plugin](/it/plugins/building-plugins#registering-agent-tools)

## Caso di studio: workflow della community

Un esempio pubblico: una CLI “second brain” + pipeline Lobster che gestiscono tre vault Markdown (personale, partner, condiviso). La CLI emette JSON per statistiche, elenchi inbox e scansioni di elementi obsoleti; Lobster concatena questi comandi in workflow come `weekly-review`, `inbox-triage`, `memory-consolidation` e `shared-task-sync`, ciascuno con gate di approvazione. L'IA gestisce il giudizio (classificazione) quando disponibile e ricorre a regole deterministiche in caso contrario.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repository: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Correlati

- [Automazione e task](/it/automation) — pianificazione dei workflow Lobster
- [Panoramica sull'automazione](/it/automation) — tutti i meccanismi di automazione
- [Panoramica degli strumenti](/tools) — tutti gli strumenti disponibili per gli agenti
