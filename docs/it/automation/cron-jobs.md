---
read_when:
    - Pianificazione di processi in background o riattivazioni
    - Collegamento di trigger esterni (webhook, Gmail) a OpenClaw
    - Decidere tra heartbeat e cron per le attività pianificate
summary: Processi pianificati, webhook e trigger Gmail PubSub per lo scheduler del Gateway
title: Attività pianificate
x-i18n:
    generated_at: "2026-04-12T08:07:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: f42bcaeedd0595d025728d7f236a724a0ebc67b6813c57233f4d739b3088317f
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Attività pianificate (Cron)

Cron è lo scheduler integrato del Gateway. Mantiene persistenti i processi, riattiva l'agente al momento giusto e può inviare l'output a un canale chat o a un endpoint webhook.

## Avvio rapido

```bash
# Aggiungi un promemoria una tantum
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Controlla i tuoi processi
openclaw cron list

# Visualizza la cronologia delle esecuzioni
openclaw cron runs --id <job-id>
```

## Come funziona cron

- Cron viene eseguito **all'interno del processo Gateway** (non all'interno del modello).
- I processi vengono mantenuti persistenti in `~/.openclaw/cron/jobs.json`, quindi i riavvii non fanno perdere le pianificazioni.
- Tutte le esecuzioni cron creano record di [attività in background](/it/automation/tasks).
- I processi una tantum (`--at`) vengono eliminati automaticamente dopo il successo per impostazione predefinita.
- Le esecuzioni cron isolate chiudono, nel limite del possibile, le schede/processi del browser tracciati per la loro sessione `cron:<jobId>` al termine dell'esecuzione, così l'automazione del browser scollegata non lascia processi orfani.
- Le esecuzioni cron isolate proteggono anche dalle risposte di conferma obsolete. Se il
  primo risultato è solo un aggiornamento di stato provvisorio (`on it`, `pulling everything
together` e indicazioni simili) e nessuna esecuzione di un sottoagente discendente è ancora
  responsabile della risposta finale, OpenClaw invia di nuovo il prompt una volta per ottenere il risultato
  effettivo prima della consegna.

<a id="maintenance"></a>

La riconciliazione delle attività per cron è gestita dal runtime: un'attività cron attiva rimane attiva finché il
runtime cron continua a tracciare quel processo come in esecuzione, anche se esiste ancora una vecchia riga di sessione figlia.
Una volta che il runtime smette di possedere il processo e la finestra di tolleranza di 5 minuti scade, la manutenzione può
contrassegnare l'attività come `lost`.

## Tipi di pianificazione

| Tipo    | Flag CLI  | Descrizione                                                   |
| ------- | --------- | ------------------------------------------------------------- |
| `at`    | `--at`    | Timestamp una tantum (ISO 8601 o relativo come `20m`)         |
| `every` | `--every` | Intervallo fisso                                              |
| `cron`  | `--cron`  | Espressione cron a 5 o 6 campi con `--tz` facoltativo        |

I timestamp senza fuso orario vengono trattati come UTC. Aggiungi `--tz America/New_York` per una pianificazione in ora locale.

Le espressioni ricorrenti all'inizio dell'ora vengono automaticamente sfalsate fino a 5 minuti per ridurre i picchi di carico. Usa `--exact` per forzare una temporizzazione precisa oppure `--stagger 30s` per una finestra esplicita.

### Giorno del mese e giorno della settimana usano la logica OR

