---
read_when:
    - Desideri flussi di lavoro deterministici in più passaggi con approvazioni esplicite
    - È necessario riprendere un flusso di lavoro senza rieseguire i passaggi precedenti
summary: Runtime di workflow tipizzato per OpenClaw con gate di approvazione riprendibili.
title: Aragosta
x-i18n:
    generated_at: "2026-05-04T07:09:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67f5145b11f2d6e07e9d78a44a389ae5f236c85ec8c287ab0f217a18b622ece0
    source_path: tools/lobster.md
    workflow: 16
---

Lobster è una shell di workflow che consente a OpenClaw di eseguire sequenze di strumenti multi-passaggio come un’unica operazione deterministica con checkpoint di approvazione espliciti.

Lobster è un livello di authoring sopra il lavoro in background distaccato. Per l’orchestrazione dei flussi sopra le singole attività, consulta [Flusso attività](/it/automation/taskflow) (`openclaw tasks flow`). Per il registro delle attività delle task, consulta [`openclaw tasks`](/it/automation/tasks).

## Hook

Il tuo assistente può creare gli strumenti che gestiscono sé stesso. Chiedi un workflow e, 30 minuti dopo, hai una CLI più pipeline che vengono eseguite come un’unica chiamata. Lobster è il pezzo mancante: pipeline deterministiche, approvazioni esplicite e stato ripristinabile.

## Perché

Oggi, i workflow complessi richiedono molte chiamate agli strumenti avanti e indietro. Ogni chiamata costa token e l’LLM deve orchestrare ogni passaggio. Lobster sposta quell’orchestrazione in un runtime tipizzato:

- **Una chiamata invece di molte**: OpenClaw esegue una chiamata allo strumento Lobster e ottiene un risultato strutturato.
- **Approvazioni integrate**: Gli effetti collaterali (inviare email, pubblicare commenti) sospendono il workflow finché non vengono approvati esplicitamente.
- **Ripristinabile**: I workflow sospesi restituiscono un token; approva e riprendi senza rieseguire tutto.

## Perché una DSL invece di programmi semplici?

Lobster è intenzionalmente piccolo. L’obiettivo non è “un nuovo linguaggio”, ma una specifica di pipeline prevedibile e adatta all’AI, con approvazioni e token di ripresa di prima classe.

- **Approva/riprendi è integrato**: Un programma normale può chiedere input a una persona, ma non può _mettersi in pausa e riprendere_ con un token durevole senza che tu inventi quel runtime da zero.
- **Determinismo + verificabilità**: Le pipeline sono dati, quindi sono facili da registrare, confrontare, riprodurre e rivedere.
- **Superficie vincolata per l’AI**: Una grammatica minima + piping JSON riducono i percorsi di codice “creativi” e rendono realistica la validazione.
- **Policy di sicurezza incorporata**: Timeout, limiti di output, controlli sandbox e allowlist sono applicati dal runtime, non da ogni script.
- **Ancora programmabile**: Ogni passaggio può chiamare qualsiasi CLI o script. Se vuoi JS/TS, genera file `.lobster` dal codice.

## Come funziona

OpenClaw esegue i workflow Lobster **in-process** usando un runner incorporato. Non viene avviato alcun subprocess CLI esterno; il motore del workflow viene eseguito dentro il processo del gateway e restituisce direttamente un envelope JSON.
Se la pipeline si sospende per approvazione, lo strumento restituisce un `resumeToken` così puoi continuare in seguito.

## Pattern: piccola CLI + pipe JSON + approvazioni

Crea piccoli comandi che parlano JSON, poi concatenali in una singola chiamata Lobster. (Nomi di comandi di esempio sotto — sostituiscili con i tuoi.)

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

L’AI attiva il workflow; Lobster esegue i passaggi. I gate di approvazione mantengono gli effetti collaterali espliciti e verificabili.

Esempio: mappare elementi di input in chiamate agli strumenti:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Passaggi LLM solo JSON (llm-task)

Per workflow che richiedono un **passaggio LLM strutturato**, abilita lo strumento plugin opzionale
`llm-task` e chiamalo da Lobster. Questo mantiene il workflow
deterministico pur consentendo di classificare/riassumere/redigere con un modello.

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
        "tools": { "alsoAllow": ["llm-task"] }
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

Consulta [Task LLM](/it/tools/llm-task) per dettagli e opzioni di configurazione.

## File di workflow (.lobster)

Lobster può eseguire file di workflow YAML/JSON con campi `name`, `args`, `steps`, `env`, `condition` e `approval`. Nelle chiamate agli strumenti OpenClaw, imposta `pipeline` sul percorso del file.

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

- `stdin: $step.stdout` e `stdin: $step.json` passano l’output di un passaggio precedente.
- `condition` (o `when`) può vincolare i passaggi su `$step.approved`.

