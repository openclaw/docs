---
read_when:
    - Vuoi flussi di lavoro deterministici in più passaggi con approvazioni esplicite
    - Devi riprendere un flusso di lavoro senza eseguire nuovamente i passaggi precedenti
summary: Runtime di workflow tipizzato per OpenClaw con passaggi di approvazione ripristinabili.
title: Aragosta
x-i18n:
    generated_at: "2026-07-12T07:34:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster esegue pipeline di strumenti in più passaggi come un'unica chiamata deterministica a uno strumento, con
checkpoint di approvazione espliciti e token di ripresa. Si colloca un livello sopra
il lavoro in background separato: per orchestrare flussi tra molte attività separate,
consulta [Task Flow](/it/automation/taskflow) (`openclaw tasks flow`); per il registro
delle attività, consulta [Attività in background](/it/automation/tasks).

## Perché

Senza Lobster, un processo in più passaggi richiede molte chiamate di andata e ritorno agli strumenti, con il
modello che orchestra ogni passaggio. Lobster sposta tale orchestrazione in un runtime
tipizzato:

- **Una chiamata anziché molte**: una singola chiamata allo strumento Lobster restituisce un risultato
  strutturato per l'intera pipeline.
- **Approvazioni integrate**: gli effetti collaterali (invio, pubblicazione, eliminazione) arrestano il flusso di lavoro
  finché non vengono approvati esplicitamente.
- **Ripristinabile**: un flusso di lavoro arrestato restituisce un token; è possibile approvarlo e riprenderlo senza
  rieseguire i passaggi precedenti.

Lobster è un DSL piccolo e vincolato, non un linguaggio di scripting generico:
l'approvazione/ripresa è una primitiva durevole e integrata; le pipeline sono dati (facili da
registrare, confrontare, rieseguire e revisionare); la grammatica ridotta limita i percorsi di codice "creativi", così
la convalida rimane realistica; timeout, limiti di output, controlli della sandbox ed
elenchi di elementi consentiti sono applicati dal runtime, non da ogni script. Ogni passaggio può comunque
chiamare qualsiasi CLI o script: genera file `.lobster` da altri strumenti se
desideri un linguaggio di creazione più ricco.

Senza Lobster, una valutazione ricorrente delle email si presenta così:

```text
Utente: "Controlla le mie email e prepara le risposte"
→ openclaw chiama gmail.list
→ LLM riassume
→ Utente: "prepara le risposte per la n. 2 e la n. 5"
→ LLM prepara le bozze
→ Utente: "invia la n. 2"
→ openclaw chiama gmail.send
(ripetuto ogni giorno, senza memoria di ciò che è stato valutato)
```

Con Lobster, lo stesso processo consiste in un'unica chiamata che si arresta per l'approvazione e poi riprende:

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

## Come funziona

OpenClaw esegue i flussi di lavoro Lobster **all'interno del processo** usando il pacchetto incluso
`@clawdbot/lobster` come esecutore incorporato. Non viene avviato alcun sottoprocesso
`lobster` esterno; la chiamata allo strumento restituisce direttamente un contenitore JSON. Se la
pipeline si arresta per l'approvazione, il contenitore include un token di ripresa (o un breve
ID di approvazione) che consente di continuare in seguito.

## Abilitazione

Lobster è uno strumento Plugin **facoltativo**, non abilitato per impostazione predefinita. Viene fornito
incluso, quindi non è necessaria un'installazione separata: basta consentire lo strumento:

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Oppure per singolo agente:

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
`alsoAllow` aggiunge `lobster` al profilo di strumenti attivo senza
limitare gli altri strumenti principali. Usa `tools.allow` solo se desideri invece una modalità
con elenco restrittivo degli elementi consentiti.
</Note>

Lo strumento è completamente disabilitato nei contesti di strumenti in sandbox.

