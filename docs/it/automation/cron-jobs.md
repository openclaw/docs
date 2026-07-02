---
read_when:
    - Pianificazione di job in background o risvegli
    - Collegare trigger esterni (Webhook, Gmail) a OpenClaw
    - Decidere tra Heartbeat e Cron per le attività pianificate
sidebarTitle: Scheduled tasks
summary: Job pianificati, webhook e trigger Gmail PubSub per lo scheduler del Gateway
title: Attività pianificate
x-i18n:
    generated_at: "2026-07-02T08:23:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron è lo scheduler integrato del Gateway. Mantiene i job, riattiva l'agente al momento giusto e può recapitare l'output a un canale chat o a un endpoint webhook.

## Avvio rapido

<Steps>
  <Step title="Aggiungi un promemoria una tantum">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Controlla i tuoi job">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Vedi la cronologia delle esecuzioni">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Come funziona cron

- Cron viene eseguito **dentro il processo Gateway** (non dentro il modello).
- Le definizioni dei job, lo stato di runtime e la cronologia delle esecuzioni persistono nel database di stato SQLite condiviso di OpenClaw, quindi i riavvii non fanno perdere le pianificazioni.
- Durante l'aggiornamento, esegui `openclaw doctor --fix` per importare i file legacy `~/.openclaw/cron/jobs.json`, `jobs-state.json` e `runs/*.jsonl` in SQLite e rinominarli con un suffisso `.migrated`. Le righe di job non valide vengono ignorate dal runtime e copiate in `jobs-quarantine.json` per una riparazione o revisione successiva.
- `cron.store` continua a indicare la chiave logica dell'archivio cron e il percorso di importazione di doctor. Dopo l'importazione, modificare quel file JSON non cambia più i job cron attivi; usa invece `openclaw cron add|edit|remove` o i metodi RPC cron del Gateway.
- Tutte le esecuzioni cron creano record di [attività in background](/it/automation/tasks).
- All'avvio del Gateway, i job di turno agente isolato scaduti vengono ripianificati fuori dalla finestra di connessione del canale invece di essere rieseguiti immediatamente, così l'avvio di Discord/Telegram e la configurazione dei comandi nativi restano reattivi dopo i riavvii.
- I job una tantum (`--at`) si eliminano automaticamente dopo il successo per impostazione predefinita.
- Le esecuzioni cron isolate chiudono con best-effort le schede/processi del browser tracciati per la loro sessione `cron:<jobId>` al completamento dell'esecuzione, così l'automazione browser scollegata non lascia processi orfani.
- Le esecuzioni cron isolate che ricevono la concessione ristretta di autopulizia cron possono comunque leggere lo stato dello scheduler, un elenco autof filtrato del proprio job corrente e la cronologia delle esecuzioni di quel job, così i controlli di stato/heartbeat possono ispezionare la propria pianificazione senza ottenere un accesso più ampio alla mutazione di cron.
- Le esecuzioni cron isolate proteggono anche da risposte di conferma obsolete. Se il primo risultato è solo un aggiornamento di stato provvisorio (`on it`, `pulling everything together` e suggerimenti simili) e nessuna esecuzione di subagente discendente è ancora responsabile della risposta finale, OpenClaw sollecita di nuovo una volta il risultato effettivo prima della consegna.
- Le esecuzioni cron isolate usano metadati strutturati di negazione dell'esecuzione dall'esecuzione incorporata, inclusi wrapper node-host `UNAVAILABLE` il cui messaggio di errore annidato inizia con `SYSTEM_RUN_DENIED` o `INVALID_REQUEST`, così un comando bloccato non viene segnalato come esecuzione riuscita mentre la normale prosa dell'assistente non viene trattata come negazione.
- Le esecuzioni cron isolate trattano anche i fallimenti dell'agente a livello di esecuzione come errori del job anche quando non viene prodotto alcun payload di risposta, così i fallimenti di modello/provider incrementano i contatori di errore e attivano notifiche di fallimento invece di segnare il job come riuscito.
- Quando un job di turno agente isolato raggiunge `timeoutSeconds`, cron interrompe l'esecuzione dell'agente sottostante e le concede una breve finestra di pulizia. Se l'esecuzione non si svuota, la pulizia gestita dal Gateway forza la rimozione della proprietà della sessione di quell'esecuzione prima che cron registri il timeout, così il lavoro chat in coda non resta dietro una sessione di elaborazione obsoleta.
- Se un turno agente isolato si blocca prima dell'avvio del runner o prima della prima chiamata al modello, cron registra un timeout specifico della fase, come `setup timed out before runner start` o `stalled before first model call (last phase: context-engine)`. Questi watchdog coprono provider incorporati e provider basati su CLI prima che il loro processo CLI esterno venga effettivamente avviato, e sono limitati indipendentemente dai valori lunghi di `timeoutSeconds`, così i fallimenti di cold start/autenticazione/contesto emergono rapidamente invece di attendere l'intero budget del job.
- Se usi cron di sistema o un altro scheduler esterno per eseguire `openclaw agent`, avvolgilo con un'escalation di terminazione forzata anche se la CLI gestisce `SIGTERM`/`SIGINT`. Le esecuzioni basate su Gateway chiedono al Gateway di interrompere le esecuzioni accettate; le esecuzioni locali e fallback incorporate ricevono lo stesso segnale di interruzione. Per GNU `timeout`, preferisci `timeout -k 60 600 openclaw agent ...` rispetto a un semplice `timeout 600 ...`; il valore `-k` è il backstop del supervisore se il processo non riesce a svuotarsi. Per le unità systemd, mantieni la stessa forma usando un segnale di arresto `SIGTERM` più una finestra di grazia come `TimeoutStopSec` prima di qualsiasi terminazione finale. Se un nuovo tentativo riusa un `--run-id` mentre l'esecuzione Gateway originale è ancora attiva, il duplicato viene segnalato come in corso invece di avviare una seconda esecuzione.

