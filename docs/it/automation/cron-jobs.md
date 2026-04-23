---
read_when:
    - Pianificazione di processi in background o riattivazioni
    - Collegamento di trigger esterni (webhook, Gmail) a OpenClaw
    - Decidere tra Heartbeat e Cron per le attività pianificate
summary: Job pianificati, webhook e trigger Gmail PubSub per lo scheduler Gateway
title: Attività pianificate
x-i18n:
    generated_at: "2026-04-23T08:23:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9565b73efc151c991ee6a1029c887c35d8673736913ddc5cdcfae09a4652f86
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Attività pianificate (Cron)

Cron è lo scheduler integrato del Gateway. Mantiene i processi, riattiva l'agente al momento giusto e può inviare l'output a un canale chat o a un endpoint webhook.

## Avvio rapido

```bash
# Add a one-shot reminder
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Check your jobs
openclaw cron list
openclaw cron show <job-id>

# See run history
openclaw cron runs --id <job-id>
```

## Come funziona cron

- Cron viene eseguito **all'interno del processo Gateway** (non all'interno del modello).
- Le definizioni dei processi vengono mantenute in `~/.openclaw/cron/jobs.json`, così i riavvii non fanno perdere le pianificazioni.
- Lo stato di esecuzione runtime viene mantenuto accanto, in `~/.openclaw/cron/jobs-state.json`. Se tieni le definizioni cron in git, traccia `jobs.json` e aggiungi `jobs-state.json` a gitignore.
- Dopo la separazione, le versioni precedenti di OpenClaw possono leggere `jobs.json`, ma potrebbero trattare i processi come nuovi perché i campi runtime ora si trovano in `jobs-state.json`.
- Tutte le esecuzioni cron creano record di [attività in background](/it/automation/tasks).
- I processi one-shot (`--at`) vengono eliminati automaticamente dopo il successo per impostazione predefinita.
- Le esecuzioni cron isolate chiudono in best-effort le schede/processi del browser tracciati per la sessione `cron:<jobId>` al termine dell'esecuzione, così l'automazione browser distaccata non lascia processi orfani.
- Le esecuzioni cron isolate proteggono anche da risposte di conferma obsolete. Se il
  primo risultato è solo un aggiornamento di stato intermedio (`on it`, `pulling everything
together` e suggerimenti simili) e nessuna esecuzione discendente del sottoagente è ancora
  responsabile della risposta finale, OpenClaw rilancia una richiesta una volta per ottenere il risultato
  effettivo prima della consegna.

<a id="maintenance"></a>

La riconciliazione delle attività per cron è gestita dal runtime: un'attività cron attiva resta viva finché il
runtime cron continua a tracciare quel processo come in esecuzione, anche se esiste ancora una vecchia riga di sessione figlia.
Una volta che il runtime smette di possedere il processo e scade la finestra di tolleranza di 5 minuti, la manutenzione può
contrassegnare l'attività come `lost`.

## Tipi di pianificazione

| Tipo    | Flag CLI  | Descrizione                                                   |
| ------- | --------- | ------------------------------------------------------------- |
| `at`    | `--at`    | Timestamp one-shot (ISO 8601 o relativo come `20m`)           |
| `every` | `--every` | Intervallo fisso                                              |
| `cron`  | `--cron`  | Espressione cron a 5 o 6 campi con `--tz` facoltativo         |

I timestamp senza fuso orario vengono trattati come UTC. Aggiungi `--tz America/New_York` per una pianificazione locale basata sull'orario civile.

Le espressioni ricorrenti all'inizio dell'ora vengono automaticamente scaglionate fino a 5 minuti per ridurre i picchi di carico. Usa `--exact` per forzare una tempistica precisa oppure `--stagger 30s` per una finestra esplicita.

### Il giorno del mese e il giorno della settimana usano la logica OR