Se ti serve la CLI Lobster autonoma per lo sviluppo o per pipeline esterne
(al di fuori dell'esecutore Gateway incorporato), installala dal
[repository Lobster](https://github.com/openclaw/lobster) e aggiungi `lobster` a
`PATH`.

## Modello: piccola CLI + pipe JSON + approvazioni

Crea piccoli comandi che comunicano tramite JSON, quindi concatenali in un'unica chiamata Lobster.
(I nomi dei comandi riportati di seguito sono esempi: sostituiscili con i tuoi.)

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

Se la pipeline richiede l'approvazione, riprendila con il token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Esempio: associa gli elementi di input alle chiamate agli strumenti:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Passaggi LLM solo JSON (llm-task)

Per un **passaggio LLM strutturato** all'interno di un flusso di lavoro, abilita lo strumento Plugin facoltativo
`llm-task` e chiamalo da Lobster:

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

### Limitazione importante: Lobster incorporato rispetto a `openclaw.invoke`

Il Plugin Lobster incluso esegue i flussi di lavoro **all'interno del processo** nel Gateway.
In questa modalità incorporata, `openclaw.invoke` **non** eredita automaticamente un
URL del Gateway o un contesto di autenticazione per le chiamate annidate agli strumenti della CLI OpenClaw.

Ciò significa che questo modello **attualmente non è affidabile nell'esecutore incorporato**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Usa l'esempio seguente solo quando esegui la **CLI Lobster autonoma** in un
ambiente in cui `openclaw.invoke` è già configurato con il corretto
contesto del Gateway e di autenticazione.

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

Se attualmente usi il Plugin Lobster incorporato, preferisci:

- una chiamata diretta allo strumento `llm-task` al di fuori di Lobster, oppure
- passaggi diversi da `openclaw.invoke` all'interno della pipeline Lobster finché non verrà aggiunto un bridge
  incorporato supportato.

Per dettagli e opzioni di configurazione, consulta [Attività LLM](/it/tools/llm-task).

## File dei flussi di lavoro (.lobster)

Lobster può eseguire file di flusso di lavoro YAML/JSON con i campi `name`, `args`, `steps`, `env`,
`condition` e `approval`. Imposta `pipeline` sul percorso del file nella chiamata allo
strumento.

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
- `condition` (o `when`) può subordinare i passaggi a `$step.approved`.

## Parametri dello strumento

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

Esegui un file di flusso di lavoro con argomenti:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

| Campo            | Valore predefinito | Note                                                                                                                        |
| ---------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `pipeline`       | obbligatorio       | Stringa della pipeline in linea o percorso che termina con `.lobster`/`.yaml`/`.yml`/`.json` per un file di flusso di lavoro. |
| `cwd`            | cwd del Gateway    | Directory di lavoro relativa; deve risolversi all'interno della directory di lavoro del Gateway (i percorsi assoluti vengono rifiutati). |
| `timeoutMs`      | `20000`            | Interrompe l'esecuzione se viene superato.                                                                                   |
| `maxStdoutBytes` | `512000`           | Interrompe l'esecuzione se stdout o stderr acquisito supera queste dimensioni.                                               |
| `argsJson`       | -                  | Stringa JSON degli argomenti per un file di flusso di lavoro (ignorata per le pipeline in linea).                            |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` accetta `token` (il token di ripresa completo da `requiresApproval`)
oppure `approvalId` (l'ID breve dello stesso oggetto): usa quello restituito
dall'esecuzione arrestata. `approve` è obbligatorio.

### Modalità Task Flow gestita

Il passaggio di `flowControllerId` e `flowGoal` a `run` (oppure di `flowId` e
`flowExpectedRevision` a `resume`) instrada la chiamata tramite l'API
[Task Flow](/it/automation/taskflow) gestita del runtime del Plugin invece di restituire
un semplice contenitore: OpenClaw crea o riprende un record di flusso durevole, vi applica il
contenitore Lobster (`waiting` durante l'approvazione, `succeeded`/`failed` al
completamento) e restituisce `{ ok, envelope, flow, mutation }`. Questa modalità richiede
un runtime Task Flow associato ed è destinata al codice del Plugin/controller che necessita
di uno stato del flusso durevole tra i riavvii del Gateway, non al tipico uso occasionale da parte degli agenti.

## Contenitore di output

Lobster restituisce un contenitore JSON con uno dei tre stati seguenti:

- `ok` - completato correttamente
- `needs_approval` - in pausa; `requiresApproval` contiene un `resumeToken` e un
  breve `approvalId`, ciascuno dei quali può riprendere l'esecuzione
- `cancelled` - negato o annullato esplicitamente

Lo strumento espone il contenitore sia in `content` (JSON formattato) sia in `details`
(oggetto non elaborato).

## Approvazioni

Se `requiresApproval` è presente, esamina la richiesta e decidi:

- `approve: true` - riprendi e continua gli effetti collaterali
- `approve: false` - annulla e finalizza il flusso di lavoro

Usa `approve --preview-from-stdin --limit N` per allegare un'anteprima JSON alle
richieste di approvazione senza codice di raccordo personalizzato con jq/heredoc. Lo stato di ripresa viene archiviato in
piccoli file JSON nella directory di stato di Lobster (`~/.lobster/state` per
impostazione predefinita, modificabile con `LOBSTER_STATE_DIR`); il token codifica solo un
puntatore a tale stato, non lo stato completo della pipeline.

## OpenProse

OpenProse si abbina bene a Lobster: usa `/prose` per orchestrare la preparazione multi-agente,
quindi esegui una pipeline Lobster per approvazioni deterministiche. Se un programma Prose
necessita di Lobster, consenti lo strumento `lobster` ai sottoagenti tramite
`tools.subagents.tools`. Consulta [OpenProse](/it/prose).

## Sicurezza

- **Solo locale e all'interno del processo** - i flussi di lavoro vengono eseguiti nel processo del Gateway; il Plugin stesso
  non effettua chiamate di rete.
- **Nessun segreto** - Lobster non gestisce OAuth; chiama gli strumenti OpenClaw che
  lo fanno.
- **Compatibile con la sandbox** - disabilitato quando il contesto dello strumento è in sandbox.
- **Rinforzato** - timeout e limiti di output sono applicati dall'esecutore incorporato.

## Risoluzione dei problemi

| Errore                                                        | Causa / soluzione                                                                        |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | La pipeline ha superato `timeoutMs`. Aumentalo o suddividi la pipeline.                   |
| `lobster stdout exceeded maxStdoutBytes` (o `stderr`)         | L'output acquisito ha superato il limite. Aumenta `maxStdoutBytes` o riduci l'output.      |
| `run --args-json must be valid JSON`                          | Non è stato possibile analizzare `argsJson` (per le esecuzioni di file di flusso di lavoro). Correggi la stringa JSON. |
| `lobster runtime failed` (o un altro messaggio `runtime_error`) | Il runtime incorporato ha restituito un contenitore di errore. Controlla i log del Gateway per i dettagli. |

## Ulteriori informazioni

- [Plugin](/it/tools/plugin)
- [Creazione di strumenti Plugin](/it/plugins/building-plugins#registering-agent-tools)

## Caso di studio: flussi di lavoro della comunità

Un esempio pubblico: una CLI «secondo cervello» + pipeline Lobster che gestiscono tre
archivi Markdown (personale, del partner, condiviso). La CLI genera JSON per statistiche,
elenchi della posta in arrivo e scansioni degli elementi obsoleti; Lobster concatena questi comandi in flussi di lavoro
come `weekly-review`, `inbox-triage`, `memory-consolidation` e
`shared-task-sync`, ciascuno con passaggi di approvazione. L'IA gestisce le valutazioni
(categorizzazione) quando è disponibile e, in caso contrario, ricorre a regole deterministiche.

- Discussione: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repository: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Correlati

- [Automazione](/it/automation) - tutti i meccanismi di automazione
- [Panoramica degli strumenti](/it/tools) - tutti gli strumenti disponibili per gli agenti
