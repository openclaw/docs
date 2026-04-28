---
read_when:
    - Pianificazione di processi in background o riattivazioni
    - Collegamento di trigger esterni (Webhook, Gmail) a OpenClaw
    - Decidere tra Heartbeat e Cron per le attività pianificate
sidebarTitle: Scheduled tasks
summary: Processi pianificati, Webhook e trigger PubSub di Gmail per lo scheduler del Gateway
title: Attività pianificate
x-i18n:
    generated_at: "2026-04-26T11:22:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41908a34ddec3359e414ff4fbca128cc30db53273ee96a6dd12026da950b95ec
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron è lo scheduler integrato del Gateway. Mantiene persistenti i processi, riattiva l'agente al momento giusto e può recapitare l'output a un canale chat o a un endpoint Webhook.

## Avvio rapido

<Steps>
  <Step title="Aggiungi un promemoria una tantum">
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
  <Step title="Controlla i tuoi processi">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Visualizza la cronologia delle esecuzioni">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Come funziona Cron

- Cron viene eseguito **all'interno del processo Gateway** (non all'interno del modello).
- Le definizioni dei processi vengono mantenute persistenti in `~/.openclaw/cron/jobs.json`, quindi i riavvii non fanno perdere le pianificazioni.
- Lo stato di esecuzione runtime viene mantenuto persistente accanto a esso in `~/.openclaw/cron/jobs-state.json`. Se tieni traccia delle definizioni cron in git, tieni traccia di `jobs.json` e aggiungi `jobs-state.json` a gitignore.
- Dopo la separazione, le versioni meno recenti di OpenClaw possono leggere `jobs.json`, ma potrebbero trattare i processi come nuovi perché i campi runtime ora si trovano in `jobs-state.json`.
- Tutte le esecuzioni cron creano record di [attività in background](/it/automation/tasks).
- I processi una tantum (`--at`) vengono eliminati automaticamente dopo il successo per impostazione predefinita.
- Le esecuzioni cron isolate chiudono, nei limiti del possibile, le schede/processi del browser tracciati per la loro sessione `cron:<jobId>` al completamento dell'esecuzione, così l'automazione del browser scollegata non lascia processi orfani.
- Le esecuzioni cron isolate proteggono anche dalle risposte di conferma obsolete. Se il primo risultato è solo un aggiornamento di stato intermedio (`on it`, `pulling everything together` e indicazioni simili) e nessuna esecuzione discendente di subagent è ancora responsabile della risposta finale, OpenClaw riformula il prompt una volta per ottenere il risultato effettivo prima della consegna.

<a id="maintenance"></a>

<Note>
La riconciliazione delle attività per cron è prima di tutto di proprietà del runtime, in secondo luogo supportata dalla cronologia durevole: un'attività cron attiva resta attiva finché il runtime cron continua a tracciare quel processo come in esecuzione, anche se esiste ancora una vecchia riga di sessione figlia. Una volta che il runtime non è più proprietario del processo e scade il periodo di tolleranza di 5 minuti, i controlli di manutenzione verificano i log di esecuzione persistenti e lo stato del processo per l'esecuzione corrispondente `cron:<jobId>:<startedAt>`. Se quella cronologia durevole mostra un risultato terminale, il registro delle attività viene finalizzato a partire da essa; altrimenti la manutenzione di proprietà del Gateway può contrassegnare l'attività come `lost`. Il controllo CLI offline può recuperare dalla cronologia durevole, ma non considera il proprio insieme vuoto di processi attivi in-process come prova che un'esecuzione cron di proprietà del Gateway sia scomparsa.
</Note>

## Tipi di pianificazione

| Tipo    | Flag CLI  | Descrizione                                                   |
| ------- | --------- | ------------------------------------------------------------- |
| `at`    | `--at`    | Timestamp una tantum (ISO 8601 o relativo come `20m`)         |
| `every` | `--every` | Intervallo fisso                                              |
| `cron`  | `--cron`  | Espressione cron a 5 o 6 campi con `--tz` facoltativo        |

I timestamp senza fuso orario vengono trattati come UTC. Aggiungi `--tz America/New_York` per una pianificazione in base all'ora locale.

