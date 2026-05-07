---
read_when:
    - Vuoi flussi di lavoro deterministici in più passaggi con approvazioni esplicite
    - È necessario riprendere un flusso di lavoro senza rieseguire i passaggi precedenti
summary: Runtime tipizzato per flussi di lavoro di OpenClaw con gate di approvazione riprendibili.
title: Aragosta
x-i18n:
    generated_at: "2026-05-07T13:26:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 859cc29bd5b91d30e9f91a5b00a06d0fcf6f80d501aaaa7a7e266a4240573927
    source_path: tools/lobster.md
    workflow: 16
---

Lobster è una shell per workflow che consente a OpenClaw di eseguire sequenze di strumenti multi-passaggio come un’unica operazione deterministica, con checkpoint di approvazione espliciti.

Lobster è un livello di authoring sopra il lavoro in background scollegato. Per l’orchestrazione dei flussi al di sopra dei singoli task, consulta [Task Flow](/it/automation/taskflow) (`openclaw tasks flow`). Per il registro delle attività dei task, consulta [`openclaw tasks`](/it/automation/tasks).

## Hook

Il tuo assistente può creare gli strumenti che gestiscono sé stesso. Chiedi un workflow e, 30 minuti dopo, hai una CLI più pipeline che vengono eseguite con una sola chiamata. Lobster è il tassello mancante: pipeline deterministiche, approvazioni esplicite e stato ripristinabile.

## Perché

Oggi i workflow complessi richiedono molte chiamate di strumenti avanti e indietro. Ogni chiamata consuma token e l’LLM deve orchestrare ogni passaggio. Lobster sposta quell’orchestrazione in un runtime tipizzato:

- **Una chiamata invece di molte**: OpenClaw esegue una sola chiamata allo strumento Lobster e ottiene un risultato strutturato.
- **Approvazioni integrate**: gli effetti collaterali (inviare un’email, pubblicare un commento) sospendono il workflow finché non vengono approvati esplicitamente.
- **Ripristinabile**: i workflow sospesi restituiscono un token; approva e riprendi senza rieseguire tutto.

## Perché una DSL invece di programmi semplici?

Lobster è intenzionalmente piccolo. L’obiettivo non è “un nuovo linguaggio”, ma una specifica di pipeline prevedibile e adatta all’AI, con approvazioni e token di ripresa come elementi di prima classe.

- **Approva/riprendi è integrato**: un programma normale può chiedere conferma a una persona, ma non può _mettersi in pausa e riprendere_ con un token durevole senza che tu inventi quel runtime.
- **Determinismo + verificabilità**: le pipeline sono dati, quindi sono facili da registrare, confrontare, rieseguire e revisionare.
- **Superficie vincolata per l’AI**: una grammatica minima + piping JSON riduce i percorsi di codice “creativi” e rende realistica la validazione.
- **Policy di sicurezza incorporata**: timeout, limiti di output, controlli sandbox e allowlist sono applicati dal runtime, non da ogni script.
- **Ancora programmabile**: ogni passaggio può chiamare qualunque CLI o script. Se vuoi JS/TS, genera file `.lobster` dal codice.

## Come funziona

OpenClaw esegue i workflow Lobster **in-process** usando un runner incorporato. Non viene avviato alcun sottoprocesso CLI esterno; il motore del workflow viene eseguito dentro il processo del Gateway e restituisce direttamente una busta JSON.
Se la pipeline viene messa in pausa per l’approvazione, lo strumento restituisce un `resumeToken` così puoi continuare in seguito.

## Pattern: piccole CLI + pipe JSON + approvazioni

Crea piccoli comandi che parlano JSON, poi concatenali in una singola chiamata Lobster. (I nomi dei comandi qui sotto sono esempi: sostituiscili con i tuoi.)

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

Esempio: mappare gli elementi di input in chiamate di strumenti:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Passaggi LLM solo JSON (llm-task)

Per i workflow che richiedono un **passaggio LLM strutturato**, abilita lo strumento Plugin opzionale
`llm-task` e chiamalo da Lobster. Questo mantiene il workflow
deterministico pur consentendo classificazione, riassunto o bozza con un modello.

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

Il Plugin Lobster incluso esegue i workflow **in-process** dentro il Gateway. In quella modalità incorporata, `openclaw.invoke` **non** eredita automaticamente un contesto URL/autenticazione del Gateway per chiamate annidate agli strumenti della CLI OpenClaw.

Questo significa che questo pattern **non è attualmente affidabile nel runner incorporato**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Usa l’esempio qui sotto solo quando esegui la **CLI Lobster autonoma** in un ambiente in cui `openclaw.invoke` è già configurato con il contesto Gateway/autenticazione corretto.

Usalo in una pipeline CLI Lobster autonoma:

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

Se oggi usi il Plugin Lobster incorporato, preferisci una di queste opzioni:

- una chiamata diretta allo strumento `llm-task` fuori da Lobster, oppure
- passaggi non `openclaw.invoke` dentro la pipeline Lobster finché non verrà aggiunto un bridge incorporato supportato.

