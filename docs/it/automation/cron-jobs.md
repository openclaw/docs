---
read_when:
    - Pianificazione di processi in background o riattivazioni
    - Collegare trigger esterni (Webhook, Gmail) a OpenClaw
    - Decidere tra Heartbeat e Cron per le attività pianificate
sidebarTitle: Scheduled tasks
summary: Job pianificati, Webhook e trigger Gmail PubSub per lo scheduler del Gateway
title: Attività pianificate
x-i18n:
    generated_at: "2026-06-27T17:09:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97097c9809afea699caa0c60d2ab5b71cd3794f90d9e002d35d25e76ca40d63c
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron è lo scheduler integrato del Gateway. Mantiene i job, risveglia l'agente al momento giusto e può consegnare l'output a un canale chat o a un endpoint Webhook.

## Avvio rapido

<Steps>
  <Step title="Add a one-shot reminder">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Come funziona cron

- Cron viene eseguito **all'interno del processo Gateway** (non all'interno del modello).
- Le definizioni dei job, lo stato di runtime e la cronologia delle esecuzioni vengono mantenuti nel database di stato SQLite condiviso di OpenClaw, quindi i riavvii non fanno perdere le pianificazioni.
- Durante l'aggiornamento, esegui `openclaw doctor --fix` per importare i file legacy `~/.openclaw/cron/jobs.json`, `jobs-state.json` e `runs/*.jsonl` in SQLite e rinominarli con un suffisso `.migrated`. Le righe di job malformate vengono saltate dal runtime e copiate in `jobs-quarantine.json` per una riparazione o revisione successiva.
- `cron.store` continua a indicare la chiave logica dell'archivio cron e il percorso di importazione di doctor. Dopo l'importazione, modificare quel file JSON non cambia più i job cron attivi; usa invece `openclaw cron add|edit|remove` o i metodi RPC cron del Gateway.
- Tutte le esecuzioni cron creano record di [attività in background](/it/automation/tasks).
- All'avvio del Gateway, i job agent-turn isolati in ritardo vengono ripianificati fuori dalla finestra di connessione del canale invece di essere riprodotti immediatamente, così l'avvio di Discord/Telegram e la configurazione dei comandi nativi restano reattivi dopo i riavvii.
- I job una tantum (`--at`) si eliminano automaticamente dopo il successo per impostazione predefinita.
- Le esecuzioni cron isolate chiudono con massimo impegno schede/processi del browser tracciati per la loro sessione `cron:<jobId>` al completamento dell'esecuzione, così l'automazione browser scollegata non lascia processi orfani.
- Le esecuzioni cron isolate che ricevono la concessione ristretta di autopulizia cron possono comunque leggere lo stato dello scheduler, un elenco filtrato su se stesse del loro job corrente e la cronologia delle esecuzioni di quel job, così i controlli di stato/Heartbeat possono ispezionare la propria pianificazione senza ottenere un accesso più ampio alla mutazione di cron.
- Le esecuzioni cron isolate proteggono anche da risposte di conferma obsolete. Se il primo risultato è solo un aggiornamento di stato provvisorio (`on it`, `pulling everything together` e suggerimenti simili) e nessuna esecuzione di subagent discendente è ancora responsabile della risposta finale, OpenClaw ripropone una sola volta la richiesta per ottenere il risultato effettivo prima della consegna.
- Le esecuzioni cron isolate usano metadati strutturati di negazione dell'esecuzione dall'esecuzione incorporata, inclusi wrapper node-host `UNAVAILABLE` il cui messaggio di errore annidato inizia con `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`, così un comando bloccato non viene segnalato come esecuzione riuscita mentre la normale prosa dell'assistente non viene trattata come una negazione.
- Le esecuzioni cron isolate trattano anche i fallimenti dell'agente a livello di esecuzione come errori del job anche quando non viene prodotto alcun payload di risposta, così i fallimenti del modello/provider incrementano i contatori di errore e attivano notifiche di fallimento invece di contrassegnare il job come riuscito.
- Quando un job agent-turn isolato raggiunge `timeoutSeconds`, cron interrompe l'esecuzione dell'agente sottostante e gli concede una breve finestra di pulizia. Se l'esecuzione non si svuota, la pulizia di proprietà del Gateway rimuove forzatamente la proprietà della sessione di quell'esecuzione prima che cron registri il timeout, così il lavoro chat in coda non resta bloccato dietro una sessione di elaborazione obsoleta.
- Se un agent-turn isolato si blocca prima dell'avvio del runner o prima della prima chiamata al modello, cron registra un timeout specifico della fase, come `setup timed out before runner start` o `stalled before first model call (last phase: context-engine)`. Questi watchdog coprono i provider incorporati e i provider basati su CLI prima che il loro processo CLI esterno venga effettivamente avviato, e sono limitati indipendentemente dai valori lunghi di `timeoutSeconds` così i fallimenti di avvio a freddo/auth/contesto emergono rapidamente invece di attendere l'intero budget del job.
- Se usi il cron di sistema o un altro scheduler esterno per eseguire `openclaw agent`, avvolgilo con un'escalation di terminazione forzata anche se la CLI gestisce `SIGTERM`/`SIGINT`. Le esecuzioni basate su Gateway chiedono al Gateway di interrompere le esecuzioni accettate; le esecuzioni locali e di fallback incorporate ricevono lo stesso segnale di interruzione. Per GNU `timeout`, preferisci `timeout -k 60 600 openclaw agent ...` rispetto a un semplice `timeout 600 ...`; il valore `-k` è il backstop del supervisore se il processo non riesce a svuotarsi. Per le unità systemd, mantieni la stessa forma usando un segnale di arresto `SIGTERM` più una finestra di tolleranza come `TimeoutStopSec` prima di qualsiasi terminazione finale. Se un nuovo tentativo riusa un `--run-id` mentre l'esecuzione Gateway originale è ancora attiva, il duplicato viene segnalato come in corso invece di avviare una seconda esecuzione.