Le espressioni ricorrenti allo scoccare dell'ora vengono automaticamente sfalsate fino a 5 minuti per ridurre i picchi di carico. Usa `--exact` per forzare la tempistica precisa o `--stagger 30s` per una finestra esplicita.

### Il giorno del mese e il giorno della settimana usano la logica OR

Le espressioni cron vengono analizzate da [croner](https://github.com/Hexagon/croner). Quando sia il campo del giorno del mese sia quello del giorno della settimana non sono wildcard, croner corrisponde quando **uno dei due** campi corrisponde, non entrambi. Questo è il comportamento cron standard di Vixie.

```
# Previsto: "9 AM il 15, solo se è lunedì"
# Reale:    "9 AM ogni 15, E 9 AM ogni lunedì"
0 9 15 * 1
```

Questo si attiva ~5–6 volte al mese invece di 0–1 volte al mese. OpenClaw usa qui il comportamento OR predefinito di Croner. Per richiedere entrambe le condizioni, usa il modificatore del giorno della settimana `+` di Croner (`0 9 15 * +1`) oppure pianifica su un campo e controlla l'altro nel prompt o nel comando del tuo processo.

## Stili di esecuzione

| Stile           | Valore `--session`   | Viene eseguito in         | Ideale per                     |
| --------------- | -------------------- | ------------------------- | ------------------------------ |
| Sessione principale | `main`           | Turno Heartbeat successivo | Promemoria, eventi di sistema  |
| Isolato         | `isolated`           | `cron:<jobId>` dedicato   | Report, attività in background |
| Sessione corrente | `current`          | Associata al momento della creazione | Lavoro ricorrente consapevole del contesto |
| Sessione personalizzata | `session:custom-id` | Sessione nominata persistente | Workflow che si basano sulla cronologia |

<AccordionGroup>
  <Accordion title="Sessione principale vs isolata vs personalizzata">
    I processi in **sessione principale** accodano un evento di sistema e facoltativamente riattivano Heartbeat (`--wake now` o `--wake next-heartbeat`). Questi eventi di sistema non estendono la freschezza del reset giornaliero/inattività per la sessione di destinazione. I processi **isolati** eseguono un turno agente dedicato con una sessione nuova. Le **sessioni personalizzate** (`session:xxx`) mantengono il contesto tra le esecuzioni, consentendo workflow come standup giornalieri che si basano su riepiloghi precedenti.
  </Accordion>
  <Accordion title="Cosa significa 'sessione nuova' per i processi isolati">
    Per i processi isolati, "sessione nuova" significa un nuovo transcript/id di sessione per ogni esecuzione. OpenClaw può mantenere preferenze sicure come impostazioni di thinking/fast/verbose, etichette e override espliciti di modello/autenticazione selezionati dall'utente, ma non eredita il contesto ambientale della conversazione da una riga cron precedente: instradamento canale/gruppo, criterio di invio o coda, elevazione, origine o binding runtime ACP. Usa `current` o `session:<id>` quando un processo ricorrente deve intenzionalmente basarsi sullo stesso contesto di conversazione.
  </Accordion>
  <Accordion title="Pulizia runtime">
    Per i processi isolati, lo smantellamento runtime ora include la pulizia del browser per quella sessione cron nei limiti del possibile. Gli errori di pulizia vengono ignorati, così prevale comunque il risultato cron effettivo.

    Le esecuzioni cron isolate eliminano anche qualsiasi istanza runtime MCP inclusa creata per il processo tramite il percorso condiviso di pulizia runtime. Questo corrisponde al modo in cui i client MCP di sessione principale e sessione personalizzata vengono smantellati, quindi i processi cron isolati non lasciano processi figlio stdio o connessioni MCP di lunga durata tra un'esecuzione e l'altra.

  </Accordion>
  <Accordion title="Consegna tramite subagent e Discord">
    Quando le esecuzioni cron isolate orchestrano subagent, la consegna preferisce anche l'output finale discendente al testo intermedio obsoleto del genitore. Se i discendenti sono ancora in esecuzione, OpenClaw sopprime quell'aggiornamento parziale del genitore invece di annunciarlo.

    Per le destinazioni di annuncio Discord solo testo, OpenClaw invia una sola volta il testo finale canonico dell'assistente invece di riprodurre sia i payload di testo in streaming/intermedi sia la risposta finale. I payload Discord multimediali e strutturati vengono comunque consegnati come payload separati, così allegati e componenti non vengono persi.

  </Accordion>
</AccordionGroup>

### Opzioni di payload per i processi isolati

<ParamField path="--message" type="string" required>
  Testo del prompt (obbligatorio per l'isolato).
</ParamField>
<ParamField path="--model" type="string">
  Override del modello; usa il modello consentito selezionato per il processo.
</ParamField>
<ParamField path="--thinking" type="string">
  Override del livello di thinking.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Salta l'iniezione del file bootstrap del workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Limita quali strumenti il processo può usare, ad esempio `--tools exec,read`.
</ParamField>

`--model` usa il modello consentito selezionato per quel processo. Se il modello richiesto non è consentito, cron registra un avviso e torna invece alla selezione del modello agente/predefinito del processo. Le catene di fallback configurate continuano comunque ad applicarsi, ma un semplice override del modello senza un elenco di fallback esplicito per processo non aggiunge più il modello primario dell'agente come destinazione di retry extra nascosta.

La precedenza di selezione del modello per i processi isolati è:

1. Override del modello del hook Gmail (quando l'esecuzione proviene da Gmail e quell'override è consentito)
2. `model` del payload per processo
3. Override del modello della sessione cron memorizzata selezionato dall'utente
4. Selezione del modello agente/predefinito

Anche la modalità fast segue la selezione attiva risolta. Se la configurazione del modello selezionato ha `params.fastMode`, il cron isolato la usa per impostazione predefinita. Un override `fastMode` della sessione memorizzata ha comunque la precedenza sulla configurazione in entrambe le direzioni.

Se un'esecuzione isolata incontra un passaggio live di cambio modello, cron riprova con il provider/modello cambiato e mantiene persistente quella selezione live per l'esecuzione attiva prima di riprovare. Quando il cambio comporta anche un nuovo profilo di autenticazione, cron mantiene persistente anche quell'override del profilo di autenticazione per l'esecuzione attiva. I retry sono limitati: dopo il tentativo iniziale più 2 retry di cambio, cron interrompe l'operazione invece di entrare in un ciclo infinito.

## Consegna e output

| Modalità   | Cosa succede                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Consegna in fallback il testo finale alla destinazione se l'agente non lo ha inviato |
| `webhook`  | Esegue un POST del payload dell'evento completato a un URL          |
| `none`     | Nessuna consegna fallback del runner                                |

Usa `--announce --channel telegram --to "-1001234567890"` per la consegna a un canale. Per i topic del forum Telegram, usa `-1001234567890:topic:123`. Le destinazioni Slack/Discord/Mattermost devono usare prefissi espliciti (`channel:<id>`, `user:<id>`). Gli ID stanza Matrix fanno distinzione tra maiuscole e minuscole; usa l'ID stanza esatto o il formato `room:!room:server` di Matrix.

Per i processi isolati, la consegna chat è condivisa. Se è disponibile un percorso chat, l'agente può usare lo strumento `message` anche quando il processo usa `--no-deliver`. Se l'agente invia alla destinazione configurata/corrente, OpenClaw salta l'annuncio fallback. In caso contrario, `announce`, `webhook` e `none` controllano solo ciò che il runner fa con la risposta finale dopo il turno dell'agente.

Quando un agente crea un promemoria isolato da una chat attiva, OpenClaw memorizza la destinazione di consegna live preservata per il percorso di annuncio fallback. Le chiavi di sessione interne possono essere minuscole; le destinazioni di consegna del provider non vengono ricostruite da quelle chiavi quando è disponibile il contesto chat corrente.

Le notifiche di errore seguono un percorso di destinazione separato:

- `cron.failureDestination` imposta un valore predefinito globale per le notifiche di errore.
- `job.delivery.failureDestination` lo sovrascrive per singolo processo.
- Se nessuno dei due è impostato e il processo consegna già tramite `announce`, le notifiche di errore ora usano in fallback quella destinazione di annuncio primaria.
- `delivery.failureDestination` è supportato solo nei processi `sessionTarget="isolated"` a meno che la modalità di consegna primaria non sia `webhook`.

## Esempi CLI

<Tabs>
  <Tab title="Promemoria una tantum">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Processo isolato ricorrente">
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
  <Tab title="Override di modello e thinking">
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

Il Gateway può esporre endpoint Webhook HTTP per trigger esterni. Abilitali nella configurazione:

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

Ogni richiesta deve includere il token del hook tramite header:

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
      `now` oppure `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Esegue un turno agente isolato:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Campi: `message` (obbligatorio), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hook mappati (POST /hooks/<name>)">
    I nomi di hook personalizzati vengono risolti tramite `hooks.mappings` nella configurazione. Le mappature possono trasformare payload arbitrari in azioni `wake` o `agent` con template o trasformazioni di codice.
  </Accordion>
</AccordionGroup>

<Warning>
Mantieni gli endpoint hook dietro local loopback, tailnet o un reverse proxy attendibile.

- Usa un token hook dedicato; non riutilizzare i token di autenticazione del gateway.
- Mantieni `hooks.path` su un sottopercorso dedicato; `/` viene rifiutato.
- Imposta `hooks.allowedAgentIds` per limitare il routing esplicito `agentId`.
- Mantieni `hooks.allowRequestSessionKey=false` a meno che tu non richieda sessioni selezionate dal chiamante.
- Se abiliti `hooks.allowRequestSessionKey`, imposta anche `hooks.allowedSessionKeyPrefixes` per vincolare le forme consentite della chiave di sessione.
- I payload hook sono racchiusi in limiti di sicurezza per impostazione predefinita.
</Warning>

## Integrazione Gmail PubSub

Collega i trigger della posta in arrivo di Gmail a OpenClaw tramite Google PubSub.

<Note>
**Prerequisiti:** CLI `gcloud`, `gog` (gogcli), hook OpenClaw abilitati, Tailscale per l'endpoint HTTPS pubblico.
</Note>

### Configurazione guidata (consigliata)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Questo scrive la configurazione `hooks.gmail`, abilita il preset Gmail e usa Tailscale Funnel per l'endpoint push.

### Avvio automatico del Gateway

Quando `hooks.enabled=true` e `hooks.gmail.account` è impostato, il Gateway avvia `gog gmail watch serve` all'avvio e rinnova automaticamente il watch. Imposta `OPENCLAW_SKIP_GMAIL_WATCHER=1` per non partecipare.

### Configurazione manuale una tantum

<Steps>
  <Step title="Seleziona il progetto GCP">
    Seleziona il progetto GCP proprietario del client OAuth usato da `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Crea il topic e concedi a Gmail l'accesso push">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Avvia il watch">
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

## Gestione dei processi

```bash
# Elenca tutti i processi
openclaw cron list

# Mostra un processo, incluso il percorso di consegna risolto
openclaw cron show <jobId>

# Modifica un processo
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Forza l'esecuzione immediata di un processo
openclaw cron run <jobId>

# Esegui solo se è dovuto
openclaw cron run <jobId> --due

# Visualizza la cronologia delle esecuzioni
openclaw cron runs --id <jobId> --limit 50

# Elimina un processo
openclaw cron remove <jobId>

# Selezione dell'agente (configurazioni multi-agente)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Nota sull'override del modello:

- `openclaw cron add|edit --model ...` modifica il modello selezionato del processo.
- Se il modello è consentito, quel preciso provider/modello raggiunge l'esecuzione dell'agente isolato.
- Se non è consentito, cron avvisa e torna alla selezione del modello agente/predefinito del processo.
- Le catene di fallback configurate continuano comunque ad applicarsi, ma un semplice override `--model` senza un elenco di fallback esplicito per processo non ricade più nel modello primario dell'agente come destinazione di retry extra silenziosa.
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

Il file sidecar dello stato runtime deriva da `cron.store`: un archivio `.json` come `~/clawd/cron/jobs.json` usa `~/clawd/cron/jobs-state.json`, mentre un percorso di archivio senza suffisso `.json` aggiunge `-state.json`.

Disabilita cron: `cron.enabled: false` oppure `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamento dei retry">
    **Retry una tantum**: gli errori transitori (limite di velocità, sovraccarico, rete, errore server) ritentano fino a 3 volte con backoff esponenziale. Gli errori permanenti vengono disabilitati immediatamente.

    **Retry ricorrente**: backoff esponenziale (da 30s a 60m) tra i retry. Il backoff si reimposta dopo l'esecuzione successiva andata a buon fine.

  </Accordion>
  <Accordion title="Manutenzione">
    `cron.sessionRetention` (predefinito `24h`) elimina le voci della sessione di esecuzione isolata. `cron.runLog.maxBytes` / `cron.runLog.keepLines` eliminano automaticamente i file di log delle esecuzioni.
  </Accordion>
</AccordionGroup>

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

<AccordionGroup>
  <Accordion title="Cron non si attiva">
    - Controlla `cron.enabled` e la variabile d'ambiente `OPENCLAW_SKIP_CRON`.
    - Verifica che il Gateway sia in esecuzione continua.
    - Per le pianificazioni `cron`, verifica il fuso orario (`--tz`) rispetto al fuso orario dell'host.
    - `reason: not-due` nell'output dell'esecuzione significa che l'esecuzione manuale è stata verificata con `openclaw cron run <jobId> --due` e che il processo non era ancora dovuto.
  </Accordion>
  <Accordion title="Cron si è attivato ma non c'è stata consegna">
    - La modalità di consegna `none` significa che non è previsto alcun invio fallback del runner. L'agente può comunque inviare direttamente con lo strumento `message` quando è disponibile un percorso chat.
    - Destinazione di consegna mancante/non valida (`channel`/`to`) significa che l'invio in uscita è stato saltato.
    - Per Matrix, i processi copiati o legacy con ID stanza `delivery.to` in minuscolo possono fallire perché gli ID stanza Matrix fanno distinzione tra maiuscole e minuscole. Modifica il processo con il valore esatto `!room:server` o `room:!room:server` di Matrix.
    - Gli errori di autenticazione del canale (`unauthorized`, `Forbidden`) significano che la consegna è stata bloccata dalle credenziali.
    - Se l'esecuzione isolata restituisce solo il token silenzioso (`NO_REPLY` / `no_reply`), OpenClaw sopprime la consegna diretta in uscita e sopprime anche il percorso fallback del riepilogo in coda, quindi nulla viene ripubblicato nella chat.
    - Se l'agente deve inviare un messaggio all'utente in autonomia, verifica che il processo abbia un percorso utilizzabile (`channel: "last"` con una chat precedente, oppure un canale/destinazione esplicito).
  </Accordion>
  <Accordion title="Cron o Heartbeat sembrano impedire il rollover in stile /new">
    - La freschezza del reset giornaliero e per inattività non si basa su `updatedAt`; vedi [Gestione delle sessioni](/it/concepts/session#session-lifecycle).
    - Le riattivazioni cron, le esecuzioni Heartbeat, le notifiche exec e la contabilità del gateway possono aggiornare la riga della sessione per routing/stato, ma non estendono `sessionStartedAt` o `lastInteractionAt`.
    - Per le righe legacy create prima che quei campi esistessero, OpenClaw può recuperare `sessionStartedAt` dall'intestazione della sessione transcript JSONL quando il file è ancora disponibile. Le righe di inattività legacy senza `lastInteractionAt` usano quel tempo di avvio recuperato come baseline di inattività.
  </Accordion>
  <Accordion title="Problemi comuni di fuso orario">
    - Cron senza `--tz` usa il fuso orario dell'host gateway.
    - Le pianificazioni `at` senza fuso orario vengono trattate come UTC.
    - `activeHours` di Heartbeat usa la risoluzione del fuso orario configurata.
  </Accordion>
</AccordionGroup>

## Correlati

- [Automazione e attività](/it/automation) — panoramica di tutti i meccanismi di automazione
- [Attività in background](/it/automation/tasks) — registro delle attività per le esecuzioni cron
- [Heartbeat](/it/gateway/heartbeat) — turni periodici della sessione principale
- [Fuso orario](/it/concepts/timezone) — configurazione del fuso orario