Consulta [Task LLM](/it/tools/llm-task) per dettagli e opzioni di configurazione.

## File di workflow (.lobster)

Lobster può eseguire file di workflow YAML/JSON con i campi `name`, `args`, `steps`, `env`, `condition` e `approval`. Nelle chiamate agli strumenti OpenClaw, imposta `pipeline` sul percorso del file.

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
- `condition` (o `when`) può subordinare i passaggi a `$step.approved`.

## Installare Lobster

I workflow Lobster inclusi vengono eseguiti in-process; non è richiesto alcun binario `lobster` separato. Il runner incorporato viene distribuito con il Plugin Lobster.

Se ti serve la CLI Lobster autonoma per lo sviluppo o per pipeline esterne, installala dal [repo Lobster](https://github.com/openclaw/lobster) e assicurati che `lobster` sia in `PATH`.

## Abilitare lo strumento

Lobster è uno strumento Plugin **opzionale** (non abilitato per impostazione predefinita).

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
Le allowlist sono opt-in per i Plugin opzionali. `alsoAllow` abilita solo gli strumenti dei Plugin opzionali nominati, preservando il normale set di strumenti core. Per limitare gli strumenti core, usa `tools.allow` con gli strumenti o i gruppi core che desideri.
</Note>

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

- `cwd`: directory di lavoro relativa per la pipeline (deve restare all’interno della directory di lavoro del Gateway).
- `timeoutMs`: interrompe il workflow se supera questa durata (predefinito: 20000).
- `maxStdoutBytes`: interrompe il workflow se l’output supera questa dimensione (predefinito: 512000).
- `argsJson`: stringa JSON passata a `lobster run --args-json` (solo file di workflow).

## Busta di output

Lobster restituisce una busta JSON con uno di tre stati:

- `ok` → completato correttamente
- `needs_approval` → in pausa; `requiresApproval.resumeToken` è richiesto per riprendere
- `cancelled` → negato o annullato esplicitamente

Lo strumento espone la busta sia in `content` (JSON formattato) sia in `details` (oggetto grezzo).

## Approvazioni

Se `requiresApproval` è presente, esamina il prompt e decidi:

- `approve: true` → riprendi e continua gli effetti collaterali
- `approve: false` → annulla e finalizza il workflow

Usa `approve --preview-from-stdin --limit N` per allegare un’anteprima JSON alle richieste di approvazione senza colla personalizzata jq/heredoc. I token di ripresa sono ora compatti: Lobster archivia lo stato di ripresa del workflow nella propria directory di stato e restituisce una piccola chiave token.

## OpenProse

OpenProse si abbina bene a Lobster: usa `/prose` per orchestrare la preparazione multi-agente, poi esegui una pipeline Lobster per approvazioni deterministiche. Se un programma Prose richiede Lobster, consenti lo strumento `lobster` ai sotto-agenti tramite `tools.subagents.tools`. Consulta [OpenProse](/it/prose).

## Sicurezza

- **Solo locale in-process** - i workflow vengono eseguiti dentro il processo del Gateway; nessuna chiamata di rete dal Plugin stesso.
- **Nessun segreto** - Lobster non gestisce OAuth; chiama gli strumenti OpenClaw che lo fanno.
- **Consapevole della sandbox** - disabilitato quando il contesto dello strumento è in sandbox.
- **Irrigidito** - timeout e limiti di output applicati dal runner incorporato.

## Risoluzione dei problemi

- **`lobster timed out`** → aumenta `timeoutMs` oppure dividi una pipeline lunga.
- **`lobster output exceeded maxStdoutBytes`** → aumenta `maxStdoutBytes` o riduci la dimensione dell’output.
- **`lobster returned invalid JSON`** → assicurati che la pipeline venga eseguita in modalità strumento e stampi solo JSON.
- **`lobster failed`** → controlla i log del Gateway per i dettagli dell’errore del runner incorporato.

## Per saperne di più

- [Plugin](/it/tools/plugin)
- [Authoring degli strumenti Plugin](/it/plugins/building-plugins#registering-agent-tools)

## Caso di studio: workflow della community

Un esempio pubblico: una CLI “secondo cervello” + pipeline Lobster che gestiscono tre vault Markdown (personale, partner, condiviso). La CLI emette JSON per statistiche, elenchi inbox e scansioni di contenuti inattivi; Lobster concatena quei comandi in workflow come `weekly-review`, `inbox-triage`, `memory-consolidation` e `shared-task-sync`, ciascuno con gate di approvazione. L’AI gestisce il giudizio (categorizzazione) quando disponibile e ripiega su regole deterministiche quando non lo è.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Correlati

- [Automazione e task](/it/automation) - pianificazione dei workflow Lobster
- [Panoramica dell’automazione](/it/automation) - tutti i meccanismi di automazione
- [Panoramica degli strumenti](/it/tools) - tutti gli strumenti agente disponibili