<a id="maintenance"></a>

<Note>
La riconciliazione delle attività per cron è prima di proprietà del runtime e poi supportata dalla cronologia durevole: un'attività cron attiva resta live mentre il runtime cron traccia ancora quel job come in esecuzione, anche se esiste ancora una vecchia riga di sessione figlia. Quando il runtime smette di possedere il job e la finestra di grazia di 5 minuti scade, la manutenzione controlla i log di esecuzione persistiti e lo stato del job per l'esecuzione corrispondente `cron:<jobId>:<startedAt>`. Se quella cronologia durevole mostra un risultato terminale, il registro attività viene finalizzato da essa; altrimenti la manutenzione gestita dal Gateway può contrassegnare l'attività come `lost`. L'audit CLI offline può recuperare dalla cronologia durevole, ma non tratta il proprio insieme vuoto di job attivi in-process come prova che un'esecuzione cron gestita dal Gateway sia scomparsa.
</Note>

## Tipi di pianificazione

| Tipo    | Flag CLI  | Descrizione                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Timestamp una tantum (ISO 8601 o relativo come `20m`)    |
| `every` | `--every` | Intervallo fisso                                          |
| `cron`  | `--cron`  | Espressione cron a 5 o 6 campi con `--tz` opzionale |

I timestamp senza fuso orario vengono trattati come UTC. Aggiungi `--tz America/New_York` per la pianificazione con orario locale.

Le espressioni ricorrenti all'inizio dell'ora vengono automaticamente sfalsate fino a 5 minuti per ridurre i picchi di carico. Usa `--exact` per forzare un timing preciso o `--stagger 30s` per una finestra esplicita.

### Giorno del mese e giorno della settimana usano la logica OR