<a id="maintenance"></a>

<Note>
La riconciliazione delle attività per cron è prima di proprietà del runtime e poi supportata dalla cronologia durevole: un'attività cron attiva resta live mentre il runtime cron traccia ancora quel job come in esecuzione, anche se esiste ancora una vecchia riga di sessione figlia. Quando il runtime smette di possedere il job e la finestra di tolleranza di 5 minuti scade, la manutenzione controlla i log di esecuzione mantenuti e lo stato del job per l'esecuzione corrispondente `cron:<jobId>:<startedAt>`. Se quella cronologia durevole mostra un risultato terminale, il registro delle attività viene finalizzato da lì; altrimenti la manutenzione di proprietà del Gateway può contrassegnare l'attività come `lost`. L'audit CLI offline può recuperare dalla cronologia durevole, ma non tratta il proprio insieme vuoto di job attivi in-process come prova che un'esecuzione cron di proprietà del Gateway sia scomparsa.
</Note>

## Tipi di pianificazione

| Tipo    | Flag CLI  | Descrizione                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Timestamp una tantum (ISO 8601 o relativo come `20m`)    |
| `every` | `--every` | Intervallo fisso                                          |
| `cron`  | `--cron`  | Espressione cron a 5 o 6 campi con `--tz` opzionale |

I timestamp senza fuso orario vengono trattati come UTC. Aggiungi `--tz America/New_York` per la pianificazione con ora locale.

Le espressioni ricorrenti all'inizio dell'ora vengono distribuite automaticamente fino a 5 minuti per ridurre i picchi di carico. Usa `--exact` per forzare una tempistica precisa o `--stagger 30s` per una finestra esplicita.

### Giorno del mese e giorno della settimana usano la logica OR

