---
read_when:
    - Vuoi flussi di lavoro deterministici in più passaggi con approvazioni esplicite
    - È necessario riprendere un flusso di lavoro senza rieseguire i passaggi precedenti
summary: Ambiente di esecuzione tipizzato per flussi di lavoro OpenClaw con passaggi di approvazione riprendibili.
title: Aragosta
x-i18n:
    generated_at: "2026-05-12T01:00:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 404b2e47982f7efb9a8bb015ac5d7bd8a06f0a41d966e620c9826735abf7f0e3
    source_path: tools/lobster.md
    workflow: 16
---

Lobster è una shell di workflow che consente a OpenClaw di eseguire sequenze di strumenti a più passaggi come un'unica operazione deterministica con checkpoint di approvazione espliciti.

Lobster è un livello di authoring sopra il lavoro in background scollegato. Per l'orchestrazione dei flussi sopra le singole attività, vedi [Flusso delle attività](/it/automation/taskflow) (`openclaw tasks flow`). Per il registro delle attività delle attività, vedi [`openclaw tasks`](/it/automation/tasks).

## Aggancio

Il tuo assistente può creare gli strumenti che gestiscono sé stesso. Chiedi un workflow e, 30 minuti dopo, hai una CLI più pipeline che vengono eseguite come una singola chiamata. Lobster è il pezzo mancante: pipeline deterministiche, approvazioni esplicite e stato ripristinabile.

## Perché

Oggi, i workflow complessi richiedono molte chiamate di strumenti avanti e indietro. Ogni chiamata consuma token e l'LLM deve orchestrare ogni passaggio. Lobster sposta questa orchestrazione in un runtime tipizzato:

- **Una chiamata invece di molte**: OpenClaw esegue una chiamata allo strumento Lobster e ottiene un risultato strutturato.
- **Approvazioni integrate**: Gli effetti collaterali (inviare un'email, pubblicare un commento) interrompono il workflow finché non vengono approvati esplicitamente.
- **Ripristinabile**: I workflow interrotti restituiscono un token; approva e riprendi senza rieseguire tutto.

## Perché una DSL invece di programmi semplici?

Lobster è intenzionalmente piccolo. L'obiettivo non è "un nuovo linguaggio", ma una specifica di pipeline prevedibile e adatta all'AI, con approvazioni e token di ripresa di prima classe.

- **Approvazione/ripresa integrata**: Un programma normale può chiedere input a una persona, ma non può _mettersi in pausa e riprendere_ con un token durevole senza che tu inventi quel runtime da zero.
- **Determinismo + verificabilità**: Le pipeline sono dati, quindi sono facili da registrare, confrontare, rieseguire e revisionare.
- **Superficie vincolata per l'AI**: Una grammatica minima + piping JSON riduce i percorsi di codice "creativi" e rende realistica la validazione.
- **Policy di sicurezza incorporata**: Timeout, limiti di output, controlli sandbox e allowlist sono applicati dal runtime, non da ogni script.
- **Comunque programmabile**: Ogni passaggio può chiamare qualsiasi CLI o script. Se vuoi JS/TS, genera file `.lobster` dal codice.

## Come funziona

OpenClaw esegue i workflow Lobster **in-process** usando un runner incorporato. Non viene generato alcun sottoprocesso CLI esterno; il motore di workflow viene eseguito dentro il processo del gateway e restituisce direttamente una busta JSON.
Se la pipeline si interrompe per un'approvazione, lo strumento restituisce un `resumeToken` per continuare in seguito.

## Pattern: piccola CLI + pipe JSON + approvazioni

Crea comandi piccoli che parlano JSON, poi concatenali in una singola chiamata Lobster. (I nomi dei comandi di esempio qui sotto sono sostituibili con i tuoi.)

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

L'AI attiva il workflow; Lobster esegue i passaggi. I gate di approvazione mantengono gli effetti collaterali espliciti e verificabili.

Esempio: mappare elementi di input in chiamate di strumenti:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Passaggi LLM solo JSON (llm-task)

Per i workflow che richiedono un **passaggio LLM strutturato**, abilita lo strumento plugin opzionale
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
        "tools": { "alsoAllow": ["llm-task"] }
      }
    ]
  }
}
```

### Limitazione importante: Lobster incorporato vs `openclaw.invoke`

Il plugin Lobster incluso esegue i workflow **in-process** dentro il gateway. In quella modalità incorporata, `openclaw.invoke` **non** eredita automaticamente un URL gateway/contesto di autenticazione per chiamate annidate agli strumenti CLI di OpenClaw.

Questo significa che questo pattern **non è attualmente affidabile nel runner incorporato**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Usa l'esempio seguente solo quando esegui la **CLI Lobster standalone** in un ambiente in cui `openclaw.invoke` è già configurato con il contesto gateway/autenticazione corretto.

Usalo in una pipeline CLI Lobster standalone:

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

Se oggi usi il plugin Lobster incorporato, preferisci una delle due opzioni:

- una chiamata diretta allo strumento `llm-task` fuori da Lobster, oppure
- passaggi non `openclaw.invoke` dentro la pipeline Lobster finché non viene aggiunto un bridge incorporato supportato.

Vedi [Attività LLM](/it/tools/llm-task) per dettagli e opzioni di configurazione.

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

- `stdin: $step.stdout` e `stdin: $step.json` passano l'output di un passaggio precedente.
- `condition` (o `when`) può vincolare i passaggi in base a `$step.approved`.

## Installare Lobster

I workflow Lobster inclusi vengono eseguiti in-process; non è richiesto alcun binario `lobster` separato. Il runner incorporato viene distribuito con il plugin Lobster.

Se ti serve la CLI Lobster standalone per lo sviluppo o per pipeline esterne, installala dal [repo Lobster](https://github.com/openclaw/lobster) e assicurati che `lobster` sia in `PATH`.

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

Evita di usare `tools.allow: ["lobster"]` a meno che tu non intenda eseguire in modalità allowlist restrittiva.

<Note>
Le allowlist sono opt-in per i plugin opzionali. `alsoAllow` abilita solo gli strumenti plugin opzionali nominati, preservando il normale set di strumenti core. Per limitare gli strumenti core, usa `tools.allow` con gli strumenti o i gruppi core che vuoi.
</Note>

## Esempio: triage delle email

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

Restituisce una busta JSON (troncata):

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

Continua un workflow interrotto dopo l'approvazione.

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
- `maxStdoutBytes`: Interrompe il workflow se l'output supera questa dimensione (predefinito: 512000).
- `argsJson`: Stringa JSON passata a `lobster run --args-json` (solo file di workflow).

## Busta di output

Lobster restituisce una busta JSON con uno di tre stati:

- `ok` → completato correttamente
- `needs_approval` → in pausa; `requiresApproval.resumeToken` è richiesto per riprendere
- `cancelled` → negato o annullato esplicitamente

Lo strumento espone la busta sia in `content` (JSON formattato) sia in `details` (oggetto grezzo).

## Approvazioni

Se `requiresApproval` è presente, ispeziona il prompt e decidi:

- `approve: true` → riprendi e continua gli effetti collaterali
- `approve: false` → annulla e finalizza il workflow

Usa `approve --preview-from-stdin --limit N` per allegare un'anteprima JSON alle richieste di approvazione senza colla jq/heredoc personalizzata. I token di ripresa ora sono compatti: Lobster archivia lo stato di ripresa del workflow nella propria directory di stato e restituisce una piccola chiave token.

## OpenProse

OpenProse si abbina bene a Lobster: usa `/prose` per orchestrare la preparazione multi-agente, poi esegui una pipeline Lobster per approvazioni deterministiche. Se un programma Prose richiede Lobster, consenti lo strumento `lobster` per i sotto-agenti tramite `tools.subagents.tools`. Vedi [OpenProse](/it/prose).

## Sicurezza

- **Solo in-process locale** - i workflow vengono eseguiti dentro il processo del gateway; nessuna chiamata di rete dal plugin stesso.
- **Nessun segreto** - Lobster non gestisce OAuth; chiama gli strumenti OpenClaw che lo fanno.
- **Consapevole della sandbox** - disabilitato quando il contesto dello strumento è sandboxato.
- **Rafforzato** - timeout e limiti di output applicati dal runner incorporato.

## Risoluzione dei problemi

- **`lobster timed out`** → aumenta `timeoutMs` oppure dividi una pipeline lunga.
- **`lobster output exceeded maxStdoutBytes`** → aumenta `maxStdoutBytes` o riduci la dimensione dell'output.
- **`lobster returned invalid JSON`** → assicurati che la pipeline venga eseguita in modalità strumento e stampi solo JSON.
- **`lobster failed`** → controlla i log del gateway per i dettagli dell'errore del runner incorporato.

## Scopri di più

- [Plugin](/it/tools/plugin)
- [Authoring di strumenti Plugin](/it/plugins/building-plugins#registering-agent-tools)

## Caso di studio: workflow della community

Un esempio pubblico: una CLI "secondo cervello" + pipeline Lobster che gestiscono tre vault Markdown (personale, partner, condiviso). La CLI emette JSON per statistiche, elenchi inbox e scansioni di contenuti obsoleti; Lobster concatena quei comandi in workflow come `weekly-review`, `inbox-triage`, `memory-consolidation` e `shared-task-sync`, ciascuno con gate di approvazione. L'AI gestisce il giudizio (categorizzazione) quando disponibile e ricorre a regole deterministiche quando non lo è.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Correlati

- [Automazione](/it/automation) - pianificazione dei workflow Lobster
- [Panoramica dell'automazione](/it/automation) - tutti i meccanismi di automazione
- [Panoramica degli strumenti](/it/tools) - tutti gli strumenti agente disponibili