Le espressioni Cron vengono analizzate da [croner](https://github.com/Hexagon/croner). Quando sia il campo giorno del mese sia il campo giorno della settimana non sono wildcard, croner corrisponde quando **uno dei due** campi corrisponde, non entrambi. Questo è il comportamento standard di Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Questo si attiva circa 5-6 volte al mese invece di 0-1 volte al mese. OpenClaw usa qui il comportamento OR predefinito di Croner. Per richiedere entrambe le condizioni, usa il modificatore del giorno della settimana `+` di Croner (`0 9 15 * +1`) oppure pianifica su un campo e proteggi l'altro nel prompt o comando del tuo job.

## Stili di esecuzione

| Stile           | Valore `--session`   | Esegue in                  | Ideale per                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Sessione principale    | `main`              | Corsia di riattivazione cron dedicata | Promemoria, eventi di sistema        |
| Isolato        | `isolated`          | `cron:<jobId>` dedicato | Report, attività in background      |
| Sessione corrente | `current`           | Vincolata al momento della creazione   | Lavoro ricorrente consapevole del contesto    |
| Sessione personalizzata  | `session:custom-id` | Sessione nominata persistente | Workflow che si basano sulla cronologia |

<AccordionGroup>
  <Accordion title="Sessione principale, isolata e personalizzata">
    I job della **sessione principale** accodano un evento di sistema in una corsia di esecuzione di proprietà di cron e, facoltativamente, riattivano l'heartbeat (`--wake now` o `--wake next-heartbeat`). Possono usare l'ultimo contesto di consegna della sessione principale di destinazione per le risposte, ma non aggiungono turni cron di routine alla corsia della chat umana e non estendono la freschezza del reset giornaliero/inattivo per la sessione di destinazione. I job **isolati** eseguono un turno agente dedicato con una sessione nuova. Le **sessioni personalizzate** (`session:xxx`) mantengono il contesto tra le esecuzioni, abilitando workflow come gli standup giornalieri che si basano sui riepiloghi precedenti.

    Gli eventi cron della sessione principale sono promemoria di eventi di sistema autonomi. Non
    includono automaticamente l'istruzione "Read
    HEARTBEAT.md" del prompt Heartbeat predefinito. Se un promemoria ricorrente deve consultare
    `HEARTBEAT.md`, indicalo esplicitamente nel testo dell'evento cron o nelle
    istruzioni dell'agente.

  </Accordion>
  <Accordion title="Cosa significa 'sessione nuova' per i job isolati">
    Per i job isolati, "sessione nuova" significa un nuovo id di trascrizione/sessione per ogni esecuzione. OpenClaw può trasferire preferenze sicure come impostazioni thinking/fast/verbose, etichette e override espliciti di modello/autenticazione selezionati dall'utente, ma non eredita il contesto conversazionale ambientale da una riga cron precedente: routing di canale/gruppo, criterio di invio o accodamento, elevazione, origine o binding runtime ACP. Usa `current` o `session:<id>` quando un job ricorrente deve basarsi intenzionalmente sullo stesso contesto conversazionale.
  </Accordion>
  <Accordion title="Pulizia del runtime">
    Per i job isolati, il teardown del runtime ora include la pulizia best-effort del browser per quella sessione cron. I fallimenti di pulizia vengono ignorati, così il risultato cron effettivo continua a prevalere.

    Le esecuzioni cron isolate smaltiscono anche eventuali istanze runtime MCP in bundle create per il job tramite il percorso condiviso di pulizia del runtime. Questo corrisponde al modo in cui i client MCP di sessione principale e sessione personalizzata vengono smontati, così i job cron isolati non lasciano trapelare processi figlio stdio o connessioni MCP longeve tra le esecuzioni.

  </Accordion>
  <Accordion title="Subagente e consegna Discord">
    Quando le esecuzioni cron isolate orchestrano subagenti, la consegna preferisce anche l'output finale discendente rispetto al testo provvisorio obsoleto del genitore. Se i discendenti sono ancora in esecuzione, OpenClaw sopprime quell'aggiornamento parziale del genitore invece di annunciarlo.

    Per destinazioni di annuncio Discord solo testo, OpenClaw invia una volta il testo canonico finale dell'assistente invece di riprodurre sia i payload di testo in streaming/intermedi sia la risposta finale. I payload multimediali e strutturati Discord vengono comunque consegnati come payload separati, così allegati e componenti non vengono scartati.

  </Accordion>
</AccordionGroup>

### Payload di comando

Usa i payload di comando per script deterministici che devono essere eseguiti dentro lo scheduler del Gateway senza avviare un turno agente isolato basato su modello. I job di comando vengono eseguiti sull'host Gateway, catturano stdout/stderr, registrano l'esecuzione nella cronologia cron e riusano le stesse modalità di consegna `announce`, `webhook` e `none` dei job isolati.

<Note>
Il Cron di comando è una superficie di automazione Gateway da operatore-admin, non una chiamata
`tools.exec` dell'agente. Creare, aggiornare, rimuovere o eseguire manualmente job cron
richiede `operator.admin`; le esecuzioni di comando pianificate successivamente vengono eseguite dentro il
processo Gateway come automazione creata da quell'admin. Il criterio exec dell'agente come
`tools.exec.mode`, i prompt di approvazione e le allowlist di strumenti per agente governano
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

`--command <shell>` archivia `argv: ["sh", "-lc", <shell>]`. Usa `--command-argv '["node","scripts/report.mjs"]'` quando vuoi un'esecuzione argv esatta senza parsing della shell. I campi opzionali `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` e `--output-max-bytes` controllano l'ambiente del processo, stdin e i limiti dell'output.

Se stdout non è vuoto, quel testo è il risultato consegnato. Se stdout è vuoto e stderr non è vuoto, viene consegnato stderr. Se sono presenti entrambi gli stream, cron consegna un piccolo blocco `stdout:` / `stderr:`. Un codice di uscita zero registra l'esecuzione come `ok`; un'uscita non zero, un segnale, un timeout o un timeout senza output registra `error` e può attivare avvisi di errore. Un comando che stampa solo `NO_REPLY` usa la normale soppressione del token silenzioso di cron e non pubblica nulla nella chat.

### Opzioni del payload per job isolati

<ParamField path="--message" type="string" required>
  Testo del prompt (obbligatorio per la modalità isolata).
</ParamField>
<ParamField path="--model" type="string">
  Override del modello; usa il modello consentito selezionato per il job.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Elenco dei modelli di fallback per job, per esempio `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Passa `--fallbacks ""` per un'esecuzione rigorosa senza fallback.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  In `cron edit`, rimuove l'override dei fallback per job in modo che il job segua la precedenza dei fallback configurata. Non può essere combinato con `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  In `cron edit`, rimuove l'override del modello per job in modo che il job segua la normale precedenza di selezione del modello di cron (un override memorizzato della sessione cron, se impostato, altrimenti il modello dell'agente/predefinito). Non può essere combinato con `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Override del livello di ragionamento.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  In `cron edit`, rimuove l'override del ragionamento per job in modo che il job segua la normale precedenza del ragionamento di cron. Non può essere combinato con `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Salta l'iniezione dei file di bootstrap dell'area di lavoro.