Le espressioni cron vengono analizzate da [croner](https://github.com/Hexagon/croner). Quando sia il campo giorno del mese sia il campo giorno della settimana non usano wildcard, croner trova una corrispondenza quando **uno dei due** campi corrisponde, non entrambi. Questo è il comportamento standard di Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Questo si attiva ~5–6 volte al mese invece di 0–1 volte al mese. OpenClaw usa qui il comportamento OR predefinito di Croner. Per richiedere entrambe le condizioni, usa il modificatore del giorno della settimana `+` di Croner (`0 9 15 * +1`) oppure pianifica su un campo e verifica l'altro nel prompt o nel comando del processo.

## Stili di esecuzione

| Stile           | Valore `--session`   | Viene eseguito in        | Ideale per                      |
| --------------- | -------------------- | ------------------------ | ------------------------------- |
| Sessione main   | `main`               | Turno heartbeat successivo | Promemoria, eventi di sistema |
| Isolato         | `isolated`           | `cron:<jobId>` dedicato  | Report, attività in background  |
| Sessione corrente | `current`          | Associata al momento della creazione | Lavoro ricorrente dipendente dal contesto |
| Sessione personalizzata | `session:custom-id` | Sessione nominata persistente | Workflow che si basano sulla cronologia |

I processi in **sessione main** accodano un evento di sistema e facoltativamente riattivano l'heartbeat (`--wake now` o `--wake next-heartbeat`). I processi **isolati** eseguono un turno agente dedicato con una sessione nuova. Le **sessioni personalizzate** (`session:xxx`) mantengono il contesto tra le esecuzioni, abilitando workflow come standup giornalieri che si basano su riepiloghi precedenti.

Per i processi isolati, lo smontaggio runtime ora include la pulizia del browser in best-effort per quella sessione cron. Gli errori di pulizia vengono ignorati, così il risultato cron effettivo mantiene comunque la priorità.

Le esecuzioni cron isolate eliminano inoltre tutte le istanze runtime MCP incluse create per il processo tramite il percorso condiviso di pulizia del runtime. Questo corrisponde a come vengono terminati i client MCP di sessione main e sessione personalizzata, così i processi cron isolati non lasciano processi figlio stdio o connessioni MCP di lunga durata tra un'esecuzione e l'altra.

Quando le esecuzioni cron isolate orchestrano sottoagenti, la consegna preferisce anche l'output finale
discendente rispetto al testo intermedio obsoleto del genitore. Se i discendenti sono ancora
in esecuzione, OpenClaw sopprime quell'aggiornamento parziale del genitore invece di annunciarlo.

### Opzioni di payload per processi isolati

- `--message`: testo del prompt (obbligatorio per gli isolati)
- `--model` / `--thinking`: override di modello e livello di ragionamento
- `--light-context`: salta l'iniezione del file bootstrap dello spazio di lavoro
- `--tools exec,read`: limita gli strumenti che il processo può usare

`--model` usa il modello consentito selezionato per quel processo. Se il modello richiesto
non è consentito, cron registra un avviso e torna invece alla selezione del modello
dell'agente/predefinito del processo. Le catene di fallback configurate continuano ad applicarsi, ma un semplice
override del modello senza un elenco di fallback esplicito per processo non aggiunge più il primario
dell'agente come destinazione di nuovo tentativo extra nascosta.

La precedenza di selezione del modello per i processi isolati è:

1. Override del modello del hook Gmail (quando l'esecuzione proviene da Gmail e quell'override è consentito)
2. `model` del payload per processo
3. Override del modello di sessione cron memorizzato
4. Selezione del modello dell'agente/predefinito

La modalità rapida segue anch'essa la selezione live risolta. Se la configurazione del modello selezionato
ha `params.fastMode`, il cron isolato lo usa per impostazione predefinita. Un override `fastMode` di sessione
memorizzato continua però ad avere la precedenza sulla configurazione in entrambe le direzioni.

Se un'esecuzione isolata incontra un passaggio live di cambio modello, cron riprova con il
provider/modello cambiato e mantiene quella selezione live prima di riprovare. Quando il cambio
include anche un nuovo profilo di autenticazione, cron mantiene anche quell'override del profilo di autenticazione.
I tentativi sono limitati: dopo il tentativo iniziale più 2 tentativi dovuti a cambio, cron interrompe invece di entrare in un ciclo infinito.

## Consegna e output

| Modalità   | Cosa succede                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Consegna in fallback il testo finale alla destinazione se l'agente non ha inviato |
| `webhook`  | Invia con POST il payload dell'evento completato a un URL           |
| `none`     | Nessuna consegna di fallback da parte del runner                    |

Usa `--announce --channel telegram --to "-1001234567890"` per la consegna al canale. Per i topic dei forum Telegram, usa `-1001234567890:topic:123`. Le destinazioni Slack/Discord/Mattermost devono usare prefissi espliciti (`channel:<id>`, `user:<id>`).

Per i processi isolati, la consegna in chat è condivisa. Se è disponibile un
percorso chat, l'agente può usare lo strumento `message` anche quando il processo usa `--no-deliver`. Se l'
agente invia alla destinazione configurata/corrente, OpenClaw salta l'annuncio di fallback.
Altrimenti `announce`, `webhook` e `none` controllano solo ciò che il
runner fa con la risposta finale dopo il turno dell'agente.

Le notifiche di errore seguono un percorso di destinazione separato:

- `cron.failureDestination` imposta un valore predefinito globale per le notifiche di errore.
- `job.delivery.failureDestination` lo sovrascrive per singolo processo.
- Se nessuno dei due è impostato e il processo consegna già tramite `announce`, le notifiche di errore ora tornano in fallback a quella destinazione principale di announce.
- `delivery.failureDestination` è supportato solo nei processi con `sessionTarget="isolated"` a meno che la modalità di consegna principale non sia `webhook`.

## Esempi CLI

Promemoria one-shot (sessione main):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Processo isolato ricorrente con consegna:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Processo isolato con override di modello e ragionamento:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Webhook

Il Gateway può esporre endpoint webhook HTTP per trigger esterni. Abilita nella configurazione:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Autenticazione

Ogni richiesta deve includere il token hook tramite header:

- `Authorization: Bearer <token>` (consigliato)
- `x-openclaw-token: <token>`

I token nella query string vengono rifiutati.

### POST /hooks/wake

Accoda un evento di sistema per la sessione main:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (obbligatorio): descrizione dell'evento
- `mode` (facoltativo): `now` (predefinito) oppure `next-heartbeat`

### POST /hooks/agent

Esegue un turno agente isolato:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Campi: `message` (obbligatorio), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Hook mappati (POST /hooks/\<name\>)

I nomi hook personalizzati vengono risolti tramite `hooks.mappings` nella configurazione. Le mappature possono trasformare payload arbitrari in azioni `wake` o `agent` con template o trasformazioni tramite codice.

### Sicurezza

- Tieni gli endpoint hook dietro loopback, tailnet o reverse proxy attendibile.
- Usa un token hook dedicato; non riutilizzare i token di autenticazione del gateway.
- Mantieni `hooks.path` su un sottopercorso dedicato; `/` viene rifiutato.
- Imposta `hooks.allowedAgentIds` per limitare il routing esplicito di `agentId`.
- Mantieni `hooks.allowRequestSessionKey=false` a meno che tu non richieda sessioni selezionate dal chiamante.
- Se abiliti `hooks.allowRequestSessionKey`, imposta anche `hooks.allowedSessionKeyPrefixes` per vincolare le forme consentite delle chiavi di sessione.
- I payload hook vengono racchiusi da limiti di sicurezza per impostazione predefinita.

## Integrazione Gmail PubSub

Collega i trigger della casella Gmail a OpenClaw tramite Google PubSub.

**Prerequisiti**: CLI `gcloud`, `gog` (gogcli), hook OpenClaw abilitati, Tailscale per l'endpoint HTTPS pubblico.

### Configurazione guidata (consigliata)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Questo scrive la configurazione `hooks.gmail`, abilita il preset Gmail e usa Tailscale Funnel per l'endpoint push.

### Avvio automatico del Gateway

Quando `hooks.enabled=true` e `hooks.gmail.account` è impostato, il Gateway avvia `gog gmail watch serve` all'avvio e rinnova automaticamente il watch. Imposta `OPENCLAW_SKIP_GMAIL_WATCHER=1` per disattivarlo.

### Configurazione manuale una tantum

1. Seleziona il progetto GCP che possiede il client OAuth usato da `gog`:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Crea il topic e concedi a Gmail l'accesso push:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Avvia il watch:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Override del modello Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Gestione dei processi

```bash
# List all jobs
openclaw cron list

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Nota sull'override del modello:

- `openclaw cron add|edit --model ...` cambia il modello selezionato del processo.
- Se il modello è consentito, quel provider/modello esatto raggiunge
  l'esecuzione dell'agente isolato.
- Se non è consentito, cron avvisa e torna alla selezione del modello
  dell'agente/predefinito del processo.
- Le catene di fallback configurate continuano ad applicarsi, ma un semplice override `--model` con
  nessun elenco di fallback esplicito per processo non ricade più nel primario dell'agente
  come destinazione di nuovo tentativo extra silenziosa.

## Configurazione

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

Il sidecar dello stato runtime è derivato da `cron.store`: un archivio `.json` come
`~/clawd/cron/jobs.json` usa `~/clawd/cron/jobs-state.json`, mentre un percorso di archivio
senza suffisso `.json` aggiunge `-state.json`.

Disabilitare cron: `cron.enabled: false` oppure `OPENCLAW_SKIP_CRON=1`.

**Retry one-shot**: gli errori transitori (limite di frequenza, sovraccarico, rete, errore server) vengono ritentati fino a 3 volte con backoff esponenziale. Gli errori permanenti disabilitano immediatamente.

**Retry ricorrente**: backoff esponenziale (da 30s a 60m) tra i tentativi. Il backoff si reimposta dopo l'esecuzione successiva riuscita.

**Manutenzione**: `cron.sessionRetention` (predefinito `24h`) elimina le voci delle sessioni di esecuzione isolate. `cron.runLog.maxBytes` / `cron.runLog.keepLines` eliminano automaticamente i file del log di esecuzione.

## Risoluzione dei problemi

### Sequenza di comandi

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

### Cron non si attiva

- Controlla `cron.enabled` e la variabile d'ambiente `OPENCLAW_SKIP_CRON`.
- Conferma che il Gateway sia in esecuzione continua.
- Per le pianificazioni `cron`, verifica il fuso orario (`--tz`) rispetto al fuso orario dell'host.
- `reason: not-due` nell'output di esecuzione significa che l'esecuzione manuale è stata verificata con `openclaw cron run <jobId> --due` e il processo non era ancora in scadenza.

### Cron si è attivato ma non c'è consegna

- La modalità di consegna `none` significa che non è prevista alcuna trasmissione di fallback del runner. L'agente può
  comunque inviare direttamente con lo strumento `message` quando è disponibile un percorso chat.
- Destinazione di consegna mancante/non valida (`channel`/`to`) significa che l'invio in uscita è stato saltato.
- Gli errori di autenticazione del canale (`unauthorized`, `Forbidden`) significano che la consegna è stata bloccata dalle credenziali.
- Se l'esecuzione isolata restituisce solo il token silenzioso (`NO_REPLY` / `no_reply`),
  OpenClaw sopprime la consegna diretta in uscita e sopprime anche il percorso di riepilogo
  accodato di fallback, quindi non viene pubblicato nulla nella chat.
- Se l'agente deve inviare un messaggio all'utente direttamente, verifica che il processo abbia un
  percorso utilizzabile (`channel: "last"` con una chat precedente, oppure un canale/destinazione espliciti).

### Insidie del fuso orario

- Cron senza `--tz` usa il fuso orario dell'host del gateway.
- Le pianificazioni `at` senza fuso orario vengono trattate come UTC.
- `activeHours` di Heartbeat usa la risoluzione del fuso orario configurato.

## Correlati

- [Automazione e attività](/it/automation) — tutti i meccanismi di automazione in sintesi
- [Attività in background](/it/automation/tasks) — registro delle attività per le esecuzioni cron
- [Heartbeat](/it/gateway/heartbeat) — turni periodici della sessione main
- [Fuso orario](/it/concepts/timezone) — configurazione del fuso orario
