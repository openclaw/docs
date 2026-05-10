---
read_when:
    - Pianificazione di attività in background o riattivazioni
    - Collegare trigger esterni (Webhook, Gmail) a OpenClaw
    - Scegliere tra Heartbeat e Cron per le attività pianificate
sidebarTitle: Scheduled tasks
summary: Job pianificati, Webhook e trigger Gmail PubSub per il pianificatore del Gateway
title: Attività pianificate
x-i18n:
    generated_at: "2026-05-10T19:21:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: b837fc5c4cd2647bdab98b0421d2f89a528164c8eb93e7851428c73f8f59dccb
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron è lo scheduler integrato del Gateway. Persiste i job, risveglia l'agente al momento giusto e può consegnare l'output a un canale di chat o a un endpoint Webhook.

## Avvio rapido

<Steps>
  <Step title="Add a one-shot reminder">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Come funziona Cron

- Cron viene eseguito **all'interno del processo Gateway** (non all'interno del modello).
- Le definizioni dei job persistono in `~/.openclaw/cron/jobs.json`, quindi i riavvii non perdono le pianificazioni.
- Lo stato di esecuzione runtime persiste accanto a esso in `~/.openclaw/cron/jobs-state.json`. Se tieni traccia delle definizioni Cron in git, tieni traccia di `jobs.json` e aggiungi `jobs-state.json` a gitignore.
- Dopo la separazione, le versioni meno recenti di OpenClaw possono leggere `jobs.json`, ma potrebbero trattare i job come nuovi perché i campi runtime ora si trovano in `jobs-state.json`.
- Quando `jobs.json` viene modificato mentre il Gateway è in esecuzione o arrestato, OpenClaw confronta i campi di pianificazione modificati con i metadati degli slot runtime in sospeso e cancella i valori `nextRunAtMs` obsoleti. Riscritture di sola formattazione o solo dell'ordine delle chiavi preservano lo slot in sospeso.
- Tutte le esecuzioni Cron creano record di [attività in background](/it/automation/tasks).
- All'avvio del Gateway, i job di turno agente isolato scaduti vengono ripianificati al di fuori della finestra di connessione del canale invece di essere riprodotti immediatamente, così l'avvio di Discord/Telegram e la configurazione dei comandi nativi restano reattivi dopo i riavvii.
- I job una tantum (`--at`) si eliminano automaticamente dopo il successo per impostazione predefinita.
- Le esecuzioni Cron isolate chiudono con il massimo impegno le schede/i processi del browser tracciati per la loro sessione `cron:<jobId>` al completamento dell'esecuzione, così l'automazione del browser scollegata non lascia processi orfani.
- Le esecuzioni Cron isolate che ricevono la concessione ristretta di autopulizia Cron possono comunque leggere lo stato dello scheduler, un elenco filtrato su se stesse del loro job corrente e la cronologia delle esecuzioni di quel job, così i controlli di stato/Heartbeat possono ispezionare la propria pianificazione senza ottenere un accesso più ampio alla mutazione Cron.
- Le esecuzioni Cron isolate proteggono anche da risposte di conferma obsolete. Se il primo risultato è solo un aggiornamento di stato provvisorio (`on it`, `pulling everything together` e indicazioni simili) e nessuna esecuzione di subagent discendente è ancora responsabile della risposta finale, OpenClaw richiede di nuovo una volta il risultato effettivo prima della consegna.
- Le esecuzioni Cron isolate preferiscono i metadati strutturati di negazione dell'esecuzione dall'esecuzione incorporata, poi ripiegano su marcatori noti di riepilogo/output finale come `SYSTEM_RUN_DENIED` e `INVALID_REQUEST`, così un comando bloccato non viene segnalato come esecuzione riuscita.
- Le esecuzioni Cron isolate trattano anche gli errori dell'agente a livello di esecuzione come errori del job anche quando non viene prodotto alcun payload di risposta, così gli errori di modello/provider incrementano i contatori degli errori e attivano le notifiche di errore invece di contrassegnare il job come riuscito.
- Quando un job di turno agente isolato raggiunge `timeoutSeconds`, Cron interrompe l'esecuzione dell'agente sottostante e gli concede una breve finestra di pulizia. Se l'esecuzione non si svuota, la pulizia di proprietà del Gateway forza la cancellazione della proprietà della sessione di quell'esecuzione prima che Cron registri il timeout, così il lavoro di chat in coda non resta bloccato dietro una sessione di elaborazione obsoleta.
- Se un turno agente isolato si blocca prima dell'avvio del runner o prima della prima chiamata al modello, Cron registra un timeout specifico per fase come `setup timed out before runner start` o `stalled before first model call (last phase: context-engine)`. Questi watchdog coprono provider incorporati e provider supportati da CLI prima che il loro processo CLI esterno sia effettivamente avviato, e sono limitati indipendentemente dai valori lunghi di `timeoutSeconds` così gli errori di avvio a freddo/auth/contesto emergono rapidamente invece di attendere l'intero budget del job.