</ParamField>
<ParamField path="--tools" type="string">
  Limita gli strumenti che il job può usare, per esempio `--tools exec,read`.
</ParamField>

`--model` usa il modello consentito selezionato come modello primario del job. Non equivale a un override `/model` della sessione di chat: le catene di fallback configurate continuano ad applicarsi quando il modello primario del job fallisce. Se il modello richiesto non è consentito o non può essere risolto, cron fa fallire l'esecuzione con un errore di validazione esplicito invece di ripiegare silenziosamente sulla selezione del modello dell'agente/predefinito del job.

I job Cron possono anche includere `fallbacks` a livello di payload. Quando presente, quell'elenco sostituisce la catena di fallback configurata per il job. Usa `fallbacks: []` nel payload/API del job quando vuoi un'esecuzione cron rigorosa che provi solo il modello selezionato. Se un job ha `--model` ma non ha fallback né nel payload né configurati, OpenClaw passa un override di fallback vuoto esplicito in modo che il modello primario dell'agente non venga aggiunto come destinazione di nuovo tentativo nascosta.

I controlli preliminari dei provider locali attraversano i fallback configurati prima di contrassegnare un'esecuzione cron come `skipped`; `fallbacks: []` mantiene rigoroso quel percorso preliminare.

La precedenza di selezione del modello per i job isolati è:

1. Override del modello dell'hook Gmail (quando l'esecuzione proviene da Gmail e quell'override è consentito)
2. `model` del payload per job
3. Override memorizzato del modello della sessione cron selezionato dall'utente
4. Selezione del modello dell'agente/predefinito

Anche la modalità veloce segue la selezione live risolta. Se la configurazione del modello selezionato ha `params.fastMode`, il cron isolato la usa per impostazione predefinita. Un override `fastMode` della sessione memorizzata prevale comunque sulla configurazione in entrambe le direzioni. La modalità automatica usa la soglia `params.fastAutoOnSeconds` del modello selezionato quando presente, con valore predefinito di 60 secondi.

Se un'esecuzione isolata incontra un passaggio di consegna con cambio di modello live, cron ritenta con il provider/modello cambiato e persiste quella selezione live per l'esecuzione attiva prima di ritentare. Quando il cambio include anche un nuovo profilo di autenticazione, cron persiste anche quell'override del profilo di autenticazione per l'esecuzione attiva. I tentativi sono limitati: dopo il tentativo iniziale più 2 nuovi tentativi di cambio, cron interrompe invece di entrare in un ciclo infinito.

Prima che un'esecuzione cron isolata entri nel runner dell'agente, OpenClaw controlla gli endpoint dei provider locali raggiungibili per i provider configurati `api: "ollama"` e `api: "openai-completions"` il cui `baseUrl` è loopback, rete privata o `.local`. Se quell'endpoint non è attivo, l'esecuzione viene registrata come `skipped` con un errore chiaro di provider/modello invece di avviare una chiamata al modello. Il risultato dell'endpoint viene memorizzato nella cache per 5 minuti, quindi molti job in scadenza che usano lo stesso server locale Ollama, vLLM, SGLang o LM Studio non disponibile condividono una piccola sonda invece di creare una tempesta di richieste. Le esecuzioni saltate dal controllo preliminare del provider non incrementano il backoff degli errori di esecuzione; abilita `failureAlert.includeSkipped` quando vuoi notifiche ripetute per i salti.

## Consegna e output

| Modalità   | Cosa succede                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Consegna con fallback il testo finale alla destinazione se l'agente non ha inviato |
| `webhook`  | Invia tramite POST il payload dell'evento completato a un URL       |
| `none`     | Nessuna consegna di fallback del runner                             |

Usa `--announce --channel telegram --to "-1001234567890"` per la consegna al canale. Per gli argomenti dei forum Telegram, usa `-1001234567890:topic:123`; OpenClaw accetta anche l'abbreviazione di proprietà Telegram `-1001234567890:123`. I chiamanti RPC/config diretti possono passare `delivery.threadId` come stringa o numero. Le destinazioni Slack/Discord/Mattermost devono usare prefissi espliciti (`channel:<id>`, `user:<id>`). Gli ID delle stanze Matrix distinguono maiuscole e minuscole; usa l'ID esatto della stanza o la forma `room:!room:server` da Matrix.

Quando la consegna announce usa `channel: "last"` o omette `channel`, una destinazione con prefisso del provider come `telegram:123` può selezionare il canale prima che cron ripieghi sulla cronologia della sessione o su un singolo canale configurato. Solo i prefissi pubblicizzati dal Plugin caricato sono selettori di provider. Se `delivery.channel` è esplicito, il prefisso della destinazione deve nominare lo stesso provider; per esempio, `channel: "whatsapp"` con `to: "telegram:123"` viene rifiutato invece di lasciare che WhatsApp interpreti l'ID Telegram come numero di telefono. I prefissi del tipo di destinazione e del servizio come `channel:<id>`, `user:<id>`, `imessage:<handle>` e `sms:<number>` restano sintassi di destinazione di proprietà del canale, non selettori di provider.

