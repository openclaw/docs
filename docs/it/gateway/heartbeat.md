---
read_when:
    - Regolazione della cadenza di Heartbeat o della messaggistica
    - Scegliere tra Heartbeat e Cron per le attività pianificate
sidebarTitle: Heartbeat
summary: Messaggi di polling Heartbeat e regole di notifica
title: Heartbeat
x-i18n:
    generated_at: "2026-04-30T08:52:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bafae7cafb9163015a112c074d36ab070c71d1d7ba1c7c0834e6720521f4275
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat o cron?** Consulta [Automazione e attività](/it/automation) per indicazioni su quando usare ciascuno.
</Note>

Heartbeat esegue **turni periodici dell'agente** nella sessione principale, così il modello può far emergere tutto ciò che richiede attenzione senza inviarti messaggi indesiderati.

Heartbeat è un turno pianificato della sessione principale: **non** crea record di [attività in background](/it/automation/tasks). I record delle attività servono per il lavoro separato (esecuzioni ACP, subagenti, processi cron isolati).

Risoluzione dei problemi: [Attività pianificate](/it/automation/cron-jobs#troubleshooting)

## Avvio rapido (principianti)

<Steps>
  <Step title="Scegli una cadenza">
    Lascia abilitati gli Heartbeat (il valore predefinito è `30m`, oppure `1h` per l'autenticazione OAuth/token di Anthropic, incluso il riuso della CLI Claude) o imposta una cadenza personalizzata.
  </Step>
  <Step title="Aggiungi HEARTBEAT.md (facoltativo)">
    Crea una piccola checklist `HEARTBEAT.md` o un blocco `tasks:` nello spazio di lavoro dell'agente.
  </Step>
  <Step title="Decidi dove devono arrivare i messaggi Heartbeat">
    `target: "none"` è il valore predefinito; imposta `target: "last"` per inoltrare all'ultimo contatto.
  </Step>
  <Step title="Ottimizzazione facoltativa">
    - Abilita la consegna del ragionamento Heartbeat per maggiore trasparenza.
    - Usa un contesto di bootstrap leggero se le esecuzioni Heartbeat richiedono solo `HEARTBEAT.md`.
    - Abilita sessioni isolate per evitare di inviare l'intera cronologia della conversazione a ogni Heartbeat.
    - Limita gli Heartbeat agli orari attivi (ora locale).

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
        skipWhenBusy: true, // optional: also defer when subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Valori predefiniti

- Intervallo: `30m` (oppure `1h` quando la modalità di autenticazione rilevata è OAuth/token di Anthropic, incluso il riuso della CLI Claude). Imposta `agents.defaults.heartbeat.every` o, per agente, `agents.list[].heartbeat.every`; usa `0m` per disabilitare.
- Corpo del prompt (configurabile tramite `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Il prompt Heartbeat viene inviato **letteralmente** come messaggio dell'utente. Il prompt di sistema include una sezione "Heartbeat" solo quando gli Heartbeat sono abilitati per l'agente predefinito, e l'esecuzione viene contrassegnata internamente.
- Quando gli Heartbeat sono disabilitati con `0m`, anche le esecuzioni normali omettono `HEARTBEAT.md` dal contesto di bootstrap, così il modello non vede istruzioni destinate solo a Heartbeat.
- Gli orari attivi (`heartbeat.activeHours`) vengono controllati nel fuso orario configurato. Fuori dalla finestra, gli Heartbeat vengono saltati fino al tick successivo all'interno della finestra.
- Gli Heartbeat vengono automaticamente rinviati mentre un lavoro cron è attivo o in coda. Imposta `heartbeat.skipWhenBusy: true` per rinviare anche quando ci sono corsie particolarmente occupate (lavoro di subagente o comando annidato); è utile per Ollama locale e altri host con runtime singolo limitato.

## A cosa serve il prompt Heartbeat

Il prompt predefinito è volutamente ampio:

- **Attività in background**: "Consider outstanding tasks" sollecita l'agente a rivedere i follow-up (posta in arrivo, calendario, promemoria, lavoro in coda) e a segnalare qualsiasi cosa urgente.
- **Controllo con l'essere umano**: "Checkup sometimes on your human during day time" sollecita un messaggio leggero occasionale del tipo "serve qualcosa?", ma evita messaggi indesiderati notturni usando il fuso orario locale configurato (vedi [Fuso orario](/it/concepts/timezone)).

Heartbeat può reagire ad [attività in background](/it/automation/tasks) completate, ma un'esecuzione Heartbeat in sé non crea un record attività.

Se vuoi che un Heartbeat faccia qualcosa di molto specifico (per esempio "controlla le statistiche PubSub di Gmail" o "verifica lo stato del gateway"), imposta `agents.defaults.heartbeat.prompt` (o `agents.list[].heartbeat.prompt`) su un corpo personalizzato (inviato letteralmente).

## Contratto di risposta

- Se nulla richiede attenzione, rispondi con **`HEARTBEAT_OK`**.
- Durante le esecuzioni Heartbeat, OpenClaw tratta `HEARTBEAT_OK` come conferma quando compare all'**inizio o alla fine** della risposta. Il token viene rimosso e la risposta viene eliminata se il contenuto restante è **≤ `ackMaxChars`** (predefinito: 300).
- Se `HEARTBEAT_OK` compare nel **mezzo** di una risposta, non viene trattato in modo speciale.
- Per gli avvisi, **non** includere `HEARTBEAT_OK`; restituisci solo il testo dell'avviso.

Fuori dagli Heartbeat, un `HEARTBEAT_OK` accidentale all'inizio/fine di un messaggio viene rimosso e registrato; un messaggio che contiene solo `HEARTBEAT_OK` viene eliminato.

## Configurazione

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Ambito e precedenza

- `agents.defaults.heartbeat` imposta il comportamento Heartbeat globale.
- `agents.list[].heartbeat` viene unito sopra; se un agente ha un blocco `heartbeat`, **solo quegli agenti** eseguono Heartbeat.
- `channels.defaults.heartbeat` imposta i valori predefiniti di visibilità per tutti i canali.
- `channels.<channel>.heartbeat` sovrascrive i valori predefiniti del canale.
- `channels.<channel>.accounts.<id>.heartbeat` (canali multi-account) sovrascrive le impostazioni per canale.

### Heartbeat per agente

Se una voce `agents.list[]` include un blocco `heartbeat`, **solo quegli agenti** eseguono Heartbeat. Il blocco per agente viene unito sopra `agents.defaults.heartbeat` (così puoi impostare i valori predefiniti condivisi una volta sola e sovrascriverli per agente).

Esempio: due agenti, solo il secondo esegue Heartbeat.

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

### Esempio di orari attivi

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

Fuori da questa finestra (prima delle 9:00 o dopo le 22:00 Eastern), gli Heartbeat vengono saltati. Il successivo tick pianificato all'interno della finestra verrà eseguito normalmente.

### Configurazione 24/7

Se vuoi che gli Heartbeat vengano eseguiti tutto il giorno, usa uno di questi schemi:

- Ometti completamente `activeHours` (nessuna restrizione per finestra oraria; questo è il comportamento predefinito).
- Imposta una finestra di giornata intera: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Non impostare lo stesso orario di `start` e `end` (per esempio da `08:00` a `08:00`). Viene trattato come una finestra di ampiezza zero, quindi gli Heartbeat vengono sempre saltati.
</Warning>

### Esempio multi-account

Usa `accountId` per indirizzare un account specifico su canali multi-account come Telegram:

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
  Intervallo Heartbeat (stringa di durata; unità predefinita = minuti).
</ParamField>
<ParamField path="model" type="string">
  Override facoltativo del modello per le esecuzioni Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Quando abilitato, consegna anche il messaggio separato `Reasoning:` quando disponibile (stessa forma di `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Quando true, le esecuzioni Heartbeat usano un contesto di bootstrap leggero e mantengono solo `HEARTBEAT.md` dai file di bootstrap dello spazio di lavoro.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Quando true, ogni Heartbeat viene eseguito in una sessione nuova senza cronologia della conversazione precedente. Usa lo stesso schema di isolamento di cron `sessionTarget: "isolated"`. Riduce drasticamente il costo in token per Heartbeat. Combinalo con `lightContext: true` per il massimo risparmio. L'instradamento della consegna usa comunque il contesto della sessione principale.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Quando true, le esecuzioni Heartbeat vengono rinviate sulle corsie particolarmente occupate: lavoro di subagente o comando annidato. Le corsie cron rinviano sempre gli Heartbeat, anche senza questo flag, così gli host con modello locale non eseguono prompt cron e Heartbeat nello stesso momento.
</ParamField>
<ParamField path="session" type="string">
  Chiave di sessione facoltativa per le esecuzioni Heartbeat.

- `main` (predefinito): sessione principale dell'agente.
- Chiave di sessione esplicita (copiata da `openclaw sessions --json` o dalla [CLI delle sessioni](/it/cli/sessions)).
- Formati delle chiavi di sessione: vedi [Sessioni](/it/concepts/session) e [Gruppi](/it/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: consegna all'ultimo canale esterno usato.
- canale esplicito: qualsiasi canale configurato o ID Plugin, per esempio `discord`, `matrix`, `telegram` o `whatsapp`.
- `none` (predefinito): esegui Heartbeat ma **non consegnare** all'esterno.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Controlla il comportamento di consegna diretta/DM. `allow`: consente la consegna Heartbeat diretta/DM. `block`: sopprime la consegna diretta/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Override facoltativo del destinatario (ID specifico del canale, per esempio E.164 per WhatsApp o un ID chat Telegram). Per topic/thread Telegram, usa `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  ID account facoltativo per canali multi-account. Quando `target: "last"`, l'ID account si applica all'ultimo canale risolto se supporta gli account; altrimenti viene ignorato. Se l'ID account non corrisponde a un account configurato per il canale risolto, la consegna viene saltata.

</ParamField>
<ParamField path="prompt" type="string">
  Sovrascrive il corpo del prompt predefinito (non viene unito).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Numero massimo di caratteri consentiti dopo `HEARTBEAT_OK` prima della consegna.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Quando è true, sopprime i payload di avviso di errore degli strumenti durante le esecuzioni Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Limita le esecuzioni Heartbeat a una finestra temporale. Oggetto con `start` (HH:MM, incluso; usa `00:00` per l'inizio della giornata), `end` (HH:MM escluso; `24:00` consentito per la fine della giornata) e `timezone` opzionale.

- Omesso o `"user"`: usa `agents.defaults.userTimezone` se impostato, altrimenti ripiega sul fuso orario del sistema host.
- `"local"`: usa sempre il fuso orario del sistema host.
- Qualsiasi identificatore IANA (ad es. `America/New_York`): usato direttamente; se non valido, ripiega sul comportamento `"user"` descritto sopra.
- `start` e `end` non devono essere uguali per una finestra attiva; valori uguali sono trattati come finestra di larghezza zero (sempre fuori dalla finestra).
- Fuori dalla finestra attiva, gli Heartbeat vengono saltati fino al tick successivo all'interno della finestra.

</ParamField>

## Comportamento di consegna

<AccordionGroup>
  <Accordion title="Routing di sessione e destinazione">
    - Gli Heartbeat vengono eseguiti per impostazione predefinita nella sessione principale dell'agente (`agent:<id>:<mainKey>`), oppure in `global` quando `session.scope = "global"`. Imposta `session` per sovrascrivere con una sessione di canale specifica (Discord/WhatsApp/ecc.).
    - `session` influisce solo sul contesto di esecuzione; la consegna è controllata da `target` e `to`.
    - Per consegnare a un canale/destinatario specifico, imposta `target` + `to`. Con `target: "last"`, la consegna usa l'ultimo canale esterno per quella sessione.
    - Le consegne Heartbeat consentono destinazioni dirette/DM per impostazione predefinita. Imposta `directPolicy: "block"` per sopprimere gli invii a destinazioni dirette pur continuando a eseguire il turno Heartbeat.
    - Se la coda principale, la lane della sessione di destinazione, la lane Cron o un job Cron attivo è occupato, l'Heartbeat viene saltato e ritentato più tardi.
    - Se `skipWhenBusy: true`, anche subagenti e lane annidate rinviano le esecuzioni Heartbeat.
    - Se `target` non si risolve in alcuna destinazione esterna, l'esecuzione avviene comunque ma non viene inviato alcun messaggio in uscita.

  </Accordion>
  <Accordion title="Visibilità e comportamento di salto">
    - Se `showOk`, `showAlerts` e `useIndicator` sono tutti disabilitati, l'esecuzione viene saltata in anticipo come `reason=alerts-disabled`.
    - Se è disabilitata solo la consegna degli avvisi, OpenClaw può comunque eseguire l'Heartbeat, aggiornare i timestamp dei task in scadenza, ripristinare il timestamp di inattività della sessione e sopprimere il payload di avviso verso l'esterno.
    - Se la destinazione Heartbeat risolta supporta l'indicazione di digitazione, OpenClaw mostra la digitazione mentre l'esecuzione Heartbeat è attiva. Questo usa la stessa destinazione a cui l'Heartbeat invierebbe l'output chat, ed è disabilitato da `typingMode: "never"`.

  </Accordion>
  <Accordion title="Ciclo di vita della sessione e audit">
    - Le risposte solo Heartbeat **non** mantengono viva la sessione. I metadati Heartbeat possono aggiornare la riga della sessione, ma la scadenza per inattività usa `lastInteractionAt` dell'ultimo messaggio reale dell'utente/canale, e la scadenza giornaliera usa `sessionStartedAt`.
    - La cronologia di Control UI e WebChat nasconde i prompt Heartbeat e le conferme solo OK. La trascrizione di sessione sottostante può comunque contenere quei turni per audit/riproduzione.
    - I [task in background](/it/automation/tasks) scollegati possono accodare un evento di sistema e risvegliare l'Heartbeat quando la sessione principale deve notare rapidamente qualcosa. Quel risveglio non rende l'esecuzione Heartbeat un task in background.

  </Accordion>
</AccordionGroup>

## Controlli di visibilità

Per impostazione predefinita, le conferme `HEARTBEAT_OK` vengono soppresse mentre il contenuto degli avvisi viene consegnato. Puoi regolare questo comportamento per canale o per account:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

Precedenza: per account → per canale → impostazioni predefinite del canale → impostazioni predefinite integrate.

### Cosa fa ogni flag

- `showOk`: invia una conferma `HEARTBEAT_OK` quando il modello restituisce una risposta solo OK.
- `showAlerts`: invia il contenuto dell'avviso quando il modello restituisce una risposta non OK.
- `useIndicator`: emette eventi indicatore per le superfici di stato dell'UI.

Se **tutti e tre** sono false, OpenClaw salta completamente l'esecuzione Heartbeat (nessuna chiamata al modello).

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
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### Pattern comuni

| Obiettivo                                | Configurazione                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamento predefinito (OK silenziosi, avvisi attivi) | _(nessuna configurazione necessaria)_                                      |
| Completamente silenzioso (nessun messaggio, nessun indicatore) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Solo indicatore (nessun messaggio)       | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK in un solo canale                     | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opzionale)

Se nello workspace esiste un file `HEARTBEAT.md`, il prompt predefinito dice all'agente di leggerlo. Consideralo la tua "checklist Heartbeat": piccola, stabile e sicura da includere ogni 30 minuti.

Nelle esecuzioni normali, `HEARTBEAT.md` viene iniettato solo quando la guida Heartbeat è abilitata per l'agente predefinito. Disabilitare la cadenza Heartbeat con `0m` o impostare `includeSystemPromptSection: false` lo omette dal normale contesto di bootstrap.

Se `HEARTBEAT.md` esiste ma è di fatto vuoto (solo righe vuote e intestazioni markdown come `# Heading`), OpenClaw salta l'esecuzione Heartbeat per risparmiare chiamate API. Quel salto viene riportato come `reason=empty-heartbeat-file`. Se il file manca, l'Heartbeat viene comunque eseguito e il modello decide cosa fare.

Mantienilo minuscolo (breve checklist o promemoria) per evitare gonfiore del prompt.

Esempio di `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Blocchi `tasks:`

`HEARTBEAT.md` supporta anche un piccolo blocco strutturato `tasks:` per controlli basati su intervalli all'interno dell'Heartbeat stesso.

Esempio:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Comportamento">
    - OpenClaw analizza il blocco `tasks:` e verifica ogni task rispetto al proprio `interval`.
    - Solo i task **in scadenza** vengono inclusi nel prompt Heartbeat per quel tick.
    - Se nessun task è in scadenza, l'Heartbeat viene saltato completamente (`reason=no-tasks-due`) per evitare una chiamata al modello sprecata.
    - Il contenuto non relativo ai task in `HEARTBEAT.md` viene preservato e aggiunto come contesto aggiuntivo dopo l'elenco dei task in scadenza.
    - I timestamp dell'ultima esecuzione dei task vengono memorizzati nello stato della sessione (`heartbeatTaskState`), quindi gli intervalli sopravvivono ai normali riavvii.
    - I timestamp dei task avanzano solo dopo che un'esecuzione Heartbeat completa il suo normale percorso di risposta. Le esecuzioni saltate `empty-heartbeat-file` / `no-tasks-due` non contrassegnano i task come completati.

  </Accordion>
</AccordionGroup>

La modalità task è utile quando vuoi che un singolo file Heartbeat contenga diversi controlli periodici senza pagare per tutti a ogni tick.

### L'agente può aggiornare HEARTBEAT.md?

Sì — se glielo chiedi.

`HEARTBEAT.md` è solo un normale file nello workspace dell'agente, quindi puoi dire all'agente (in una normale chat) qualcosa come:

- "Aggiorna `HEARTBEAT.md` per aggiungere un controllo giornaliero del calendario."
- "Riscrivi `HEARTBEAT.md` in modo che sia più breve e focalizzato sui follow-up della posta in arrivo."

Se vuoi che questo accada in modo proattivo, puoi anche includere una riga esplicita nel prompt Heartbeat, ad esempio: "Se la checklist diventa obsoleta, aggiorna HEARTBEAT.md con una migliore."

<Warning>
Non inserire segreti (chiavi API, numeri di telefono, token privati) in `HEARTBEAT.md` — diventa parte del contesto del prompt.
</Warning>

## Risveglio manuale (su richiesta)

Puoi accodare un evento di sistema e attivare un Heartbeat immediato con:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Se più agenti hanno `heartbeat` configurato, un risveglio manuale esegue immediatamente ciascuno di quegli Heartbeat degli agenti.

Usa `--mode next-heartbeat` per attendere il prossimo tick pianificato.

## Consegna del ragionamento (opzionale)

Per impostazione predefinita, gli Heartbeat consegnano solo il payload finale di "risposta".

Se vuoi trasparenza, abilita:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando abilitato, gli Heartbeat consegneranno anche un messaggio separato prefissato con `Reasoning:` (stessa forma di `/reasoning on`). Questo può essere utile quando l'agente gestisce più sessioni/codex e vuoi vedere perché ha deciso di inviarti un ping — ma può anche esporre più dettagli interni di quanti ne desideri. Preferisci lasciarlo disattivato nelle chat di gruppo.

## Consapevolezza dei costi

Gli Heartbeat eseguono turni completi dell'agente. Intervalli più brevi consumano più token. Per ridurre i costi:

- Usa `isolatedSession: true` per evitare di inviare l'intera cronologia della conversazione (da ~100K token a ~2-5K per esecuzione).
- Usa `lightContext: true` per limitare i file di bootstrap al solo `HEARTBEAT.md`.
- Imposta un `model` più economico (ad es. `ollama/llama3.2:1b`).
- Mantieni `HEARTBEAT.md` piccolo.
- Usa `target: "none"` se vuoi solo aggiornamenti dello stato interno.

## Overflow del contesto dopo l'Heartbeat

Se un Heartbeat usa un modello locale più piccolo, per esempio un modello Ollama con una finestra da 32k, e il turno successivo della sessione principale segnala overflow del contesto, verifica se l'Heartbeat precedente ha lasciato la sessione sul modello Heartbeat. Il messaggio di reset di OpenClaw lo segnala quando l'ultimo modello runtime corrisponde a `heartbeat.model` configurato.

Usa `isolatedSession: true` per eseguire gli Heartbeat in una sessione fresca, combinalo con `lightContext: true` per il prompt più piccolo, oppure scegli un modello Heartbeat con una finestra di contesto abbastanza grande per la sessione condivisa.

## Correlati

- [Automation & Tasks](/it/automation) — tutti i meccanismi di automazione in sintesi
- [Task in background](/it/automation/tasks) — come viene tracciato il lavoro scollegato
- [Fuso orario](/it/concepts/timezone) — come il fuso orario influisce sulla pianificazione Heartbeat
- [Risoluzione dei problemi](/it/automation/cron-jobs#troubleshooting) — debug dei problemi di automazione