<a id="maintenance"></a>

<Note>
La riconciliazione delle attività per Cron è prima di proprietà del runtime e poi supportata dalla cronologia durevole: un'attività Cron attiva resta live mentre il runtime Cron traccia ancora quel job come in esecuzione, anche se esiste ancora una vecchia riga di sessione figlia. Una volta che il runtime smette di possedere il job e la finestra di tolleranza di 5 minuti scade, la manutenzione controlla i log di esecuzione persistiti e lo stato del job per l'esecuzione `cron:<jobId>:<startedAt>` corrispondente. Se quella cronologia durevole mostra un risultato terminale, il registro delle attività viene finalizzato da esso; altrimenti la manutenzione di proprietà del Gateway può contrassegnare l'attività come `lost`. L'audit CLI offline può recuperare dalla cronologia durevole, ma non tratta il proprio insieme vuoto di job attivi in-process come prova che un'esecuzione Cron di proprietà del Gateway sia scomparsa.
</Note>

## Tipi di pianificazione

| Tipo    | Flag CLI  | Descrizione                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Timestamp una tantum (ISO 8601 o relativo come `20m`)    |
| `every` | `--every` | Intervallo fisso                                          |
| `cron`  | `--cron`  | Espressione cron a 5 o 6 campi con `--tz` opzionale |

I timestamp senza fuso orario sono trattati come UTC. Aggiungi `--tz America/New_York` per la pianificazione con ora locale.

Le espressioni ricorrenti all'inizio dell'ora vengono scaglionate automaticamente fino a 5 minuti per ridurre i picchi di carico. Usa `--exact` per forzare una temporizzazione precisa o `--stagger 30s` per una finestra esplicita.

### Giorno del mese e giorno della settimana usano la logica OR