Le espressioni cron vengono analizzate da [croner](https://github.com/Hexagon/croner). Quando sia i campi giorno del mese sia giorno della settimana non sono jolly, croner trova una corrispondenza quando **uno dei due** campi corrisponde, non entrambi. Questo è il comportamento standard di Vixie cron.

```
# Previsto: "9:00 del 15, solo se è lunedì"
# Reale:    "9:00 di ogni 15, E 9:00 di ogni lunedì"
0 9 15 * 1
```

Questo viene eseguito ~5–6 volte al mese invece di 0–1 volte al mese. OpenClaw usa qui il comportamento OR predefinito di Croner. Per richiedere entrambe le condizioni, usa il modificatore giorno della settimana `+` di Croner (`0 9 15 * +1`) oppure pianifica su un solo campo e verifica l'altro nel prompt o nel comando del tuo processo.

## Stili di esecuzione

| Stile           | Valore `--session`   | Esecuzione in             | Ideale per                     |
| --------------- | -------------------- | ------------------------- | ------------------------------ |
| Sessione main   | `main`               | Turno heartbeat successivo | Promemoria, eventi di sistema |
| Isolata         | `isolated`           | `cron:<jobId>` dedicato   | Report, attività in background |
| Sessione corrente | `current`          | Associata al momento della creazione | Lavoro ricorrente consapevole del contesto |
| Sessione personalizzata | `session:custom-id` | Sessione nominata persistente | Flussi di lavoro che si basano sulla cronologia |

I processi in **sessione main** accodano un evento di sistema e facoltativamente riattivano l'heartbeat (`--wake now` o `--wake next-heartbeat`). I processi **isolati** eseguono un turno agente dedicato con una sessione nuova. Le **sessioni personalizzate** (`session:xxx`) mantengono il contesto tra le esecuzioni, consentendo flussi di lavoro come standup giornalieri che si basano sui riepiloghi precedenti.

Per i processi isolati, lo smantellamento del runtime ora include, nel limite del possibile, la pulizia del browser per quella sessione cron. Gli errori di pulizia vengono ignorati, così il risultato cron effettivo resta prioritario.

Quando le esecuzioni cron isolate orchestrano sottoagenti, la consegna preferisce anche l'output finale
discendente rispetto al testo provvisorio obsoleto del genitore. Se i discendenti sono ancora in
esecuzione, OpenClaw sopprime quell'aggiornamento parziale del genitore invece di annunciarlo.

### Opzioni di payload per i processi isolati

- `--message`: testo del prompt (obbligatorio per l'isolato)
- `--model` / `--thinking`: override del modello e del livello di thinking
- `--light-context`: salta l'iniezione del file bootstrap dello spazio di lavoro
- `--tools exec,read`: limita quali strumenti può usare il processo

`--model` usa il modello consentito selezionato per quel processo. Se il modello richiesto
non è consentito, cron registra un avviso e torna invece alla selezione del modello
agente/predefinito del processo. Le catene di fallback configurate continuano ad applicarsi, ma un semplice
override del modello senza un elenco esplicito di fallback per processo non aggiunge più il primario
dell'agente come destinazione nascosta extra di ritentativo.

La precedenza di selezione del modello per i processi isolati è:

1. Override del modello dell'hook Gmail (quando l'esecuzione proviene da Gmail e quell'override è consentito)
2. `model` del payload per processo
3. Override del modello della sessione cron memorizzata
4. Selezione del modello agente/predefinito

Anche la modalità rapida segue la selezione live risolta. Se la configurazione del modello selezionato
ha `params.fastMode`, il cron isolato la usa per impostazione predefinita. Un override `fastMode`
di sessione memorizzato ha comunque la precedenza sulla configurazione in entrambe le direzioni.

Se un'esecuzione isolata incontra un passaggio live di cambio modello, cron ritenta con il
provider/modello cambiato e mantiene quella selezione live prima del ritentativo. Quando
il cambio comporta anche un nuovo profilo di autenticazione, cron mantiene anche l'override
di quel profilo di autenticazione. I ritentativi sono limitati: dopo il tentativo iniziale più 2
ritentativi di cambio, cron interrompe invece di entrare in un ciclo infinito.

## Consegna e output

| Modalità   | Cosa succede                                                |
| ---------- | ----------------------------------------------------------- |
| `announce` | Consegna il riepilogo al canale di destinazione (predefinito per l'isolato) |
| `webhook`  | Esegue un POST del payload dell'evento completato a un URL  |
| `none`     | Solo interno, nessuna consegna                              |

Usa `--announce --channel telegram --to "-1001234567890"` per la consegna al canale. Per gli argomenti del forum Telegram, usa `-1001234567890:topic:123`. Le destinazioni Slack/Discord/Mattermost devono usare prefissi espliciti (`channel:<id>`, `user:<id>`).

Per i processi isolati di proprietà di cron, il runner gestisce il percorso di consegna finale. All'agente
viene richiesto di restituire un riepilogo in testo semplice, e quel riepilogo viene poi inviato
tramite `announce`, `webhook` o mantenuto interno per `none`. `--no-deliver`
non restituisce la consegna all'agente; mantiene l'esecuzione interna.

Se l'attività originale indica esplicitamente di inviare un messaggio a qualche destinatario esterno,
l'agente deve indicare nel proprio output a chi/dove dovrebbe andare quel messaggio invece di
provare a inviarlo direttamente.

Le notifiche di errore seguono un percorso di destinazione separato:

- `cron.failureDestination` imposta un valore predefinito globale per le notifiche di errore.
- `job.delivery.failureDestination` lo sovrascrive per singolo processo.
- Se nessuno dei due è impostato e il processo consegna già tramite `announce`, le notifiche di errore ora usano come fallback quella destinazione announce primaria.
- `delivery.failureDestination` è supportato solo sui processi `sessionTarget="isolated"` a meno che la modalità di consegna primaria non sia `webhook`.

## Esempi CLI

Promemoria una tantum (sessione main):

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

Processo isolato con override di modello e thinking:

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

Ogni richiesta deve includere il token dell'hook tramite header:

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
- `mode` (facoltativo): `now` (predefinito) o `next-heartbeat`

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

- Mantieni gli endpoint hook dietro loopback, tailnet o un reverse proxy attendibile.
- Usa un token hook dedicato; non riutilizzare i token di autenticazione del gateway.
- Mantieni `hooks.path` su un sottopercorso dedicato; `/` viene rifiutato.
- Imposta `hooks.allowedAgentIds` per limitare l'instradamento esplicito di `agentId`.
- Mantieni `hooks.allowRequestSessionKey=false` a meno che tu non richieda sessioni selezionate dal chiamante.
- Se abiliti `hooks.allowRequestSessionKey`, imposta anche `hooks.allowedSessionKeyPrefixes` per vincolare le forme consentite delle chiavi di sessione.
- I payload hook sono racchiusi in confini di sicurezza per impostazione predefinita.

## Integrazione Gmail PubSub

Collega i trigger della posta in arrivo di Gmail a OpenClaw tramite Google PubSub.

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
# Elenca tutti i processi
openclaw cron list

# Modifica un processo
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Forza l'esecuzione immediata di un processo
openclaw cron run <jobId>

# Esegui solo se è il momento previsto
openclaw cron run <jobId> --due

# Visualizza la cronologia delle esecuzioni
openclaw cron runs --id <jobId> --limit 50

# Elimina un processo
openclaw cron remove <jobId>

# Selezione dell'agente (configurazioni multi-agente)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Nota sull'override del modello:

- `openclaw cron add|edit --model ...` modifica il modello selezionato del processo.
- Se il modello è consentito, quell'esatto provider/modello viene passato all'esecuzione dell'agente isolato.
- Se non è consentito, cron registra un avviso e torna alla selezione del modello agente/predefinito del processo.
- Le catene di fallback configurate continuano ad applicarsi, ma un semplice override `--model` senza un elenco esplicito di fallback per processo non ripiega più sul primario dell'agente come destinazione aggiuntiva silenziosa di ritentativo.

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

Disabilita cron: `cron.enabled: false` o `OPENCLAW_SKIP_CRON=1`.

**Ritentativo una tantum**: gli errori transitori (limite di frequenza, sovraccarico, rete, errore del server) vengono ritentati fino a 3 volte con backoff esponenziale. Gli errori permanenti disabilitano immediatamente.

**Ritentativo ricorrente**: backoff esponenziale (da 30s a 60m) tra i ritentativi. Il backoff si azzera dopo l'esecuzione successiva andata a buon fine.

**Manutenzione**: `cron.sessionRetention` (predefinito `24h`) elimina le voci della sessione di esecuzione isolata. `cron.runLog.maxBytes` / `cron.runLog.keepLines` eliminano automaticamente le righe dei file di log delle esecuzioni.

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

### Cron non si avvia

- Controlla `cron.enabled` e la variabile d'ambiente `OPENCLAW_SKIP_CRON`.
- Conferma che il Gateway sia in esecuzione continua.
- Per le pianificazioni `cron`, verifica il fuso orario (`--tz`) rispetto al fuso orario dell'host.
- `reason: not-due` nell'output dell'esecuzione significa che l'esecuzione manuale è stata verificata con `openclaw cron run <jobId> --due` e che il processo non era ancora previsto.

### Cron è partito ma non c'è consegna

- La modalità di consegna `none` significa che non è previsto alcun messaggio esterno.
- Destinazione di consegna mancante/non valida (`channel`/`to`) significa che l'invio in uscita è stato saltato.
- Gli errori di autenticazione del canale (`unauthorized`, `Forbidden`) significano che la consegna è stata bloccata dalle credenziali.
- Se l'esecuzione isolata restituisce solo il token silenzioso (`NO_REPLY` / `no_reply`), OpenClaw sopprime la consegna diretta in uscita e sopprime anche il percorso di fallback del riepilogo in coda, quindi non viene pubblicato nulla di nuovo in chat.
- Per i processi isolati di proprietà di cron, non aspettarti che l'agente usi lo strumento message come fallback. Il runner gestisce la consegna finale; `--no-deliver` la mantiene interna invece di consentire un invio diretto.

### Problemi comuni con il fuso orario

- Cron senza `--tz` usa il fuso orario dell'host del gateway.
- Le pianificazioni `at` senza fuso orario vengono trattate come UTC.
- `activeHours` di heartbeat usa la risoluzione del fuso orario configurata.

## Correlati

- [Automazione e attività](/it/automation) — tutti i meccanismi di automazione in sintesi
- [Attività in background](/it/automation/tasks) — registro delle attività per le esecuzioni cron
- [Heartbeat](/it/gateway/heartbeat) — turni periodici della sessione main
- [Fuso orario](/it/concepts/timezone) — configurazione del fuso orario