Le espressioni Cron vengono analizzate da [croner](https://github.com/Hexagon/croner). Quando sia il campo del giorno del mese sia quello del giorno della settimana non sono wildcard, croner corrisponde quando **uno dei due** campi corrisponde, non entrambi. Questo è il comportamento cron standard di Vixie.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Questo si attiva circa 5-6 volte al mese invece di 0-1 volte al mese. OpenClaw usa qui il comportamento OR predefinito di Croner. Per richiedere entrambe le condizioni, usa il modificatore del giorno della settimana `+` di Croner (`0 9 15 * +1`) oppure pianifica su un campo e controlla l'altro nel prompt o comando del tuo job.

## Stili di esecuzione

| Stile           | Valore `--session`   | Esegue in                  | Ideale per                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sessione principale    | `main`              | Corsia di risveglio cron dedicata | Promemoria, eventi di sistema        |
| Isolato        | `isolated`          | `cron:<jobId>` dedicata | Report, attività in background      |
| Sessione corrente | `current`           | Vincolata al momento della creazione   | Lavoro ricorrente consapevole del contesto    |
| Sessione personalizzata  | `session:custom-id` | Sessione denominata persistente | Workflow che si basano sulla cronologia |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    I job della **sessione principale** mettono in coda un evento di sistema in una corsia di esecuzione di proprietà di cron e, facoltativamente, risvegliano l'Heartbeat (`--wake now` o `--wake next-heartbeat`). Possono usare l'ultimo contesto di consegna della sessione principale di destinazione per le risposte, ma non aggiungono turni cron di routine alla corsia chat umana e non estendono la freschezza del reset giornaliero/inattivo per la sessione di destinazione. I job **isolati** eseguono un agent turn dedicato con una sessione nuova. Le **sessioni personalizzate** (`session:xxx`) mantengono il contesto tra le esecuzioni, abilitando workflow come standup giornalieri che si basano sui riepiloghi precedenti.

    Gli eventi cron della sessione principale sono promemoria di eventi di sistema autonomi. Non includono
    automaticamente l'istruzione "Read
    HEARTBEAT.md" del prompt Heartbeat predefinito. Se un promemoria ricorrente deve consultare
    `HEARTBEAT.md`, indicalo esplicitamente nel testo dell'evento cron o nelle
    istruzioni proprie dell'agente.

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Per i job isolati, "sessione nuova" significa un nuovo id di transcript/sessione per ogni esecuzione. OpenClaw può portare preferenze sicure come impostazioni thinking/fast/verbose, etichette e override espliciti di modello/auth selezionati dall'utente, ma non eredita il contesto di conversazione ambientale da una riga cron precedente: routing di canale/gruppo, policy di invio o coda, elevazione, origine o binding del runtime ACP. Usa `current` o `session:<id>` quando un job ricorrente deve intenzionalmente basarsi sullo stesso contesto di conversazione.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Per i job isolati, lo smantellamento del runtime ora include la pulizia del browser con massimo impegno per quella sessione cron. I fallimenti di pulizia vengono ignorati, così il risultato cron effettivo resta prevalente.

    Le esecuzioni cron isolate eliminano anche eventuali istanze runtime MCP incluse create per il job tramite il percorso condiviso di pulizia del runtime. Questo corrisponde al modo in cui vengono smantellati i client MCP della sessione principale e della sessione personalizzata, quindi i job cron isolati non lasciano trapelare processi figli stdio o connessioni MCP longeve tra le esecuzioni.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Quando le esecuzioni cron isolate orchestrano subagent, anche la consegna preferisce l'output finale del discendente rispetto al testo provvisorio obsoleto del genitore. Se i discendenti sono ancora in esecuzione, OpenClaw sopprime quell'aggiornamento parziale del genitore invece di annunciarlo.

    Per destinazioni di annuncio Discord solo testo, OpenClaw invia una sola volta il testo finale canonico dell'assistente invece di riprodurre sia i payload di testo in streaming/intermedi sia la risposta finale. I payload Discord multimediali e strutturati vengono comunque consegnati come payload separati, così allegati e componenti non vengono scartati.

  </Accordion>
</AccordionGroup>

### Payload di comando

Usa i payload di comando per script deterministici che devono essere eseguiti all'interno dello scheduler Gateway senza avviare un agent turn isolato basato su modello. I job di comando vengono eseguiti sull'host Gateway, catturano stdout/stderr, registrano l'esecuzione nella cronologia cron e riutilizzano le stesse modalità di consegna `announce`, `webhook` e `none` dei job isolati.

<Note>
Il cron di comando è una superficie di automazione Gateway per operatori-amministratori, non una chiamata
`tools.exec` dell'agente. Creare, aggiornare, rimuovere o eseguire manualmente job cron
richiede `operator.admin`; le esecuzioni di comando pianificate vengono poi eseguite all'interno del
processo Gateway come automazione creata da quell'amministratore. La policy exec dell'agente, come
`tools.exec.mode`, i prompt di approvazione e gli allowlist degli strumenti per agente governano
gli strumenti exec visibili al modello, non i payload cron di comando.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` memorizza `argv: ["sh", "-lc", <shell>]`. Usa `--command-argv '["node","scripts/report.mjs"]'` quando vuoi un'esecuzione argv esatta senza parsing della shell. I campi opzionali `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` e `--output-max-bytes` controllano l'ambiente del processo, stdin e i limiti dell'output.

Se stdout non è vuoto, quel testo è il risultato consegnato. Se stdout è vuoto e stderr non è vuoto, viene consegnato stderr. Se entrambi gli stream sono presenti, cron consegna un piccolo blocco `stdout:` / `stderr:`. Un codice di uscita zero registra l'esecuzione come `ok`; uscita non zero, segnale, timeout o timeout senza output registrano `error` e possono attivare avvisi di errore. Un comando che stampa solo `NO_REPLY` usa la normale soppressione del token silenzioso di cron e non pubblica nulla in chat.

### Opzioni del payload per job isolati

<ParamField path="--message" type="string" required>
  Testo del prompt (obbligatorio per isolated).
</ParamField>
<ParamField path="--model" type="string">
  Override del modello; usa il modello consentito selezionato per il job.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Elenco dei modelli di fallback per job, ad esempio `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Passa `--fallbacks ""` per un'esecuzione rigorosa senza fallback.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Su `cron edit`, rimuove l'override di fallback per job in modo che il job segua la precedenza di fallback configurata. Non può essere combinato con `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Su `cron edit`, rimuove l'override del modello per job in modo che il job segua la normale precedenza di selezione del modello di cron (un override di cron-session memorizzato, se impostato, altrimenti il modello dell'agente/predefinito). Non può essere combinato con `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Override del livello di ragionamento.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Salta l'iniezione del file di bootstrap del workspace.
</ParamField>
<ParamField path="--tools" type="string">
  Limita gli strumenti che il job può usare, ad esempio `--tools exec,read`.
</ParamField>

`--model` usa il modello consentito selezionato come modello primario di quel job. Non è la stessa cosa di un override `/model` della sessione di chat: le catene di fallback configurate si applicano comunque quando il primario del job fallisce. Se il modello richiesto non è consentito o non può essere risolto, cron fa fallire l'esecuzione con un errore di convalida esplicito invece di ripiegare silenziosamente sulla selezione del modello dell'agente/predefinito del job.

I job Cron possono anche includere `fallbacks` a livello di payload. Quando presente, quell'elenco sostituisce la catena di fallback configurata per il job. Usa `fallbacks: []` nel payload/API del job quando vuoi un'esecuzione cron rigorosa che provi solo il modello selezionato. Se un job ha `--model` ma non ha fallback né nel payload né configurati, OpenClaw passa un override di fallback vuoto esplicito in modo che il primario dell'agente non venga aggiunto come destinazione di riprova nascosta.

I controlli preflight del provider locale percorrono i fallback configurati prima di contrassegnare un'esecuzione cron come `skipped`; `fallbacks: []` mantiene rigoroso quel percorso preflight.

La precedenza di selezione del modello per i job isolati è:

1. Override del modello dell'hook Gmail (quando l'esecuzione proviene da Gmail e quell'override è consentito)
2. `model` del payload per job
3. Override del modello della sessione cron memorizzato selezionato dall'utente
4. Selezione del modello dell'agente/predefinito

Anche la modalità veloce segue la selezione live risolta. Se la configurazione del modello selezionato ha `params.fastMode`, cron isolato lo usa per impostazione predefinita. Un override `fastMode` della sessione memorizzata prevale comunque sulla configurazione in entrambe le direzioni. La modalità automatica usa la soglia `params.fastAutoOnSeconds` del modello selezionato quando presente, con valore predefinito di 60 secondi.

Se un'esecuzione isolata incontra un handoff di cambio modello live, cron riprova con il provider/modello cambiato e persiste quella selezione live per l'esecuzione attiva prima di riprovare. Quando il cambio include anche un nuovo profilo di autenticazione, cron persiste anche quell'override del profilo di autenticazione per l'esecuzione attiva. I tentativi sono limitati: dopo il tentativo iniziale più 2 riprove di cambio, cron interrompe invece di entrare in un ciclo infinito.

Prima che un'esecuzione cron isolata entri nel runner dell'agente, OpenClaw controlla gli endpoint dei provider locali raggiungibili per i provider `api: "ollama"` e `api: "openai-completions"` configurati il cui `baseUrl` è loopback, rete privata o `.local`. Se quell'endpoint non è attivo, l'esecuzione viene registrata come `skipped` con un chiaro errore di provider/modello invece di avviare una chiamata al modello. Il risultato dell'endpoint viene memorizzato nella cache per 5 minuti, quindi molti job in scadenza che usano lo stesso server locale Ollama, vLLM, SGLang o LM Studio non funzionante condividono una piccola sonda invece di creare una tempesta di richieste. Le esecuzioni saltate dal preflight del provider non incrementano il backoff degli errori di esecuzione; abilita `failureAlert.includeSkipped` quando vuoi notifiche ripetute di salto.

## Consegna e output

| Modalità   | Cosa succede                                                       |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Consegna di fallback del testo finale alla destinazione se l'agente non lo ha inviato |
| `webhook`  | Invia con POST il payload dell'evento completato a un URL          |
| `none`     | Nessuna consegna di fallback del runner                            |

Usa `--announce --channel telegram --to "-1001234567890"` per la consegna al canale. Per gli argomenti dei forum Telegram, usa `-1001234567890:topic:123`; OpenClaw accetta anche la forma abbreviata di proprietà di Telegram `-1001234567890:123`. I chiamanti RPC/config diretti possono passare `delivery.threadId` come stringa o numero. Le destinazioni Slack/Discord/Mattermost dovrebbero usare prefissi espliciti (`channel:<id>`, `user:<id>`). Gli ID delle stanze Matrix distinguono maiuscole e minuscole; usa l'ID stanza esatto o la forma `room:!room:server` da Matrix.

Quando la consegna announce usa `channel: "last"` o omette `channel`, una destinazione con prefisso del provider come `telegram:123` può selezionare il canale prima che cron ripieghi sulla cronologia della sessione o su un singolo canale configurato. Solo i prefissi annunciati dal Plugin caricato sono selettori di provider. Se `delivery.channel` è esplicito, il prefisso della destinazione deve indicare lo stesso provider; ad esempio, `channel: "whatsapp"` con `to: "telegram:123"` viene rifiutato invece di lasciare che WhatsApp interpreti l'ID Telegram come numero di telefono. I prefissi del tipo di destinazione e del servizio come `channel:<id>`, `user:<id>`, `imessage:<handle>` e `sms:<number>` restano sintassi di destinazione di proprietà del canale, non selettori di provider.

Per i job isolati, la consegna in chat è condivisa. Se è disponibile una route di chat, l'agente può usare lo strumento `message` anche quando il job usa `--no-deliver`. Se l'agente invia alla destinazione configurata/corrente, OpenClaw salta l'announce di fallback. Altrimenti `announce`, `webhook` e `none` controllano solo cosa fa il runner con la risposta finale dopo il turno dell'agente.

Quando un agente crea un promemoria isolato da una chat attiva, OpenClaw memorizza la destinazione di consegna live preservata per la route announce di fallback. Le chiavi di sessione interne possono essere minuscole; le destinazioni di consegna del provider non vengono ricostruite da quelle chiavi quando il contesto di chat corrente è disponibile.

La consegna announce implicita usa allowlist dei canali configurate per convalidare e reindirizzare destinazioni obsolete. Le approvazioni dell'archivio di associazione DM non sono destinatari di automazione di fallback; imposta `delivery.to` o configura la voce `allowFrom` del canale quando un job pianificato deve inviare proattivamente a un DM.

## Lingua dell'output

I job Cron non deducono una lingua di risposta dal canale, dalle impostazioni locali o dai messaggi precedenti. Inserisci la regola della lingua nel messaggio o nel template pianificato:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Per i file template, mantieni l'istruzione della lingua nel prompt renderizzato e verifica che i placeholder come `{{language}}` siano compilati prima dell'esecuzione del job. Se l'output mescola lingue, rendi la regola esplicita, ad esempio: "Usa il cinese per il testo narrativo e mantieni i termini tecnici in inglese."

Le notifiche di errore seguono un percorso di destinazione separato:

- `cron.failureDestination` imposta un valore predefinito globale per le notifiche di errore.
- `job.delivery.failureDestination` lo sovrascrive per job.
- Se nessuno dei due è impostato e il job consegna già tramite `announce`, le notifiche di errore ora ripiegano su quella destinazione announce primaria.
- `delivery.failureDestination` è supportato solo su job `sessionTarget="isolated"` a meno che la modalità di consegna primaria sia `webhook`.
- `failureAlert.includeSkipped: true` abilita per un job o per la policy globale degli avvisi cron gli avvisi ripetuti per esecuzioni saltate. Le esecuzioni saltate mantengono un contatore consecutivo separato, quindi non influiscono sul backoff degli errori di esecuzione.

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
  <Tab title="Job isolato ricorrente">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Override del modello e del ragionamento">
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
  <Tab title="Output Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Output comando">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Webhook

Gateway può esporre endpoint Webhook HTTP per trigger esterni. Abilita nella configurazione:

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

I token nella stringa di query vengono rifiutati.

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
    Esegue un turno di agente isolato:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Campi: `message` (obbligatorio), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Hook mappati (POST /hooks/<name>)">
    I nomi di hook personalizzati vengono risolti tramite `hooks.mappings` nella configurazione. Le mappature possono trasformare payload arbitrari in azioni `wake` o `agent` con template o trasformazioni di codice.
  </Accordion>
</AccordionGroup>

<Warning>
Mantieni gli endpoint degli hook dietro loopback, tailnet o un reverse proxy attendibile.

- Usa un token hook dedicato; non riutilizzare i token di autenticazione del gateway.
- Mantieni `hooks.path` su un sottopercorso dedicato; `/` viene rifiutato.
- Imposta `hooks.allowedAgentIds` per limitare quale agente effettivo un hook può indirizzare, incluso l'agente predefinito quando `agentId` è omesso.
- Mantieni `hooks.allowRequestSessionKey=false` a meno che tu non richieda sessioni selezionate dal chiamante.
- Se abiliti `hooks.allowRequestSessionKey`, imposta anche `hooks.allowedSessionKeyPrefixes` per vincolare le forme consentite delle chiavi di sessione.
- I payload degli hook sono racchiusi con limiti di sicurezza per impostazione predefinita.

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

Quando `hooks.enabled=true` e `hooks.gmail.account` è impostato, il Gateway avvia `gog gmail watch serve` all'avvio e rinnova automaticamente il watch. Imposta `OPENCLAW_SKIP_GMAIL_WATCHER=1` per disattivarlo.

### Configurazione manuale una tantum

<Steps>
  <Step title="Select the GCP project">
    Seleziona il progetto GCP che possiede il client OAuth usato da `gog`:

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

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Force run a job now and wait for its terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# View one exact run
openclaw cron runs --id <jobId> --run-id <runId>

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` ritorna dopo aver accodato l'esecuzione manuale. Usa `--wait` per hook di arresto, script di manutenzione o altre automazioni che devono restare bloccate finché l'esecuzione in coda non termina. La modalità di attesa esegue il polling del `runId` esatto restituito; termina con `0` per lo stato `ok` e con un valore diverso da zero per `error`, `skipped` o un timeout di attesa.

Lo strumento agente `cron` restituisce riepiloghi compatti dei job (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) da `cron(action: "list")`; usa `cron(action: "get", jobId: "...")` per una definizione completa di un singolo job. I chiamanti diretti del Gateway possono passare `compact: true` a `cron.list`; ometterlo preserva la risposta completa esistente con anteprime di consegna.

`openclaw cron create` è un alias di `openclaw cron add` e i nuovi job possono usare una pianificazione posizionale (`"0 9 * * 1"`, `"every 1h"`, `"20m"` o un timestamp ISO) seguita da un prompt agente posizionale. Usa `--webhook <url>` su `cron add|create` o `cron edit` per inviare con POST il payload dell'esecuzione completata a un endpoint HTTP. La consegna Webhook non può essere combinata con flag di consegna chat come `--announce`, `--channel`, `--to`, `--thread-id` o `--account`. Su `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` e `--clear-account` annullano singolarmente quei campi di instradamento (ciascuno viene rifiutato insieme al flag di impostazione corrispondente), cosa distinta da `--no-deliver`, che disabilita la consegna di fallback del runner.

<Note>
Nota sull'override del modello:

- `openclaw cron add|edit --model ...` modifica il modello selezionato del job.
- Se il modello è consentito, quell'esatto provider/modello raggiunge l'esecuzione dell'agente isolato.
- Se non è consentito o non può essere risolto, Cron fa fallire l'esecuzione con un errore di validazione esplicito.
- Le patch del payload API `cron.update` possono impostare `model: null` per cancellare un override del modello memorizzato per il job.
- `openclaw cron edit <job-id> --clear-model` cancella quell'override dalla CLI (stesso effetto della patch `model: null`) e non può essere combinato con `--model`.
- Le catene di fallback configurate continuano ad applicarsi perché `--model` di Cron è un primario del job, non un override di sessione `/model`.
- `openclaw cron add|edit --fallbacks ...` imposta il payload `fallbacks`, sostituendo i fallback configurati per quel job; `--fallbacks ""` disabilita il fallback e rende l'esecuzione rigorosa. `openclaw cron edit <job-id> --clear-fallbacks` cancella l'override per job.
- Un semplice `--model` senza un elenco di fallback esplicito o configurato non ripiega sul primario dell'agente come destinazione di retry aggiuntiva silenziosa.

</Note>

## Configurazione

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
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

`maxConcurrentRuns` limita sia l'invio pianificato di Cron sia l'esecuzione isolata dei turni agente e il valore predefinito è 8. I turni agente Cron isolati usano internamente la corsia di esecuzione dedicata `cron-nested` della coda, quindi aumentare questo valore consente alle esecuzioni LLM Cron indipendenti di procedere in parallelo invece di avviare solo i relativi wrapper Cron esterni. La corsia condivisa non Cron `nested` non viene ampliata da questa impostazione.

`cron.store` è una chiave di archivio logica e un percorso di importazione doctor legacy. Esegui `openclaw doctor --fix` per importare gli archivi JSON esistenti in SQLite e archiviarli; le modifiche future a Cron dovrebbero passare dalla CLI o dall'API Gateway.

Disabilitare Cron: `cron.enabled: false` o `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Retry one-shot**: gli errori transitori (limite di frequenza, sovraccarico, rete, errore server) vengono ritentati fino a 3 volte con backoff esponenziale. Gli errori permanenti disabilitano immediatamente.

    **Retry ricorrente**: backoff esponenziale (da 30 s a 60 min) tra i retry. Il backoff si azzera dopo la successiva esecuzione riuscita.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (predefinito `24h`) elimina le voci delle sessioni di esecuzione isolate. `cron.runLog.keepLines` limita le righe della cronologia esecuzioni SQLite conservate per job; `maxBytes` viene mantenuto per compatibilità della configurazione con i log di esecuzione più vecchi basati su file.
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
  <Accordion title="Cron not firing">
    - Controlla `cron.enabled` e la variabile env `OPENCLAW_SKIP_CRON`.
    - Conferma che il Gateway sia in esecuzione continuativa.
    - Per le pianificazioni `cron`, verifica il fuso orario (`--tz`) rispetto al fuso orario dell'host.
    - `reason: not-due` nell'output dell'esecuzione significa che l'esecuzione manuale è stata controllata con `openclaw cron run <jobId> --due` e il job non era ancora in scadenza.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - La modalità di consegna `none` significa che non è previsto alcun invio di fallback del runner. L'agente può comunque inviare direttamente con lo strumento `message` quando è disponibile una route chat.
    - Destinazione di consegna mancante/non valida (`channel`/`to`) significa che l'uscita è stata saltata.
    - Per Matrix, i job copiati o legacy con ID stanza `delivery.to` in minuscolo possono fallire perché gli ID stanza Matrix distinguono maiuscole e minuscole. Modifica il job inserendo il valore esatto `!room:server` o `room:!room:server` da Matrix.
    - Gli errori di autenticazione del canale (`unauthorized`, `Forbidden`) indicano che la consegna è stata bloccata dalle credenziali.
    - Se l'esecuzione isolata restituisce solo il token silenzioso (`NO_REPLY` / `no_reply`), OpenClaw sopprime la consegna diretta in uscita e sopprime anche il percorso di riepilogo accodato di fallback, quindi non viene pubblicato nulla nella chat.
    - Se l'agente deve inviare un messaggio all'utente autonomamente, controlla che il job abbia una route utilizzabile (`channel: "last"` con una chat precedente, oppure un canale/target esplicito).

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - La freschezza del reset giornaliero e per inattività non si basa su `updatedAt`; vedi [Gestione sessioni](/it/concepts/session#session-lifecycle).
    - Risvegli Cron, esecuzioni Heartbeat, notifiche exec e contabilità del Gateway possono aggiornare la riga della sessione per instradamento/stato, ma non estendono `sessionStartedAt` o `lastInteractionAt`.
    - Per le righe legacy create prima dell'esistenza di quei campi, OpenClaw può recuperare `sessionStartedAt` dall'intestazione sessione del transcript JSONL quando il file è ancora disponibile. Le righe legacy inattive senza `lastInteractionAt` usano quell'ora di inizio recuperata come baseline di inattività.

  </Accordion>
  <Accordion title="Timezone gotchas">
    - Cron senza `--tz` usa il fuso orario dell'host Gateway.
    - Le pianificazioni `at` senza fuso orario vengono trattate come UTC.
    - `activeHours` di Heartbeat usa la risoluzione del fuso orario configurata.

  </Accordion>
</AccordionGroup>

## Correlati

- [Automazione](/it/automation) — tutti i meccanismi di automazione in sintesi
- [Attività in background](/it/automation/tasks) — registro delle attività per le esecuzioni Cron
- [Heartbeat](/it/gateway/heartbeat) — turni periodici della sessione principale
- [Fuso orario](/it/concepts/timezone) — configurazione del fuso orario