Le espressioni Cron sono analizzate da [croner](https://github.com/Hexagon/croner). Quando sia il campo giorno del mese sia il campo giorno della settimana non sono wildcard, croner corrisponde quando **uno qualsiasi** dei due campi corrisponde, non entrambi. Questo è il comportamento cron Vixie standard.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Questo si attiva circa 5-6 volte al mese invece di 0-1 volte al mese. OpenClaw usa qui il comportamento OR predefinito di Croner. Per richiedere entrambe le condizioni, usa il modificatore giorno della settimana `+` di Croner (`0 9 15 * +1`) oppure pianifica su un campo e verifica l'altro nel prompt o nel comando del tuo job.

## Stili di esecuzione

| Stile           | Valore `--session`   | Viene eseguito in                  | Ideale per                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sessione principale    | `main`              | Prossimo turno Heartbeat      | Promemoria, eventi di sistema        |
| Isolato        | `isolated`          | `cron:<jobId>` dedicato | Report, attività in background      |
| Sessione corrente | `current`           | Vincolato al momento della creazione   | Lavoro ricorrente consapevole del contesto    |
| Sessione personalizzata  | `session:custom-id` | Sessione denominata persistente | Workflow che si basano sulla cronologia |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    I job della **sessione principale** accodano un evento di sistema e facoltativamente risvegliano l'Heartbeat (`--wake now` o `--wake next-heartbeat`). Quegli eventi di sistema non estendono la freschezza del reset giornaliero/inattivo per la sessione di destinazione. I job **isolati** eseguono un turno agente dedicato con una sessione nuova. Le **sessioni personalizzate** (`session:xxx`) persistono il contesto tra le esecuzioni, abilitando workflow come standup giornalieri che si basano sui riepiloghi precedenti.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Per i job isolati, "sessione nuova" significa un nuovo transcript/id sessione per ogni esecuzione. OpenClaw può riportare preferenze sicure come impostazioni thinking/fast/verbose, etichette e override espliciti di modello/auth selezionati dall'utente, ma non eredita il contesto di conversazione ambientale da una vecchia riga Cron: instradamento di canale/gruppo, policy di invio o coda, elevazione, origine o associazione runtime ACP. Usa `current` o `session:<id>` quando un job ricorrente deve basarsi deliberatamente sullo stesso contesto di conversazione.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Per i job isolati, lo smantellamento runtime ora include la pulizia del browser con il massimo impegno per quella sessione Cron. Gli errori di pulizia vengono ignorati così il risultato Cron effettivo resta prioritario.

    Le esecuzioni Cron isolate eliminano anche tutte le istanze runtime MCP in bundle create per il job tramite il percorso condiviso di pulizia runtime. Questo corrisponde al modo in cui vengono smantellati i client MCP di sessione principale e sessione personalizzata, quindi i job Cron isolati non perdono processi figli stdio o connessioni MCP a lunga durata tra le esecuzioni.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Quando le esecuzioni Cron isolate orchestrano subagent, la consegna preferisce anche l'output finale discendente rispetto al testo provvisorio obsoleto del genitore. Se i discendenti sono ancora in esecuzione, OpenClaw sopprime quell'aggiornamento parziale del genitore invece di annunciarlo.

    Per i target di annuncio Discord solo testo, OpenClaw invia una volta il testo canonico finale dell'assistente invece di riprodurre sia i payload di testo in streaming/intermedi sia la risposta finale. I payload Discord multimediali e strutturati vengono comunque consegnati come payload separati così allegati e componenti non vengono eliminati.

  </Accordion>
</AccordionGroup>

### Opzioni di payload per job isolati

<ParamField path="--message" type="string" required>
  Testo del prompt (richiesto per isolati).
</ParamField>
<ParamField path="--model" type="string">
  Override del modello; usa il modello consentito selezionato per il job.
</ParamField>
<ParamField path="--thinking" type="string">
  Override del livello di thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Salta l'iniezione dei file di bootstrap dell'area di lavoro.
</ParamField>
<ParamField path="--tools" type="string">
  Limita quali strumenti il job può usare, per esempio `--tools exec,read`.
</ParamField>

`--model` usa il modello consentito selezionato come modello primario di quel job. Non è uguale a un override `/model` di sessione chat: le catene di fallback configurate si applicano comunque quando il primario del job fallisce. Se il modello richiesto non è consentito o non può essere risolto, Cron fa fallire l'esecuzione con un errore di convalida esplicito invece di ripiegare silenziosamente sulla selezione di modello agente/predefinita del job.

I job Cron possono anche portare `fallbacks` a livello di payload. Quando presente, quell'elenco sostituisce la catena di fallback configurata per il job. Usa `fallbacks: []` nel payload/API del job quando vuoi un'esecuzione Cron rigorosa che provi solo il modello selezionato. Se un job ha `--model` ma non ha fallback né di payload né configurati, OpenClaw passa un override di fallback vuoto esplicito così il primario dell'agente non viene aggiunto come target di nuovo tentativo nascosto.

La precedenza di selezione del modello per i job isolati è:

1. Override del modello dell'hook Gmail (quando l'esecuzione proviene da Gmail e quell'override è consentito)
2. `model` del payload per job
3. Override del modello della sessione Cron memorizzato selezionato dall'utente
4. Selezione modello agente/predefinita

Anche la modalità veloce segue la selezione live risolta. Se la configurazione del modello selezionato ha `params.fastMode`, Cron isolato la usa per impostazione predefinita. Un override `fastMode` di sessione memorizzato vince comunque sulla configurazione in entrambe le direzioni.

Se un'esecuzione isolata incontra un handoff di cambio modello live, Cron ritenta con il provider/modello cambiato e persiste quella selezione live per l'esecuzione attiva prima di ritentare. Quando il cambio porta anche un nuovo profilo auth, Cron persiste anche quell'override del profilo auth per l'esecuzione attiva. I tentativi sono limitati: dopo il tentativo iniziale più 2 tentativi di cambio, Cron interrompe invece di continuare in ciclo per sempre.

Prima che un'esecuzione Cron isolata entri nell'agent runner, OpenClaw controlla gli endpoint dei provider locali raggiungibili per i provider configurati con `api: "ollama"` e `api: "openai-completions"` il cui `baseUrl` è loopback, rete privata o `.local`. Se quell'endpoint non è attivo, l'esecuzione viene registrata come `skipped` con un errore chiaro di provider/modello invece di avviare una chiamata al modello. Il risultato dell'endpoint viene memorizzato nella cache per 5 minuti, quindi molti job in scadenza che usano lo stesso server locale Ollama, vLLM, SGLang o LM Studio non attivo condividono una piccola sonda invece di creare una tempesta di richieste. Le esecuzioni provider-preflight saltate non incrementano il backoff degli errori di esecuzione; abilita `failureAlert.includeSkipped` quando vuoi notifiche ripetute per i salti.

## Recapito e output

| Modalità   | Cosa succede                                                       |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Recapita il testo finale di fallback al target se l'agente non lo ha inviato |
| `webhook`  | Invia con POST il payload dell'evento completato a un URL          |
| `none`     | Nessun recapito di fallback del runner                             |

Usa `--announce --channel telegram --to "-1001234567890"` per il recapito al canale. Per gli argomenti dei forum Telegram, usa `-1001234567890:topic:123`; i chiamanti RPC/config diretti possono anche passare `delivery.threadId` come stringa o numero. I target Slack/Discord/Mattermost devono usare prefissi espliciti (`channel:<id>`, `user:<id>`). Gli ID delle stanze Matrix distinguono tra maiuscole e minuscole; usa l'ID esatto della stanza o la forma `room:!room:server` da Matrix.

Quando il recapito announce usa `channel: "last"` oppure omette `channel`, un target con prefisso di provider come `telegram:123` può selezionare il canale prima che Cron ripieghi sulla cronologia della sessione o su un singolo canale configurato. Solo i prefissi pubblicizzati dal Plugin caricato sono selettori di provider. Se `delivery.channel` è esplicito, il prefisso del target deve nominare lo stesso provider; per esempio, `channel: "whatsapp"` con `to: "telegram:123"` viene rifiutato invece di lasciare che WhatsApp interpreti l'ID Telegram come numero di telefono. I prefissi di tipo target e servizio come `channel:<id>`, `user:<id>`, `imessage:<handle>` e `sms:<number>` restano sintassi di target di proprietà del canale, non selettori di provider.

Per i job isolati, il recapito chat è condiviso. Se è disponibile una route chat, l'agente può usare lo strumento `message` anche quando il job usa `--no-deliver`. Se l'agente invia al target configurato/corrente, OpenClaw salta l'announce di fallback. Altrimenti `announce`, `webhook` e `none` controllano solo ciò che il runner fa con la risposta finale dopo il turno dell'agente.

Quando un agente crea un promemoria isolato da una chat attiva, OpenClaw memorizza il target di recapito live preservato per la route announce di fallback. Le chiavi di sessione interne possono essere minuscole; i target di recapito del provider non vengono ricostruiti da quelle chiavi quando è disponibile il contesto della chat corrente.

Il recapito announce implicito usa le allowlist dei canali configurate per convalidare e reindirizzare i target obsoleti. Le approvazioni dell'archivio di abbinamento DM non sono destinatari dell'automazione di fallback; imposta `delivery.to` oppure configura la voce `allowFrom` del canale quando un job pianificato deve inviare proattivamente a un DM.

Le notifiche di errore seguono un percorso di destinazione separato:

- `cron.failureDestination` imposta un valore predefinito globale per le notifiche di errore.
- `job.delivery.failureDestination` lo sovrascrive per singolo job.
- Se nessuno dei due è impostato e il job recapita già tramite `announce`, le notifiche di errore ora ripiegano su quel target announce primario.
- `delivery.failureDestination` è supportato solo sui job `sessionTarget="isolated"` a meno che la modalità di recapito primaria sia `webhook`.
- `failureAlert.includeSkipped: true` abilita per un job o per la policy di avviso Cron globale gli avvisi ripetuti sulle esecuzioni saltate. Le esecuzioni saltate mantengono un contatore separato di salti consecutivi, quindi non influenzano il backoff degli errori di esecuzione.

## Esempi CLI

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
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
  </Tab>
  <Tab title="Model and thinking override">
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
  </Tab>
</Tabs>

## Webhook

Il Gateway può esporre endpoint Webhook HTTP per trigger esterni. Abilita nella configurazione:

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

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Accoda un evento di sistema per la sessione principale:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Descrizione dell'evento.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` o `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Esegui un turno agente isolato:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Campi: `message` (obbligatorio), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    I nomi hook personalizzati vengono risolti tramite `hooks.mappings` nella configurazione. Le mappature possono trasformare payload arbitrari in azioni `wake` o `agent` con template o trasformazioni di codice.
  </Accordion>
</AccordionGroup>

<Warning>
Tieni gli endpoint hook dietro loopback, tailnet o un reverse proxy attendibile.

- Usa un token hook dedicato; non riutilizzare i token di autenticazione del gateway.
- Mantieni `hooks.path` su un sottopercorso dedicato; `/` viene rifiutato.
- Imposta `hooks.allowedAgentIds` per limitare il routing esplicito di `agentId`.
- Mantieni `hooks.allowRequestSessionKey=false` a meno che tu non richieda sessioni selezionate dal chiamante.
- Se abiliti `hooks.allowRequestSessionKey`, imposta anche `hooks.allowedSessionKeyPrefixes` per vincolare le forme consentite delle chiavi di sessione.
- I payload hook sono racchiusi con confini di sicurezza per impostazione predefinita.

</Warning>

## Integrazione Gmail PubSub

Collega i trigger della posta in arrivo Gmail a OpenClaw tramite Google PubSub.

<Note>
**Prerequisiti:** CLI `gcloud`, `gog` (gogcli), hook OpenClaw abilitati, Tailscale per l'endpoint HTTPS pubblico.
</Note>

### Configurazione guidata (consigliata)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Questo scrive la configurazione `hooks.gmail`, abilita il preset Gmail e usa Tailscale Funnel per l'endpoint push.

### Avvio automatico del Gateway

Quando `hooks.enabled=true` e `hooks.gmail.account` è impostato, il Gateway avvia `gog gmail watch serve` al boot e rinnova automaticamente il watch. Imposta `OPENCLAW_SKIP_GMAIL_WATCHER=1` per disattivarlo.

### Configurazione manuale una tantum

<Steps>
  <Step title="Select the GCP project">
    Seleziona il progetto GCP proprietario del client OAuth usato da `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

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

## Gestione dei job

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

<Note>
Nota sull'override del modello:

- `openclaw cron add|edit --model ...` modifica il modello selezionato del job.
- Se il modello è consentito, quel provider/modello esatto raggiunge l'esecuzione dell'agente isolato.
- Se non è consentito o non può essere risolto, Cron fa fallire l'esecuzione con un errore di convalida esplicito.
- Le catene di fallback configurate continuano ad applicarsi perché `--model` di Cron è un primario del job, non un override `/model` di sessione.
- Il payload `fallbacks` sostituisce i fallback configurati per quel job; `fallbacks: []` disabilita il fallback e rende l'esecuzione rigorosa.
- Un semplice `--model` senza un elenco di fallback esplicito o configurato non ripiega sul primario dell'agente come target di retry aggiuntivo silenzioso.

</Note>

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

`maxConcurrentRuns` limita sia il dispatch Cron pianificato sia l'esecuzione dei turni agente isolati. I turni agente Cron isolati usano internamente la corsia di esecuzione dedicata `cron-nested` della coda, quindi aumentare questo valore consente alle esecuzioni LLM Cron indipendenti di avanzare in parallelo invece di avviare solo i loro wrapper Cron esterni. La corsia condivisa non-Cron `nested` non viene ampliata da questa impostazione.

Il sidecar dello stato di runtime deriva da `cron.store`: uno store `.json` come `~/clawd/cron/jobs.json` usa `~/clawd/cron/jobs-state.json`, mentre un percorso di store senza suffisso `.json` aggiunge `-state.json`.

Se modifichi manualmente `jobs.json`, lascia `jobs-state.json` fuori dal controllo del codice sorgente. OpenClaw usa quel sidecar per slot in sospeso, marcatori attivi, metadati dell'ultima esecuzione e identità della pianificazione che indica allo scheduler quando un job modificato esternamente richiede un nuovo `nextRunAtMs`.

Disabilita Cron: `cron.enabled: false` o `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Retry one-shot**: gli errori transitori (limite di frequenza, sovraccarico, rete, errore del server) ritentano fino a 3 volte con backoff esponenziale. Gli errori permanenti disabilitano immediatamente.

    **Retry ricorrente**: backoff esponenziale (da 30s a 60m) tra i retry. Il backoff si azzera dopo la successiva esecuzione riuscita.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (predefinito `24h`) elimina le voci delle sessioni di esecuzione isolate. `cron.runLog.maxBytes` / `cron.runLog.keepLines` eliminano automaticamente i file di log delle esecuzioni.
  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

### Scala dei comandi

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

<AccordionGroup>
  <Accordion title="Cron non si attiva">
    - Controlla `cron.enabled` e la variabile d'ambiente `OPENCLAW_SKIP_CRON`.
    - Conferma che il Gateway sia in esecuzione continuativamente.
    - Per le pianificazioni `cron`, verifica il fuso orario (`--tz`) rispetto al fuso orario dell'host.
    - `reason: not-due` nell'output dell'esecuzione significa che l'esecuzione manuale è stata controllata con `openclaw cron run <jobId> --due` e il job non era ancora previsto.

  </Accordion>
  <Accordion title="Cron si è attivato ma senza recapito">
    - La modalità di recapito `none` significa che non è previsto alcun invio di fallback da parte del runner. L'agente può comunque inviare direttamente con lo strumento `message` quando è disponibile una rotta di chat.
    - Destinazione di recapito mancante/non valida (`channel`/`to`) significa che l'invio in uscita è stato saltato.
    - Per Matrix, i job copiati o legacy con ID stanza `delivery.to` in minuscolo possono non riuscire perché gli ID stanza di Matrix distinguono tra maiuscole e minuscole. Modifica il job usando il valore esatto `!room:server` o `room:!room:server` da Matrix.
    - Gli errori di autenticazione del canale (`unauthorized`, `Forbidden`) significano che il recapito è stato bloccato dalle credenziali.
    - Se l'esecuzione isolata restituisce solo il token silenzioso (`NO_REPLY` / `no_reply`), OpenClaw sopprime il recapito diretto in uscita e sopprime anche il percorso di riepilogo accodato di fallback, quindi non viene pubblicato nulla nella chat.
    - Se l'agente deve inviare un messaggio all'utente autonomamente, controlla che il job abbia una rotta utilizzabile (`channel: "last"` con una chat precedente, oppure un canale/target esplicito).

  </Accordion>
  <Accordion title="Cron o Heartbeat sembra impedire il rollover /new-style">
    - La freschezza del reset giornaliero e per inattività non si basa su `updatedAt`; consulta [Gestione delle sessioni](/it/concepts/session#session-lifecycle).
    - Le riattivazioni Cron, le esecuzioni Heartbeat, le notifiche exec e la contabilità del Gateway possono aggiornare la riga della sessione per routing/stato, ma non estendono `sessionStartedAt` o `lastInteractionAt`.
    - Per le righe legacy create prima dell'esistenza di questi campi, OpenClaw può recuperare `sessionStartedAt` dall'intestazione di sessione JSONL della trascrizione quando il file è ancora disponibile. Le righe legacy inattive senza `lastInteractionAt` usano quell'ora di inizio recuperata come riferimento di inattività.

  </Accordion>
  <Accordion title="Insidie dei fusi orari">
    - Cron senza `--tz` usa il fuso orario dell'host Gateway.
    - Le pianificazioni `at` senza fuso orario sono trattate come UTC.
    - `activeHours` di Heartbeat usa la risoluzione del fuso orario configurata.

  </Accordion>
</AccordionGroup>

## Correlati

- [Automazione e attività](/it/automation) — tutti i meccanismi di automazione in sintesi
- [Attività in background](/it/automation/tasks) — registro delle attività per le esecuzioni cron
- [Heartbeat](/it/gateway/heartbeat) — turni periodici della sessione principale
- [Fuso orario](/it/concepts/timezone) — configurazione del fuso orario