## Installare Lobster

I workflow Lobster inclusi vengono eseguiti in-process; non è richiesto alcun binario `lobster` separato. Il runner incorporato viene distribuito con il plugin Lobster.

Se ti serve la CLI Lobster standalone per sviluppo o pipeline esterne, installala dal [repo Lobster](https://github.com/openclaw/lobster) e assicurati che `lobster` sia in `PATH`.

## Abilitare lo strumento

Lobster è uno strumento plugin **opzionale** (non abilitato per impostazione predefinita).

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

Evita di usare `tools.allow: ["lobster"]` a meno che tu intenda eseguire in modalità allowlist restrittiva.

<Note>
Le allowlist sono opt-in per i plugin opzionali. `alsoAllow` abilita solo gli strumenti plugin opzionali nominati, preservando il normale set di strumenti core. Per limitare gli strumenti core, usa `tools.allow` con gli strumenti o i gruppi core che vuoi.
</Note>

## Esempio: Triage email

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

L’utente approva → riprendi:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Un workflow. Deterministico. Sicuro.

## Parametri dello strumento

### `run`

Esegui una pipeline in modalità strumento.

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

Continua un workflow sospeso dopo l’approvazione.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Input opzionali

- `cwd`: Directory di lavoro relativa per la pipeline (deve rimanere dentro la directory di lavoro del gateway).
- `timeoutMs`: Interrompe il workflow se supera questa durata (predefinito: 20000).
- `maxStdoutBytes`: Interrompe il workflow se l’output supera questa dimensione (predefinito: 512000).
- `argsJson`: Stringa JSON passata a `lobster run --args-json` (solo file di workflow).

## Envelope di output

Lobster restituisce un envelope JSON con uno di tre stati:

- `ok` → completato correttamente
- `needs_approval` → sospeso; `requiresApproval.resumeToken` è necessario per riprendere
- `cancelled` → negato o annullato esplicitamente

Lo strumento espone l’envelope sia in `content` (JSON formattato) sia in `details` (oggetto grezzo).

## Approvazioni

Se `requiresApproval` è presente, esamina il prompt e decidi:

- `approve: true` → riprendi e continua gli effetti collaterali
- `approve: false` → annulla e finalizza il workflow

Usa `approve --preview-from-stdin --limit N` per allegare un’anteprima JSON alle richieste di approvazione senza colla jq/heredoc personalizzata. I token di ripresa ora sono compatti: Lobster archivia lo stato di ripresa del workflow nella sua directory di stato e restituisce una piccola chiave token.

## OpenProse

OpenProse funziona bene con Lobster: usa `/prose` per orchestrare la preparazione multi-agente, poi esegui una pipeline Lobster per approvazioni deterministiche. Se un programma Prose ha bisogno di Lobster, consenti lo strumento `lobster` per i sotto-agenti tramite `tools.subagents.tools`. Consulta [OpenProse](/it/prose).

## Sicurezza

- **Solo locale in-process** — i workflow vengono eseguiti dentro il processo del gateway; nessuna chiamata di rete dal plugin stesso.
- **Nessun segreto** — Lobster non gestisce OAuth; chiama gli strumenti OpenClaw che lo fanno.
- **Consapevole della sandbox** — disabilitato quando il contesto dello strumento è in sandbox.
- **Irrigidito** — timeout e limiti di output applicati dal runner incorporato.

## Risoluzione dei problemi

- **`lobster timed out`** → aumenta `timeoutMs` oppure dividi una pipeline lunga.
- **`lobster output exceeded maxStdoutBytes`** → aumenta `maxStdoutBytes` o riduci la dimensione dell’output.
- **`lobster returned invalid JSON`** → assicurati che la pipeline venga eseguita in modalità strumento e stampi solo JSON.
- **`lobster failed`** → controlla i log del gateway per i dettagli dell’errore del runner incorporato.

## Scopri di più

- [Plugin](/it/tools/plugin)
- [Authoring di strumenti plugin](/it/plugins/building-plugins#registering-agent-tools)

## Caso di studio: workflow della community

Un esempio pubblico: una CLI “second brain” + pipeline Lobster che gestiscono tre vault Markdown (personale, partner, condiviso). La CLI emette JSON per statistiche, elenchi inbox e scansioni degli elementi obsoleti; Lobster concatena quei comandi in workflow come `weekly-review`, `inbox-triage`, `memory-consolidation` e `shared-task-sync`, ciascuno con gate di approvazione. L’AI gestisce il giudizio (categorizzazione) quando disponibile e ripiega su regole deterministiche quando non lo è.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Correlati

- [Automazione e task](/it/automation) — pianificazione dei workflow Lobster
- [Panoramica automazione](/it/automation) — tutti i meccanismi di automazione
- [Panoramica strumenti](/it/tools) — tutti gli strumenti agente disponibili
