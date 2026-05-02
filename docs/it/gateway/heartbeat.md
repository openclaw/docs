---
read_when:
    - Regolazione della cadenza di Heartbeat o della messaggistica
    - Scegliere tra Heartbeat e Cron per le attività pianificate
sidebarTitle: Heartbeat
summary: Messaggi di polling di Heartbeat e regole di notifica
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T08:22:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8198c74e2712c7ed9d34c41bad7c4e9be62043e8755cb4c9a60649222e04e37
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat o cron?** Consulta [Automazione e attività](/it/automation) per indicazioni su quando usare ciascuno.
</Note>

Heartbeat esegue **turni periodici dell’agente** nella sessione principale, così il modello può portare alla luce tutto ciò che richiede attenzione senza inviarti spam.

Heartbeat è un turno pianificato nella sessione principale: **non** crea record di [attività in background](/it/automation/tasks). I record delle attività sono per lavoro distaccato (esecuzioni ACP, sottoagenti, processi cron isolati).

Risoluzione dei problemi: [Attività pianificate](/it/automation/cron-jobs#troubleshooting)

## Avvio rapido (principianti)

<Steps>
  <Step title="Scegli una cadenza">
    Lascia abilitati gli Heartbeat (il valore predefinito è `30m`, oppure `1h` per autenticazione Anthropic OAuth/token, incluso il riuso della Claude CLI) oppure imposta una cadenza personalizzata.
  </Step>
  <Step title="Aggiungi HEARTBEAT.md (opzionale)">
    Crea una piccola checklist `HEARTBEAT.md` o un blocco `tasks:` nell’area di lavoro dell’agente.
  </Step>
  <Step title="Decidi dove devono andare i messaggi Heartbeat">
    `target: "none"` è il valore predefinito; imposta `target: "last"` per instradarli all’ultimo contatto.
  </Step>
  <Step title="Regolazione opzionale">
    - Abilita la consegna del ragionamento Heartbeat per trasparenza.
    - Usa un contesto di bootstrap leggero se le esecuzioni Heartbeat hanno bisogno solo di `HEARTBEAT.md`.
    - Abilita sessioni isolate per evitare di inviare l’intera cronologia della conversazione a ogni Heartbeat.
    - Limita gli Heartbeat alle ore attive (ora locale).

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

- Intervallo: `30m` (oppure `1h` quando la modalità di autenticazione rilevata è Anthropic OAuth/token, incluso il riuso della Claude CLI). Imposta `agents.defaults.heartbeat.every` o `agents.list[].heartbeat.every`; usa `0m` per disabilitare.
- Corpo del prompt (configurabile tramite `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Il prompt Heartbeat viene inviato **letteralmente** come messaggio dell’utente. Il prompt di sistema include una sezione "Heartbeat" solo quando gli Heartbeat sono abilitati per l’agente predefinito e l’esecuzione viene contrassegnata internamente.
- Quando gli Heartbeat sono disabilitati con `0m`, anche le esecuzioni normali omettono `HEARTBEAT.md` dal contesto di bootstrap, così il modello non vede istruzioni riservate agli Heartbeat.
- Le ore attive (`heartbeat.activeHours`) vengono controllate nel fuso orario configurato. Fuori dalla finestra, gli Heartbeat vengono saltati fino al successivo tick dentro la finestra.
- Gli Heartbeat vengono rimandati automaticamente mentre lavoro Cron è attivo o in coda. Imposta `heartbeat.skipWhenBusy: true` per rimandare anche su corsie extra occupate (lavoro di sottoagente o comando annidato); è utile per Ollama locale e altri host vincolati con runtime singolo.

## A cosa serve il prompt Heartbeat

Il prompt predefinito è intenzionalmente ampio:

- **Attività in background**: "Consider outstanding tasks" suggerisce all’agente di rivedere i follow-up (posta in arrivo, calendario, promemoria, lavoro in coda) e portare alla luce qualsiasi cosa urgente.
- **Controllo con l’umano**: "Checkup sometimes on your human during day time" suggerisce un messaggio leggero occasionale del tipo "ti serve qualcosa?", ma evita lo spam notturno usando il tuo fuso orario locale configurato (vedi [Fuso orario](/it/concepts/timezone)).

Heartbeat può reagire alle [attività in background](/it/automation/tasks) completate, ma un’esecuzione Heartbeat in sé non crea un record di attività.

Se vuoi che un Heartbeat faccia qualcosa di molto specifico (ad esempio "controlla le statistiche Gmail PubSub" o "verifica la salute del Gateway"), imposta `agents.defaults.heartbeat.prompt` (o `agents.list[].heartbeat.prompt`) su un corpo personalizzato (inviato letteralmente).

## Contratto di risposta

- Se niente richiede attenzione, rispondi con **`HEARTBEAT_OK`**.
- Le esecuzioni Heartbeat con strumenti disponibili possono invece chiamare `heartbeat_respond` con `notify: false` per nessun aggiornamento visibile, oppure `notify: true` più `notificationText` per un avviso. Quando presente, la risposta strutturata dello strumento ha precedenza sul fallback testuale.
- Durante le esecuzioni Heartbeat, OpenClaw tratta `HEARTBEAT_OK` come un ack quando appare all’**inizio o alla fine** della risposta. Il token viene rimosso e la risposta viene scartata se il contenuto rimanente è **≤ `ackMaxChars`** (predefinito: 300).
- Se `HEARTBEAT_OK` appare nel **mezzo** di una risposta, non viene trattato in modo speciale.
- Per gli avvisi, **non** includere `HEARTBEAT_OK`; restituisci solo il testo dell’avviso.

Fuori dagli Heartbeat, un `HEARTBEAT_OK` isolato all’inizio/fine di un messaggio viene rimosso e registrato; un messaggio composto solo da `HEARTBEAT_OK` viene scartato.

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
- `agents.list[].heartbeat` si fonde sopra; se un agente ha un blocco `heartbeat`, **solo quegli agenti** eseguono Heartbeat.
- `channels.defaults.heartbeat` imposta i valori predefiniti di visibilità per tutti i canali.
- `channels.<channel>.heartbeat` sovrascrive i valori predefiniti del canale.
- `channels.<channel>.accounts.<id>.heartbeat` (canali multi-account) sovrascrive le impostazioni per canale.

### Heartbeat per agente

Se una voce `agents.list[]` include un blocco `heartbeat`, **solo quegli agenti** eseguono Heartbeat. Il blocco per agente si fonde sopra `agents.defaults.heartbeat` (quindi puoi impostare una volta i valori predefiniti condivisi e sovrascriverli per agente).

Esempio: due agenti, solo il secondo agente esegue Heartbeat.

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

### Esempio di ore attive

Limita gli Heartbeat all’orario lavorativo in un fuso orario specifico:

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

Fuori da questa finestra (prima delle 9:00 o dopo le 22:00 Eastern), gli Heartbeat vengono saltati. Il successivo tick pianificato dentro la finestra verrà eseguito normalmente.

### Configurazione 24/7

Se vuoi che gli Heartbeat vengano eseguiti tutto il giorno, usa uno di questi schemi:

- Ometti del tutto `activeHours` (nessuna restrizione di finestra temporale; questo è il comportamento predefinito).
- Imposta una finestra di giornata intera: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Non impostare lo stesso orario per `start` ed `end` (per esempio da `08:00` a `08:00`). Viene trattato come una finestra di ampiezza zero, quindi gli Heartbeat vengono sempre saltati.
</Warning>

### Esempio multi-account

Usa `accountId` per puntare a un account specifico su canali multi-account come Telegram:

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
  Sostituzione opzionale del modello per le esecuzioni Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Quando abilitato, consegna anche il messaggio separato `Reasoning:` quando disponibile (stessa forma di `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Quando è true, le esecuzioni Heartbeat usano un contesto di bootstrap leggero e mantengono solo `HEARTBEAT.md` dai file di bootstrap dell’area di lavoro.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Quando è true, ogni Heartbeat viene eseguito in una sessione nuova senza cronologia di conversazione precedente. Usa lo stesso schema di isolamento di Cron `sessionTarget: "isolated"`. Riduce drasticamente il costo in token per Heartbeat. Combinalo con `lightContext: true` per il massimo risparmio. L’instradamento della consegna usa comunque il contesto della sessione principale.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Quando è true, le esecuzioni Heartbeat vengono rimandate su corsie extra occupate: lavoro di sottoagente o comando annidato. Le corsie Cron rimandano sempre gli Heartbeat, anche senza questo flag, così gli host con modelli locali non eseguono prompt Cron e Heartbeat contemporaneamente.
</ParamField>
<ParamField path="session" type="string">
  Chiave di sessione opzionale per le esecuzioni Heartbeat.

- `main` (predefinito): sessione principale dell’agente.
- Chiave di sessione esplicita (copia da `openclaw sessions --json` o dalla [CLI delle sessioni](/it/cli/sessions)).
- Formati delle chiavi di sessione: vedi [Sessioni](/it/concepts/session) e [Gruppi](/it/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: consegna all’ultimo canale esterno usato.
- canale esplicito: qualsiasi canale configurato o id di Plugin, per esempio `discord`, `matrix`, `telegram` o `whatsapp`.
- `none` (predefinito): esegui l’Heartbeat ma **non consegnare** esternamente.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Controlla il comportamento di consegna diretta/DM. `allow`: consenti la consegna Heartbeat diretta/DM. `block`: sopprimi la consegna diretta/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Sostituzione opzionale del destinatario (id specifico del canale, ad esempio E.164 per WhatsApp o un id chat Telegram). Per argomenti/thread Telegram, usa `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id account opzionale per canali multi-account. Quando `target: "last"`, l’id account si applica all’ultimo canale risolto se supporta gli account; altrimenti viene ignorato. Se l’id account non corrisponde a un account configurato per il canale risolto, la consegna viene saltata.

</ParamField>
<ParamField path="prompt" type="string">
  Sovrascrive il corpo del prompt predefinito (non viene fuso).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Numero massimo di caratteri consentiti dopo `HEARTBEAT_OK` prima della consegna.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Quando è true, sopprime i payload di avviso per errori degli strumenti durante le esecuzioni Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Limita le esecuzioni Heartbeat a una finestra temporale. Oggetto con `start` (HH:MM, inclusivo; usa `00:00` per l'inizio della giornata), `end` (HH:MM esclusivo; `24:00` consentito per la fine della giornata) e `timezone` facoltativo.

- Omesso o `"user"`: usa il tuo `agents.defaults.userTimezone` se impostato, altrimenti ripiega sul fuso orario di sistema dell'host.
- `"local"`: usa sempre il fuso orario di sistema dell'host.
- Qualsiasi identificatore IANA (ad es. `America/New_York`): usato direttamente; se non valido, ripiega sul comportamento `"user"` descritto sopra.
- `start` e `end` non devono essere uguali per una finestra attiva; valori uguali sono trattati come larghezza zero (sempre fuori dalla finestra).
- Fuori dalla finestra attiva, gli heartbeat vengono saltati fino al tick successivo dentro la finestra.

</ParamField>

## Comportamento di consegna

<AccordionGroup>
  <Accordion title="Routing di sessione e destinazione">
    - Gli heartbeat vengono eseguiti per impostazione predefinita nella sessione principale dell'agente (`agent:<id>:<mainKey>`), oppure in `global` quando `session.scope = "global"`. Imposta `session` per sovrascrivere su una sessione di canale specifica (Discord/WhatsApp/ecc.).
    - `session` influisce solo sul contesto di esecuzione; la consegna è controllata da `target` e `to`.
    - Per consegnare a un canale/destinatario specifico, imposta `target` + `to`. Con `target: "last"`, la consegna usa l'ultimo canale esterno per quella sessione.
    - Le consegne Heartbeat consentono destinazioni dirette/DM per impostazione predefinita. Imposta `directPolicy: "block"` per sopprimere gli invii a destinazioni dirette continuando comunque a eseguire il turno Heartbeat.
    - Se la coda principale, la lane della sessione di destinazione, la lane cron o un job cron attivo sono occupati, l'heartbeat viene saltato e ritentato più tardi.
    - Se `skipWhenBusy: true`, anche le lane dei subagenti e annidate rimandano le esecuzioni Heartbeat.
    - Se `target` non si risolve in alcuna destinazione esterna, l'esecuzione avviene comunque ma non viene inviato alcun messaggio in uscita.

  </Accordion>
  <Accordion title="Visibilità e comportamento di salto">
    - Se `showOk`, `showAlerts` e `useIndicator` sono tutti disabilitati, l'esecuzione viene saltata subito come `reason=alerts-disabled`.
    - Se è disabilitata solo la consegna degli avvisi, OpenClaw può comunque eseguire l'heartbeat, aggiornare i timestamp delle attività in scadenza, ripristinare il timestamp di inattività della sessione e sopprimere il payload di avviso verso l'esterno.
    - Se la destinazione Heartbeat risolta supporta la digitazione, OpenClaw mostra la digitazione mentre l'esecuzione Heartbeat è attiva. Questo usa la stessa destinazione a cui l'Heartbeat invierebbe l'output della chat ed è disabilitato da `typingMode: "never"`.

  </Accordion>
  <Accordion title="Ciclo di vita della sessione e audit">
    - Le risposte solo Heartbeat **non** mantengono viva la sessione. I metadati Heartbeat possono aggiornare la riga della sessione, ma la scadenza per inattività usa `lastInteractionAt` dell'ultimo messaggio reale dell'utente/canale, e la scadenza giornaliera usa `sessionStartedAt`.
    - La cronologia di Control UI e WebChat nasconde i prompt Heartbeat e le conferme solo OK. La trascrizione della sessione sottostante può comunque contenere quei turni per audit/replay.
    - Le [attività in background](/it/automation/tasks) scollegate possono accodare un evento di sistema e riattivare Heartbeat quando la sessione principale deve notare rapidamente qualcosa. Quella riattivazione non fa eseguire a Heartbeat un'attività in background.

  </Accordion>
</AccordionGroup>

## Controlli di visibilità

Per impostazione predefinita, le conferme `HEARTBEAT_OK` vengono soppresse mentre il contenuto degli avvisi viene consegnato. Puoi regolare questo per canale o per account:

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

Precedenza: per account → per canale → predefiniti del canale → predefiniti integrati.

### Cosa fa ogni flag

- `showOk`: invia una conferma `HEARTBEAT_OK` quando il modello restituisce una risposta solo OK.
- `showAlerts`: invia il contenuto dell'avviso quando il modello restituisce una risposta non OK.
- `useIndicator`: emette eventi indicatore per le superfici di stato della UI.

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

## HEARTBEAT.md (facoltativo)

Se nel workspace esiste un file `HEARTBEAT.md`, il prompt predefinito dice all'agente di leggerlo. Pensalo come la tua "checklist Heartbeat": piccola, stabile e sicura da includere ogni 30 minuti.

Nelle esecuzioni normali, `HEARTBEAT.md` viene iniettato solo quando le indicazioni Heartbeat sono abilitate per l'agente predefinito. Disabilitare la cadenza Heartbeat con `0m` o impostare `includeSystemPromptSection: false` lo omette dal normale contesto di bootstrap.

Se `HEARTBEAT.md` esiste ma è di fatto vuoto (solo righe vuote e intestazioni markdown come `# Heading`), OpenClaw salta l'esecuzione Heartbeat per risparmiare chiamate API. Quel salto viene segnalato come `reason=empty-heartbeat-file`. Se il file manca, l'Heartbeat viene comunque eseguito e il modello decide cosa fare.

Mantienilo minuscolo (breve checklist o promemoria) per evitare di gonfiare il prompt.

Esempio di `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Blocchi `tasks:`

`HEARTBEAT.md` supporta anche un piccolo blocco strutturato `tasks:` per controlli basati su intervalli all'interno dello stesso Heartbeat.

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
    - OpenClaw analizza il blocco `tasks:` e controlla ogni attività rispetto al proprio `interval`.
    - Solo le attività **in scadenza** vengono incluse nel prompt Heartbeat per quel tick.
    - Se non ci sono attività in scadenza, l'Heartbeat viene saltato completamente (`reason=no-tasks-due`) per evitare una chiamata al modello sprecata.
    - Il contenuto non relativo alle attività in `HEARTBEAT.md` viene preservato e aggiunto come contesto aggiuntivo dopo l'elenco delle attività in scadenza.
    - I timestamp dell'ultima esecuzione delle attività sono archiviati nello stato della sessione (`heartbeatTaskState`), quindi gli intervalli sopravvivono ai riavvii normali.
    - I timestamp delle attività vengono avanzati solo dopo che un'esecuzione Heartbeat completa il suo normale percorso di risposta. Le esecuzioni saltate `empty-heartbeat-file` / `no-tasks-due` non contrassegnano le attività come completate.

  </Accordion>
</AccordionGroup>

La modalità attività è utile quando vuoi che un unico file Heartbeat contenga diversi controlli periodici senza pagare per tutti a ogni tick.

### L'agente può aggiornare HEARTBEAT.md?

Sì — se glielo chiedi.

`HEARTBEAT.md` è semplicemente un normale file nel workspace dell'agente, quindi puoi dire all'agente (in una chat normale) qualcosa come:

- "Aggiorna `HEARTBEAT.md` per aggiungere un controllo giornaliero del calendario."
- "Riscrivi `HEARTBEAT.md` in modo che sia più breve e focalizzato sui follow-up della posta in arrivo."

Se vuoi che questo avvenga in modo proattivo, puoi anche includere una riga esplicita nel tuo prompt Heartbeat, ad esempio: "Se la checklist diventa obsoleta, aggiorna HEARTBEAT.md con una migliore."

<Warning>
Non inserire segreti (chiavi API, numeri di telefono, token privati) in `HEARTBEAT.md` — diventa parte del contesto del prompt.
</Warning>

## Riattivazione manuale (su richiesta)

Puoi accodare un evento di sistema e attivare un Heartbeat immediato con:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Se più agenti hanno `heartbeat` configurato, una riattivazione manuale esegue immediatamente ciascuno di quegli heartbeat degli agenti.

Usa `--mode next-heartbeat` per attendere il prossimo tick pianificato.

## Consegna del ragionamento (facoltativa)

Per impostazione predefinita, gli heartbeat consegnano solo il payload finale della "risposta".

Se vuoi trasparenza, abilita:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando è abilitato, gli heartbeat consegneranno anche un messaggio separato con prefisso `Reasoning:` (stessa forma di `/reasoning on`). Questo può essere utile quando l'agente gestisce più sessioni/codex e vuoi vedere perché ha deciso di scriverti, ma può anche divulgare più dettagli interni di quanto desideri. È preferibile tenerlo disattivato nelle chat di gruppo.

## Consapevolezza dei costi

Gli heartbeat eseguono turni completi dell'agente. Intervalli più brevi consumano più token. Per ridurre i costi:

- Usa `isolatedSession: true` per evitare di inviare l'intera cronologia della conversazione (da ~100K token a ~2-5K per esecuzione).
- Usa `lightContext: true` per limitare i file di bootstrap al solo `HEARTBEAT.md`.
- Imposta un `model` più economico (ad es. `ollama/llama3.2:1b`).
- Mantieni `HEARTBEAT.md` piccolo.
- Usa `target: "none"` se vuoi solo aggiornamenti dello stato interno.

## Overflow del contesto dopo Heartbeat

Se un Heartbeat usa un modello locale più piccolo, per esempio un modello Ollama con una finestra da 32k, e il turno successivo della sessione principale segnala overflow del contesto, controlla se l'Heartbeat precedente ha lasciato la sessione sul modello Heartbeat. Il messaggio di reset di OpenClaw lo segnala quando l'ultimo modello di runtime corrisponde al `heartbeat.model` configurato.

Usa `isolatedSession: true` per eseguire gli heartbeat in una sessione nuova, combinalo con `lightContext: true` per il prompt più piccolo, oppure scegli un modello Heartbeat con una finestra di contesto abbastanza grande per la sessione condivisa.

## Correlati

- [Automazione e attività](/it/automation) — tutti i meccanismi di automazione in sintesi
- [Attività in background](/it/automation/tasks) — come viene tracciato il lavoro scollegato
- [Fuso orario](/it/concepts/timezone) — come il fuso orario influisce sulla pianificazione degli heartbeat
- [Risoluzione dei problemi](/it/automation/cron-jobs#troubleshooting) — debug dei problemi di automazione