Per i job isolati, la consegna chat è condivisa. Se è disponibile una route chat, l'agente può usare lo strumento `message` anche quando il job usa `--no-deliver`. Se l'agente invia alla destinazione configurata/corrente, OpenClaw salta l'announce di fallback. Altrimenti `announce`, `webhook` e `none` controllano solo cosa fa il runner con la risposta finale dopo il turno dell'agente.

Quando un agente crea un promemoria isolato da una chat attiva, OpenClaw memorizza la destinazione di consegna live preservata per la route announce di fallback. Le chiavi interne di sessione possono essere minuscole; le destinazioni di consegna del provider non vengono ricostruite da quelle chiavi quando è disponibile il contesto della chat corrente.

La consegna announce implicita usa gli allowlist dei canali configurati per validare e reinstradare destinazioni obsolete. Le approvazioni dell'archivio di associazione DM non sono destinatari dell'automazione di fallback; imposta `delivery.to` o configura la voce `allowFrom` del canale quando un job pianificato deve inviare proattivamente a un DM.

## Lingua dell'output

I job Cron non deducono una lingua di risposta dal canale, dalle impostazioni locali o dai messaggi precedenti. Inserisci la regola della lingua nel messaggio o nel template pianificato:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Per i file template, mantieni l'istruzione sulla lingua nel prompt renderizzato e verifica che i segnaposto come `{{language}}` siano compilati prima dell'esecuzione del job. Se l'output mescola lingue, rendi esplicita la regola, per esempio: "Usa il cinese per il testo narrativo e mantieni i termini tecnici in inglese."

Le notifiche di errore seguono un percorso di destinazione separato:

- `cron.failureDestination` imposta un valore predefinito globale per le notifiche di errore.
- `job.delivery.failureDestination` lo sovrascrive per job.
- Se nessuno dei due è impostato e il job consegna già tramite `announce`, le notifiche di errore ora ripiegano su quella destinazione announce primaria.
- `delivery.failureDestination` è supportato solo sui job `sessionTarget="isolated"` a meno che la modalità di consegna primaria sia `webhook`.
- `failureAlert.includeSkipped: true` abilita per un job o per la policy di avviso cron globale gli avvisi ripetuti per le esecuzioni saltate. Le esecuzioni saltate mantengono un contatore separato di salti consecutivi, quindi non influiscono sul backoff degli errori di esecuzione.

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
  <Tab title="Webhook output">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Command output">
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
    Esegui un turno di agente isolato:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Campi: `message` (obbligatorio), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    I nomi di hook personalizzati vengono risolti tramite `hooks.mappings` nella configurazione. Le mappature possono trasformare payload arbitrari in azioni `wake` o `agent` con template o trasformazioni di codice.
  </Accordion>
</AccordionGroup>

<Warning>
Mantieni gli endpoint degli hook dietro loopback, tailnet o un proxy inverso attendibile.

- Usa un token hook dedicato; non riutilizzare i token di autenticazione del gateway.
- Mantieni `hooks.path` su un sottopercorso dedicato; `/` viene rifiutato.
- Imposta `hooks.allowedAgentIds` per limitare quale agente effettivo può essere raggiunto da un hook, incluso l'agente predefinito quando `agentId` viene omesso.
- Mantieni `hooks.allowRequestSessionKey=false` a meno che non siano necessarie sessioni selezionate dal chiamante.
- Se abiliti `hooks.allowRequestSessionKey`, imposta anche `hooks.allowedSessionKeyPrefixes` per vincolare le forme consentite delle chiavi di sessione.
- I payload degli hook sono avvolti per impostazione predefinita con limiti di sicurezza.

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

