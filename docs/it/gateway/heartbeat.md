---
read_when:
    - Regolazione della frequenza o dei messaggi dell'Heartbeat
    - Scegliere tra Heartbeat e Cron per le attività pianificate
sidebarTitle: Heartbeat
summary: Messaggi di polling Heartbeat e regole di notifica
title: Heartbeat
x-i18n:
    generated_at: "2026-07-12T07:02:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat o cron?** Consulta [Automazione](/it/automation) per indicazioni su quando usare ciascuno.
</Note>

Heartbeat esegue **turni periodici dell'agente** nella sessione principale, così il modello può segnalare qualsiasi elemento che richieda attenzione senza tempestarti di messaggi.

Heartbeat è un turno pianificato della sessione principale: **non** crea record di [attività in background](/it/automation/tasks). I record delle attività servono per il lavoro separato (esecuzioni ACP, sottoagenti, processi cron isolati).

Risoluzione dei problemi: [Attività pianificate](/it/automation/cron-jobs#troubleshooting)

## Avvio rapido (principianti)

<Steps>
  <Step title="Scegli una frequenza">
    Lascia abilitati gli Heartbeat (il valore predefinito è `30m`, oppure `1h` quando è configurata l'autenticazione OAuth/token di Anthropic, incluso il riutilizzo della CLI di Claude) oppure imposta una frequenza personalizzata.
  </Step>
  <Step title="Aggiungi HEARTBEAT.md (facoltativo)">
    Crea un piccolo elenco di controllo `HEARTBEAT.md` o un blocco `tasks:` nell'area di lavoro dell'agente.
  </Step>
  <Step title="Decidi dove inviare i messaggi di Heartbeat">
    `target: "none"` è il valore predefinito; imposta `target: "last"` per indirizzarli all'ultimo contatto.
  </Step>
  <Step title="Ottimizzazione facoltativa">
    - Abilita l'invio del ragionamento di Heartbeat per maggiore trasparenza.
    - Usa un contesto di inizializzazione leggero se le esecuzioni di Heartbeat richiedono solo `HEARTBEAT.md`.
    - Abilita le sessioni isolate per evitare di inviare l'intera cronologia della conversazione a ogni Heartbeat.
    - Limita gli Heartbeat alle ore di attività (ora locale).

  </Step>
</Steps>

Configurazione di esempio:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## Valori predefiniti

- Intervallo: `30m`. L'applicazione dei valori predefiniti del provider Anthropic lo porta a `1h` quando la modalità di autenticazione risolta è OAuth/token (incluso il riutilizzo della CLI di Claude), ma solo finché `heartbeat.every` non è impostato. Imposta `agents.defaults.heartbeat.every` o `agents.list[].heartbeat.every` per singolo agente; usa `0m` per disabilitarlo.
- Corpo del prompt (configurabile tramite `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Timeout: i turni di Heartbeat senza un valore impostato usano `agents.defaults.timeoutSeconds`, se configurato. Altrimenti usano la frequenza di Heartbeat, con un limite massimo di 600 secondi. Imposta `agents.defaults.heartbeat.timeoutSeconds` o `agents.list[].heartbeat.timeoutSeconds` per singolo agente per attività di Heartbeat più lunghe.
- Il prompt di Heartbeat viene inviato **testualmente** come messaggio dell'utente. Il prompt di sistema include una sezione "Heartbeats" solo quando gli Heartbeat sono abilitati per l'agente predefinito (e `includeSystemPromptSection` non è `false`), e l'esecuzione viene contrassegnata internamente.
- Quando gli Heartbeat sono disabilitati con `0m`, anche le normali esecuzioni omettono `HEARTBEAT.md` dal contesto di inizializzazione, in modo che il modello non veda istruzioni destinate esclusivamente agli Heartbeat.
- Le ore di attività (`heartbeat.activeHours`) vengono verificate nel fuso orario configurato. Al di fuori dell'intervallo, gli Heartbeat vengono ignorati fino al successivo ciclo all'interno dell'intervallo.
- Gli Heartbeat vengono rinviati automaticamente mentre un'attività cron è in esecuzione o in coda. Imposta `heartbeat.skipWhenBusy: true` per rinviare anche un agente quando sono occupati il suo sottoagente associato alla chiave di sessione o i flussi di comandi annidati; gli agenti di pari livello non vengono più sospesi solo perché un altro agente ha un'attività di sottoagente in corso.

## A cosa serve il prompt di Heartbeat

Il prompt predefinito è intenzionalmente generico:

- **Attività in background**: "Considera le attività in sospeso" invita l'agente a esaminare le operazioni successive (posta in arrivo, calendario, promemoria, attività in coda) e a segnalare qualsiasi elemento urgente.
- **Controllo con l'utente**: "Ogni tanto verifica come sta il tuo utente durante il giorno" invita a inviare occasionalmente un breve messaggio come "hai bisogno di qualcosa?", evitando però messaggi indesiderati di notte grazie al fuso orario locale configurato (consulta [Fuso orario](/it/concepts/timezone)).

Heartbeat può reagire alle [attività in background](/it/automation/tasks) completate, ma un'esecuzione di Heartbeat non crea di per sé un record di attività.

Se vuoi che un Heartbeat svolga un'azione molto specifica (ad esempio "controlla le statistiche PubSub di Gmail" o "verifica lo stato del Gateway"), imposta `agents.defaults.heartbeat.prompt` (o `agents.list[].heartbeat.prompt`) con un corpo personalizzato (inviato testualmente).

## Contratto della risposta

- Se nulla richiede attenzione, rispondi con **`HEARTBEAT_OK`**.
- Le esecuzioni di Heartbeat possono invece chiamare `heartbeat_respond` con `notify: false` per non mostrare alcun aggiornamento, oppure con `notify: true` e `notificationText` per un avviso. Quando presente, la risposta strutturata dello strumento ha la precedenza sul testo di ripiego.
- Durante le esecuzioni di Heartbeat, OpenClaw considera `HEARTBEAT_OK` una conferma quando compare all'**inizio o alla fine** della risposta. Il token viene rimosso e la risposta viene scartata se il contenuto rimanente è **≤ `ackMaxChars`** (valore predefinito: 300).
- Se `HEARTBEAT_OK` compare **nel mezzo** di una risposta, non riceve alcun trattamento speciale.
- Per gli avvisi, **non** includere `HEARTBEAT_OK`; restituisci solo il testo dell'avviso.

Al di fuori degli Heartbeat, un `HEARTBEAT_OK` estraneo all'inizio o alla fine di un messaggio viene rimosso e registrato; un messaggio che contiene solo `HEARTBEAT_OK` viene scartato.

## Configurazione

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Thinking message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        includeSystemPromptSection: true, // default: true; false omits the ## Heartbeats system prompt section for the default agent
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Ambito e precedenza

- `agents.defaults.heartbeat` imposta il comportamento globale di Heartbeat.
- `agents.list[].heartbeat` viene applicato sopra tale configurazione; se un agente contiene un blocco `heartbeat`, **solo quegli agenti** eseguono gli Heartbeat.
- `channels.defaults.heartbeat` imposta i valori predefiniti di visibilità per tutti i canali.
- `channels.<channel>.heartbeat` sostituisce i valori predefiniti del canale.
- `channels.<channel>.accounts.<id>.heartbeat` (canali con più account) sostituisce le impostazioni del singolo canale.

### Heartbeat per agente

Se una voce di `agents.list[]` include un blocco `heartbeat`, **solo quegli agenti** eseguono gli Heartbeat. Il blocco del singolo agente viene applicato sopra `agents.defaults.heartbeat` (così puoi impostare una sola volta i valori predefiniti condivisi e sostituirli per ciascun agente).

Esempio: due agenti, solo il secondo esegue gli Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Esempio di ore di attività

Limita gli Heartbeat all'orario lavorativo in un fuso orario specifico:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

Al di fuori di questo intervallo (prima delle 9:00 o dopo le 22:00, ora della costa orientale), gli Heartbeat vengono ignorati. Il successivo ciclo pianificato all'interno dell'intervallo verrà eseguito normalmente.

### Configurazione 24 ore su 24, 7 giorni su 7

Se vuoi eseguire gli Heartbeat per tutto il giorno, usa uno dei seguenti schemi:

- Ometti completamente `activeHours` (nessuna limitazione temporale; questo è il comportamento predefinito).
- Imposta un intervallo che copra l'intera giornata: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Non impostare la stessa ora per `start` ed `end` (ad esempio da `08:00` a `08:00`). Viene interpretato come un intervallo di ampiezza zero, pertanto gli Heartbeat vengono sempre ignorati.
</Warning>

### Esempio con più account

Usa `accountId` per scegliere un account specifico nei canali con più account, come Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Note sui campi

<ParamField path="every" type="string">
  Intervallo di Heartbeat (stringa di durata; unità predefinita = minuti).
</ParamField>
<ParamField path="model" type="string">
  Sostituzione facoltativa del modello per le esecuzioni di Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Quando è abilitato, invia anche il messaggio separato `Thinking`, se disponibile (stessa struttura di `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Quando è `true`, le esecuzioni di Heartbeat usano un contesto di inizializzazione leggero e mantengono solo `HEARTBEAT.md` tra i file di inizializzazione dell'area di lavoro.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Quando è `true`, ogni Heartbeat viene eseguito in una nuova sessione priva della cronologia delle conversazioni precedenti. Usa lo stesso schema di isolamento di cron `sessionTarget: "isolated"`. Riduce drasticamente il costo in token per ogni Heartbeat. Combinalo con `lightContext: true` per ottenere il massimo risparmio. L'instradamento della consegna continua a usare il contesto della sessione principale.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Quando è `true`, le esecuzioni di Heartbeat vengono rinviate se sono occupati i flussi aggiuntivi di quell'agente: il suo sottoagente associato alla chiave di sessione o un'attività di comando annidata. I flussi cron rinviano sempre gli Heartbeat, anche senza questo flag, così gli host con modelli locali non eseguono contemporaneamente i prompt cron e Heartbeat.
</ParamField>
<ParamField path="session" type="string">
  Chiave di sessione facoltativa per le esecuzioni di Heartbeat.

- `main` (valore predefinito): sessione principale dell'agente.
- Chiave di sessione esplicita (copiala da `openclaw sessions --json` o dalla [CLI delle sessioni](/it/cli/sessions)).
- Formati delle chiavi di sessione: consulta [Sessioni](/it/concepts/session) e [Gruppi](/it/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: invia all'ultimo canale esterno utilizzato.
- canale esplicito: qualsiasi canale configurato o ID di Plugin, ad esempio `discord`, `matrix`, `telegram` o `whatsapp`.
- `none` (valore predefinito): esegue l'Heartbeat ma **non lo invia** esternamente.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Controlla il comportamento di consegna diretta/DM. `allow`: consente la consegna diretta/DM degli Heartbeat. `block`: impedisce la consegna diretta/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Sostituzione facoltativa del destinatario (ID specifico del canale, ad esempio E.164 per WhatsApp o l'ID di una chat Telegram). Per argomenti/thread di Telegram, usa `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  ID account facoltativo per i canali con più account. Quando `target: "last"`, l'ID account si applica all'ultimo canale risolto se supporta gli account; altrimenti viene ignorato. Se l'ID account non corrisponde a un account configurato per il canale risolto, la consegna viene ignorata.

</ParamField>
<ParamField path="prompt" type="string">
  Sostituisce il corpo del prompt predefinito (senza unirlo).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  Indica se inserire la sezione `## Heartbeats` del prompt di sistema dell'agente predefinito. Imposta `false` per mantenere il comportamento di Heartbeat in fase di esecuzione (cadenza, consegna, HEARTBEAT.md) omettendo al contempo le istruzioni di Heartbeat dal prompt di sistema dell'agente.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Numero massimo di caratteri consentiti dopo `HEARTBEAT_OK` prima della consegna.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Quando è true, elimina i payload di avviso relativi agli errori degli strumenti durante le esecuzioni di Heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Numero massimo di secondi consentiti per un turno dell'agente Heartbeat prima che venga interrotto. Lascia non impostato per usare `agents.defaults.timeoutSeconds`, se configurato; altrimenti viene usata la cadenza di Heartbeat, con un limite massimo di 600 secondi.

</ParamField>
<ParamField path="activeHours" type="object">
  Limita le esecuzioni di Heartbeat a una finestra temporale. Oggetto con `start` (HH:MM, incluso; usa `00:00` per l'inizio della giornata), `end` (HH:MM escluso; `24:00` è consentito per la fine della giornata) e `timezone` facoltativo.

- Omesso o `"user"`: usa `agents.defaults.userTimezone` se impostato, altrimenti ricorre al fuso orario del sistema host.
- `"local"`: usa sempre il fuso orario del sistema host.
- Qualsiasi identificatore IANA (ad esempio `America/New_York`): viene usato direttamente; se non è valido, ricorre al comportamento `"user"` descritto sopra.
- `start` e `end` non devono essere uguali per una finestra attiva; valori uguali sono considerati una finestra di ampiezza zero (sempre al di fuori della finestra).
- Al di fuori della finestra attiva, gli Heartbeat vengono ignorati fino al tick successivo all'interno della finestra.

</ParamField>

## Comportamento della consegna

<AccordionGroup>
  <Accordion title="Instradamento della sessione e della destinazione">
    - Per impostazione predefinita, gli Heartbeat vengono eseguiti nella sessione principale dell'agente (`agent:<id>:<mainKey>`), oppure in `global` quando `session.scope = "global"`. Imposta `session` per specificare una determinata sessione di canale (Discord/WhatsApp/ecc.).
    - `session` influisce solo sul contesto di esecuzione; la consegna è controllata da `target` e `to`.
    - Per consegnare a un canale/destinatario specifico, imposta `target` + `to`. Con `target: "last"`, la consegna usa l'ultimo canale esterno di quella sessione.
    - Per impostazione predefinita, le consegne di Heartbeat consentono destinazioni dirette/DM. Imposta `directPolicy: "block"` per impedire gli invii a destinazioni dirette continuando comunque a eseguire il turno di Heartbeat.
    - Se la coda principale, la corsia della sessione di destinazione, la corsia Cron o un processo Cron attivo è occupato, l'Heartbeat viene ignorato e riprovato in seguito.
    - Se `skipWhenBusy: true`, anche le corsie dei sottoagenti associate alla chiave di sessione di questo agente e le corsie annidate rinviano le esecuzioni di Heartbeat. Le corsie occupate di altri agenti non rinviano questo agente.
    - Se `target` non viene risolto in alcuna destinazione esterna, l'esecuzione avviene comunque, ma non viene inviato alcun messaggio in uscita.

  </Accordion>
  <Accordion title="Visibilità e comportamento in caso di esclusione">
    - Se `showOk`, `showAlerts` e `useIndicator` sono tutti disabilitati, l'esecuzione viene esclusa in anticipo con `reason=alerts-disabled`.
    - Se è disabilitata solo la consegna degli avvisi, OpenClaw può comunque eseguire l'Heartbeat, aggiornare i timestamp delle attività in scadenza, ripristinare il timestamp di inattività della sessione ed eliminare il payload dell'avviso in uscita.
    - Se la destinazione Heartbeat risolta supporta l'indicazione di digitazione, OpenClaw la mostra mentre l'esecuzione di Heartbeat è attiva. Viene usata la stessa destinazione alla quale l'Heartbeat invierebbe l'output della chat; la funzione è disabilitata da `typingMode: "never"`.

  </Accordion>
  <Accordion title="Ciclo di vita della sessione e controllo">
    - Le risposte generate esclusivamente da Heartbeat **non** mantengono attiva la sessione. I metadati di Heartbeat possono aggiornare la riga della sessione, ma la scadenza per inattività usa `lastInteractionAt` dell'ultimo messaggio reale dell'utente/canale e la scadenza giornaliera usa `sessionStartedAt`.
    - La cronologia dell'interfaccia di controllo e di WebChat nasconde i prompt di Heartbeat e le conferme contenenti solo OK. La trascrizione della sessione sottostante può comunque contenere tali turni a fini di controllo/riproduzione.
    - Le [attività in background](/it/automation/tasks) scollegate possono accodare un evento di sistema e riattivare Heartbeat quando la sessione principale deve rilevare rapidamente qualcosa. Questa riattivazione non trasforma l'esecuzione di Heartbeat in un'attività in background.

  </Accordion>
</AccordionGroup>

## Controlli di visibilità

Per impostazione predefinita, le conferme `HEARTBEAT_OK` vengono soppresse mentre il contenuto degli avvisi viene consegnato. Puoi modificare questo comportamento per canale o per account:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Nasconde HEARTBEAT_OK (impostazione predefinita)
      showAlerts: true # Mostra i messaggi di avviso (impostazione predefinita)
      useIndicator: true # Emette eventi indicatore (impostazione predefinita)
  telegram:
    heartbeat:
      showOk: true # Mostra le conferme OK su Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Impedisce la consegna degli avvisi per questo account
```

Precedenza: per account → per canale → impostazioni predefinite del canale → impostazioni predefinite integrate.

### Funzione di ciascun flag

- `showOk`: invia una conferma `HEARTBEAT_OK` quando il modello restituisce una risposta contenente solo OK.
- `showAlerts`: invia il contenuto dell'avviso quando il modello restituisce una risposta diversa da OK.
- `useIndicator`: emette eventi indicatore per le superfici di stato dell'interfaccia utente.

Se **tutti e tre** sono false, OpenClaw ignora completamente l'esecuzione di Heartbeat (nessuna chiamata al modello).

### Esempi per canale e per account

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # tutti gli account Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # sopprime gli avvisi solo per l'account ops
  telegram:
    heartbeat:
      showOk: true
```

### Schemi comuni

| Obiettivo                                            | Configurazione                                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Comportamento predefinito (OK silenziosi, avvisi sì) | _(nessuna configurazione necessaria)_                                                      |
| Completamente silenzioso (nessun messaggio/indicatore) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Solo indicatore (nessun messaggio)                    | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK in un solo canale                                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (facoltativo)

Se nell'area di lavoro esiste un file `HEARTBEAT.md`, il prompt predefinito indica all'agente di leggerlo. Consideralo la tua "lista di controllo di Heartbeat": piccola, stabile e sicura da consultare ogni 30 minuti.

Nelle esecuzioni normali, `HEARTBEAT.md` viene inserito solo quando le indicazioni di Heartbeat sono abilitate per l'agente predefinito. Disabilitare la cadenza di Heartbeat con `0m` o impostare `includeSystemPromptSection: false` lo omette dal contesto di inizializzazione normale.

Nell'harness nativo di Codex, il contenuto di `HEARTBEAT.md` non viene inserito nel turno come gli altri file di inizializzazione. Se il file esiste e contiene caratteri diversi dagli spazi, una nota sulla modalità di collaborazione di Heartbeat indica il file a Codex e gli chiede di leggerlo prima di procedere.

Se `HEARTBEAT.md` esiste ma è di fatto vuoto (contiene solo righe vuote, commenti Markdown/HTML, titoli Markdown come `# Heading`, delimitatori di blocchi di codice o elementi vuoti della lista di controllo), OpenClaw ignora l'esecuzione di Heartbeat per risparmiare chiamate API. Questa esclusione viene segnalata come `reason=empty-heartbeat-file`. Se il file non è presente, l'Heartbeat viene comunque eseguito e il modello decide cosa fare.

Mantienilo molto breve (una lista di controllo concisa o dei promemoria) per evitare di gonfiare il prompt.

Esempio di `HEARTBEAT.md`:

```md
# Lista di controllo di Heartbeat

- Controllo rapido: c'è qualcosa di urgente nelle caselle di posta?
- Se è giorno, esegui un controllo leggero se non c'è altro in sospeso.
- Se un'attività è bloccata, annota _cosa manca_ e chiedi a Peter la prossima volta.
```

### Blocchi `tasks:`

`HEARTBEAT.md` supporta anche un piccolo blocco strutturato `tasks:` per i controlli basati su intervalli all'interno dello stesso Heartbeat.

Esempio:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Controlla se ci sono email urgenti non lette e segnala quelle sensibili al tempo."
- name: calendar-scan
  interval: 2h
  prompt: "Controlla gli appuntamenti imminenti che richiedono preparazione o un seguito."

# Istruzioni aggiuntive

- Mantieni brevi gli avvisi.
- Se, dopo tutte le attività in scadenza, nulla richiede attenzione, rispondi HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Comportamento">
    - OpenClaw analizza il blocco `tasks:` e verifica ogni attività in base al relativo `interval`.
    - Solo le attività **in scadenza** vengono incluse nel prompt di Heartbeat per quel tick.
    - Se nessuna attività è in scadenza, l'Heartbeat viene completamente ignorato (`reason=no-tasks-due`) per evitare una chiamata al modello inutile.
    - Il contenuto non relativo alle attività in `HEARTBEAT.md` viene conservato e aggiunto come contesto supplementare dopo l'elenco delle attività in scadenza.
    - I timestamp dell'ultima esecuzione delle attività vengono memorizzati nello stato della sessione (`heartbeatTaskState`), così gli intervalli persistono dopo i normali riavvii.
    - I timestamp delle attività vengono aggiornati solo dopo che un'esecuzione di Heartbeat ha completato il normale percorso di risposta. Le esecuzioni ignorate per `empty-heartbeat-file` / `no-tasks-due` non contrassegnano le attività come completate.

  </Accordion>
</AccordionGroup>

La modalità attività è utile quando vuoi che un singolo file Heartbeat contenga diversi controlli periodici senza sostenerne il costo a ogni tick.

### L'agente può aggiornare HEARTBEAT.md?

Sì, se glielo chiedi.

`HEARTBEAT.md` è un normale file nell'area di lavoro dell'agente, quindi puoi dire all'agente (in una normale chat) qualcosa come:

- "Aggiorna `HEARTBEAT.md` per aggiungere un controllo giornaliero del calendario."
- "Riscrivi `HEARTBEAT.md` in modo che sia più breve e incentrato sui riscontri relativi alla posta in arrivo."

Se vuoi che ciò avvenga in modo proattivo, puoi anche includere una riga esplicita nel prompt di Heartbeat, ad esempio: "Se la lista di controllo diventa obsoleta, aggiorna HEARTBEAT.md con una versione migliore."

<Warning>
Non inserire segreti (chiavi API, numeri di telefono, token privati) in `HEARTBEAT.md`: diventano parte del contesto del prompt.
</Warning>

## Riattivazione manuale (su richiesta)

Usa `openclaw system event` per accodare un evento di sistema e, facoltativamente, attivare immediatamente un Heartbeat:

```bash
openclaw system event --text "Controlla se ci sono riscontri urgenti" --mode now
```

| Flag                         | Descrizione                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `--text <text>`              | Testo dell'evento di sistema (obbligatorio).                                                                        |
| `--mode <mode>`              | `now` esegue immediatamente un Heartbeat; `next-heartbeat` (predefinito) attende il tick pianificato successivo.    |
| `--session-key <sessionKey>` | Destina l'evento a una sessione specifica; per impostazione predefinita usa la sessione principale dell'agente.     |
| `--json`                     | Produce output JSON.                                                                                                |

Se non viene specificato `--session-key` e più agenti hanno `heartbeat` configurato, `--mode now` esegue immediatamente gli Heartbeat di ciascuno di tali agenti.

Controlli Heartbeat correlati nello stesso gruppo CLI:

```bash
openclaw system heartbeat last     # mostra l'ultimo evento Heartbeat
openclaw system heartbeat enable   # abilita gli Heartbeat
openclaw system heartbeat disable  # disabilita gli Heartbeat
```

## Consegna del ragionamento (facoltativa)

Per impostazione predefinita, gli heartbeat recapitano solo il payload finale di "risposta".

Se desideri maggiore trasparenza, abilita:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando questa opzione è abilitata, gli heartbeat recapiteranno anche un messaggio separato con il prefisso `Thinking` (nello stesso formato di `/reasoning on`). Può essere utile quando l'agente gestisce più sessioni/codex e vuoi capire perché ha deciso di contattarti, ma può anche rivelare più dettagli interni di quanto desideri. È preferibile mantenerla disabilitata nelle chat di gruppo.

## Attenzione ai costi

Gli heartbeat eseguono turni completi dell'agente. Intervalli più brevi consumano più token. Per ridurre i costi:

- Usa `isolatedSession: true` per evitare di inviare l'intera cronologia della conversazione (da circa 100.000 token a circa 2.000-5.000 per esecuzione).
- Usa `lightContext: true` per limitare i file di bootstrap al solo `HEARTBEAT.md`.
- Imposta un `model` più economico (ad esempio `ollama/llama3.2:1b`).
- Mantieni `HEARTBEAT.md` di dimensioni ridotte.
- Usa `target: "none"` se desideri solo aggiornamenti dello stato interno.

## Overflow del contesto dopo un heartbeat

Al termine dell'esecuzione, gli heartbeat mantengono il modello di runtime esistente della sessione condivisa; pertanto, un heartbeat che ha impostato per una sessione un modello locale più piccolo (ad esempio un modello Ollama con una finestra di 32.000 token) può lasciare attivo quel modello per il successivo turno della sessione principale. Se tale turno segnala un overflow del contesto e l'ultimo modello di runtime della sessione corrisponde al valore configurato in `heartbeat.model`, il messaggio di ripristino di OpenClaw indica come causa probabile la persistenza del modello dell'heartbeat e suggerisce una soluzione.

Per evitarlo: usa `isolatedSession: true` per eseguire gli heartbeat in una nuova sessione (facoltativamente in combinazione con `lightContext: true` per ottenere il prompt più piccolo possibile), oppure scegli un modello per gli heartbeat con una finestra di contesto sufficientemente ampia per la sessione condivisa.

## Argomenti correlati

- [Automazione](/it/automation) - tutti i meccanismi di automazione in sintesi
- [Attività in background](/it/automation/tasks) - come vengono monitorate le attività scollegate
- [Fuso orario](/it/concepts/timezone) - come il fuso orario influisce sulla pianificazione degli heartbeat
- [Risoluzione dei problemi](/it/automation/cron-jobs#troubleshooting) - come diagnosticare i problemi di automazione