Quando `hooks.enabled=true` e `hooks.gmail.account` è impostato, il Gateway avvia `gog gmail watch serve` al boot e rinnova automaticamente il watch. Imposta `OPENCLAW_SKIP_GMAIL_WATCHER=1` per disattivarlo.

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
  <Step title="Crea l'argomento e concedi l'accesso push a Gmail">
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

`openclaw cron run <jobId>` restituisce il controllo dopo aver messo in coda l'esecuzione manuale. Usa `--wait` per hook di spegnimento, script di manutenzione o altre automazioni che devono restare bloccate finché l'esecuzione in coda non termina. La modalità di attesa interroga esattamente il `runId` restituito; esce con `0` per lo stato `ok` e con un valore diverso da zero per `error`, `skipped` o timeout di attesa.

Lo strumento `cron` dell'agente restituisce riepiloghi compatti dei job (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) da `cron(action: "list")`; usa `cron(action: "get", jobId: "...")` per una definizione completa di un singolo job. I chiamanti diretti del Gateway possono passare `compact: true` a `cron.list`; ometterlo preserva la risposta completa esistente con anteprime della consegna.

`openclaw cron create` è un alias di `openclaw cron add` e i nuovi job possono usare una pianificazione posizionale (`"0 9 * * 1"`, `"every 1h"`, `"20m"` o un timestamp ISO) seguita da un prompt agente posizionale. Usa `--webhook <url>` su `cron add|create` o `cron edit` per inviare con POST il payload dell'esecuzione terminata a un endpoint HTTP. La consegna Webhook non può essere combinata con flag di consegna chat come `--announce`, `--channel`, `--to`, `--thread-id` o `--account`. Su `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` e `--clear-account` rimuovono individualmente quei campi di routing (ciascuno viene rifiutato insieme al flag di impostazione corrispondente), cosa distinta da `--no-deliver`, che disabilita la consegna fallback del runner.

<Note>
Nota sull'override del modello:

- `openclaw cron add|edit --model ...` cambia il modello selezionato del job.
- Se il modello è consentito, quell'esatto provider/modello raggiunge l'esecuzione isolata dell'agente.
- Se non è consentito o non può essere risolto, cron fa fallire l'esecuzione con un errore di validazione esplicito.
- Le patch del payload API `cron.update` possono impostare `model: null` per cancellare un override del modello memorizzato per il job.
- `openclaw cron edit <job-id> --clear-model` cancella quell'override dalla CLI (stesso effetto della patch `model: null`) e non può essere combinato con `--model`.
- Le catene di fallback configurate continuano ad applicarsi perché `--model` di cron è un valore primario del job, non un override `/model` della sessione.
- `openclaw cron add|edit --fallbacks ...` imposta il payload `fallbacks`, sostituendo i fallback configurati per quel job; `--fallbacks ""` disabilita il fallback e rende l'esecuzione rigida. `openclaw cron edit <job-id> --clear-fallbacks` cancella l'override per job.
- Un semplice `--model` senza una lista di fallback esplicita o configurata non passa al valore primario dell'agente come destinazione aggiuntiva silenziosa per un nuovo tentativo.

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

`maxConcurrentRuns` limita sia il dispatch cron pianificato sia l'esecuzione isolata dei turni agente, e il valore predefinito è 8. I turni agente cron isolati usano internamente la corsia di esecuzione dedicata `cron-nested` della coda, quindi aumentare questo valore consente alle esecuzioni LLM cron indipendenti di avanzare in parallelo invece di avviare solo i rispettivi wrapper cron esterni. La corsia condivisa non cron `nested` non viene ampliata da questa impostazione.

`cron.store` è una chiave di archivio logica e un percorso di importazione doctor legacy. Esegui `openclaw doctor --fix` per importare gli archivi JSON esistenti in SQLite e archiviarli; le future modifiche a cron dovrebbero passare dalla CLI o dall'API Gateway.

Disabilitare cron: `cron.enabled: false` o `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Comportamento dei tentativi">
    **Tentativo one-shot**: gli errori transitori (limite di velocità, sovraccarico, rete, errore server) vengono ritentati fino a 3 volte con backoff esponenziale. Gli errori permanenti disabilitano immediatamente.

    **Tentativo ricorrente**: backoff esponenziale (da 30s a 60m) tra i tentativi. Il backoff viene azzerato dopo la successiva esecuzione riuscita.

  </Accordion>
  <Accordion title="Manutenzione">
    `cron.sessionRetention` (predefinito `24h`) elimina le voci delle sessioni di esecuzione isolate. `cron.runLog.keepLines` limita le righe della cronologia esecuzioni SQLite conservate per job; `maxBytes` viene mantenuto per compatibilità di configurazione con i log di esecuzione precedenti basati su file.
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
  <Accordion title="Cron non parte">
    - Controlla la variabile env `cron.enabled` e `OPENCLAW_SKIP_CRON`.
    - Conferma che il Gateway sia in esecuzione continua.
    - Per le pianificazioni `cron`, verifica il fuso orario (`--tz`) rispetto al fuso orario dell'host.
    - `reason: not-due` nell'output dell'esecuzione significa che l'esecuzione manuale è stata controllata con `openclaw cron run <jobId> --due` e il job non era ancora dovuto.

  </Accordion>
  <Accordion title="Cron è partito ma non c'è consegna">
    - La modalità di consegna `none` significa che non è previsto alcun invio fallback del runner. L'agente può comunque inviare direttamente con lo strumento `message` quando è disponibile una route chat.
    - Target di consegna mancante/non valido (`channel`/`to`) significa che l'invio in uscita è stato saltato.
    - Per Matrix, i job copiati o legacy con ID stanza `delivery.to` in minuscolo possono fallire perché gli ID stanza Matrix fanno distinzione tra maiuscole e minuscole. Modifica il job usando il valore esatto `!room:server` o `room:!room:server` da Matrix.
    - Gli errori di autenticazione del canale (`unauthorized`, `Forbidden`) significano che la consegna è stata bloccata dalle credenziali.
    - Se l'esecuzione isolata restituisce solo il token silenzioso (`NO_REPLY` / `no_reply`), OpenClaw sopprime la consegna diretta in uscita e sopprime anche il percorso di riepilogo fallback in coda, quindi non viene pubblicato nulla nella chat.
    - Se l'agente deve inviare un messaggio all'utente autonomamente, controlla che il job abbia una route utilizzabile (`channel: "last"` con una chat precedente, oppure un canale/target esplicito).

  </Accordion>
  <Accordion title="Cron o heartbeat sembra impedire il rollover in stile /new">
    - La freschezza del reset giornaliero e per inattività non si basa su `updatedAt`; vedi [Gestione sessioni](/it/concepts/session#session-lifecycle).
    - I risvegli cron, le esecuzioni heartbeat, le notifiche exec e la contabilità del gateway possono aggiornare la riga della sessione per routing/stato, ma non estendono `sessionStartedAt` o `lastInteractionAt`.
    - Per le righe legacy create prima che quei campi esistessero, OpenClaw può recuperare `sessionStartedAt` dall'intestazione sessione del transcript JSONL quando il file è ancora disponibile. Le righe legacy inattive senza `lastInteractionAt` usano quell'orario di inizio recuperato come baseline di inattività.

  </Accordion>
  <Accordion title="Insidie dei fusi orari">
    - Cron senza `--tz` usa il fuso orario dell'host gateway.
    - Le pianificazioni `at` senza fuso orario sono trattate come UTC.
    - `activeHours` di Heartbeat usa la risoluzione del fuso orario configurata.

  </Accordion>
</AccordionGroup>

## Correlati

- [Automazione](/it/automation) — tutti i meccanismi di automazione in sintesi
- [Attività in background](/it/automation/tasks) — registro attività per le esecuzioni cron
- [Heartbeat](/it/gateway/heartbeat) — turni periodici della sessione principale
- [Fuso orario](/it/concepts/timezone) — configurazione del fuso orario
