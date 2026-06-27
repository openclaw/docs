---
read_when:
    - Regolazione della cadenza o dei messaggi Heartbeat
    - Decidere tra Heartbeat e Cron per le attività pianificate
sidebarTitle: Heartbeat
summary: Messaggi di polling Heartbeat e regole di notifica
title: Heartbeat
x-i18n:
    generated_at: "2026-06-27T17:32:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 415c8f8f18143320a015e44237471b09b8fc091975f78dd9de025310df39645b
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat vs cron?** Consulta [Automazione](/it/automation) per indicazioni su quando usare ciascuno.
</Note>

Heartbeat esegue **turni periodici dell'agente** nella sessione principale, così il modello può far emergere tutto ciò che richiede attenzione senza inviarti spam.

Heartbeat è un turno pianificato della sessione principale: **non** crea record di [attività in background](/it/automation/tasks). I record delle attività sono per lavoro distaccato (esecuzioni ACP, subagenti, job Cron isolati).

Risoluzione dei problemi: [Attività pianificate](/it/automation/cron-jobs#troubleshooting)

## Avvio rapido (principianti)

<Steps>
  <Step title="Pick a cadence">
    Lascia abilitati gli heartbeat (il valore predefinito è `30m`, oppure `1h` per autenticazione Anthropic OAuth/token, incluso il riuso di Claude CLI) o imposta una cadenza personalizzata.
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    Crea una piccola checklist `HEARTBEAT.md` o un blocco `tasks:` nell'area di lavoro dell'agente.
  </Step>
  <Step title="Decide where heartbeat messages should go">
    `target: "none"` è il valore predefinito; imposta `target: "last"` per instradare all'ultimo contatto.
  </Step>
  <Step title="Optional tuning">
    - Abilita la consegna del ragionamento di heartbeat per trasparenza.
    - Usa un contesto di bootstrap leggero se le esecuzioni di heartbeat richiedono solo `HEARTBEAT.md`.
    - Abilita sessioni isolate per evitare di inviare l'intera cronologia della conversazione a ogni heartbeat.
    - Limita gli heartbeat agli orari attivi (ora locale).

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

- Intervallo: `30m` (o `1h` quando la modalità di autenticazione rilevata è Anthropic OAuth/token, incluso il riuso di Claude CLI). Imposta `agents.defaults.heartbeat.every` o `agents.list[].heartbeat.every` per agente; usa `0m` per disabilitare.
- Corpo del prompt (configurabile tramite `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Timeout: i turni heartbeat senza valore impostato usano `agents.defaults.timeoutSeconds` quando è configurato. Altrimenti usano la cadenza heartbeat con un limite massimo di 600 secondi. Imposta `agents.defaults.heartbeat.timeoutSeconds` o `agents.list[].heartbeat.timeoutSeconds` per agente per lavoro heartbeat più lungo.
- Il prompt heartbeat viene inviato **verbatim** come messaggio dell'utente. Il prompt di sistema include una sezione "Heartbeat" solo quando gli heartbeat sono abilitati per l'agente predefinito e l'esecuzione è contrassegnata internamente.
- Quando gli heartbeat sono disabilitati con `0m`, anche le esecuzioni normali omettono `HEARTBEAT.md` dal contesto di bootstrap, così il modello non vede istruzioni solo per heartbeat.
- Gli orari attivi (`heartbeat.activeHours`) vengono verificati nel fuso orario configurato. Fuori dalla finestra, gli heartbeat vengono saltati fino al tick successivo dentro la finestra.
- Gli heartbeat vengono rinviati automaticamente mentre il lavoro Cron è attivo o in coda. Imposta `heartbeat.skipWhenBusy: true` per rinviare anche un agente sulle sue lane di subagente con chiave di sessione o di comandi annidati; gli agenti fratelli non vengono più messi in pausa solo perché un altro agente ha lavoro di subagente in corso.

## A cosa serve il prompt heartbeat

Il prompt predefinito è intenzionalmente ampio:

- **Attività in background**: "Consider outstanding tasks" spinge l'agente a rivedere follow-up (posta in arrivo, calendario, promemoria, lavoro in coda) e a far emergere tutto ciò che è urgente.
- **Check-in umano**: "Checkup sometimes on your human during day time" spinge un messaggio leggero occasionale del tipo "ti serve qualcosa?", ma evita spam notturno usando il fuso orario locale configurato (vedi [Fuso orario](/it/concepts/timezone)).

Heartbeat può reagire ad [attività in background](/it/automation/tasks) completate, ma un'esecuzione heartbeat in sé non crea un record di attività.

Se vuoi che un heartbeat faccia qualcosa di molto specifico (ad esempio "controlla le statistiche Gmail PubSub" o "verifica lo stato del gateway"), imposta `agents.defaults.heartbeat.prompt` (o `agents.list[].heartbeat.prompt`) su un corpo personalizzato (inviato verbatim).

## Contratto di risposta

- Se nulla richiede attenzione, rispondi con **`HEARTBEAT_OK`**.
- Le esecuzioni heartbeat con strumenti disponibili possono invece chiamare `heartbeat_respond` con `notify: false` per nessun aggiornamento visibile, oppure `notify: true` più `notificationText` per un avviso. Quando presente, la risposta strutturata dello strumento ha precedenza sul fallback testuale.
- Durante le esecuzioni heartbeat, OpenClaw tratta `HEARTBEAT_OK` come ack quando appare all'**inizio o alla fine** della risposta. Il token viene rimosso e la risposta viene scartata se il contenuto rimanente è **≤ `ackMaxChars`** (predefinito: 300).
- Se `HEARTBEAT_OK` appare nel **mezzo** di una risposta, non viene trattato in modo speciale.
- Per gli avvisi, **non** includere `HEARTBEAT_OK`; restituisci solo il testo dell'avviso.

Fuori dagli heartbeat, un `HEARTBEAT_OK` accidentale all'inizio/fine di un messaggio viene rimosso e registrato nei log; un messaggio che contiene solo `HEARTBEAT_OK` viene scartato.

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
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Ambito e precedenza

- `agents.defaults.heartbeat` imposta il comportamento heartbeat globale.
- `agents.list[].heartbeat` viene unito sopra; se un agente ha un blocco `heartbeat`, **solo quegli agenti** eseguono heartbeat.
- `channels.defaults.heartbeat` imposta i valori predefiniti di visibilità per tutti i canali.
- `channels.<channel>.heartbeat` sovrascrive i valori predefiniti del canale.
- `channels.<channel>.accounts.<id>.heartbeat` (canali multi-account) sovrascrive le impostazioni per canale.

### Heartbeat per agente

Se una voce `agents.list[]` include un blocco `heartbeat`, **solo quegli agenti** eseguono heartbeat. Il blocco per agente viene unito sopra `agents.defaults.heartbeat` (così puoi impostare una volta i valori predefiniti condivisi e sovrascriverli per agente).

Esempio: due agenti, solo il secondo agente esegue heartbeat.

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

Limita gli heartbeat agli orari lavorativi in un fuso orario specifico:

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

Fuori da questa finestra (prima delle 9:00 o dopo le 22:00 Eastern), gli heartbeat vengono saltati. Il successivo tick pianificato dentro la finestra verrà eseguito normalmente.

### Configurazione 24/7

Se vuoi che gli heartbeat vengano eseguiti tutto il giorno, usa uno di questi pattern:

- Ometti completamente `activeHours` (nessuna restrizione di finestra temporale; questo è il comportamento predefinito).
- Imposta una finestra di giornata completa: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Non impostare la stessa ora per `start` ed `end` (ad esempio da `08:00` a `08:00`). Viene trattata come una finestra di ampiezza zero, quindi gli heartbeat vengono sempre saltati.
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
  Override opzionale del modello per le esecuzioni heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Quando abilitato, consegna anche il messaggio separato `Thinking` quando disponibile (stessa forma di `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Quando true, le esecuzioni heartbeat usano un contesto di bootstrap leggero e mantengono solo `HEARTBEAT.md` dai file di bootstrap dell'area di lavoro.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Quando true, ogni heartbeat viene eseguito in una sessione nuova senza cronologia di conversazione precedente. Usa lo stesso pattern di isolamento di Cron `sessionTarget: "isolated"`. Riduce drasticamente il costo in token per heartbeat. Combina con `lightContext: true` per il massimo risparmio. L'instradamento della consegna usa comunque il contesto della sessione principale.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Quando true, le esecuzioni heartbeat vengono rinviate sulle lane di occupazione aggiuntive di quell'agente: il suo subagente con chiave di sessione o il lavoro di comando annidato. Le lane Cron rinviano sempre gli heartbeat, anche senza questo flag, così gli host con modello locale non eseguono prompt Cron e heartbeat contemporaneamente.
</ParamField>
<ParamField path="session" type="string">
  Chiave di sessione opzionale per le esecuzioni heartbeat.

- `main` (predefinito): sessione principale dell'agente.
- Chiave di sessione esplicita (copia da `openclaw sessions --json` o dalla [CLI delle sessioni](/it/cli/sessions)).
- Formati delle chiavi di sessione: vedi [Sessioni](/it/concepts/session) e [Gruppi](/it/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: consegna all'ultimo canale esterno usato.
- canale esplicito: qualsiasi canale configurato o id Plugin, ad esempio `discord`, `matrix`, `telegram` o `whatsapp`.
- `none` (predefinito): esegue heartbeat ma **non consegna** esternamente.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Controlla il comportamento di consegna diretta/DM. `allow`: consente la consegna heartbeat diretta/DM. `block`: sopprime la consegna diretta/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Override opzionale del destinatario (id specifico del canale, ad esempio E.164 per WhatsApp o un id chat Telegram). Per argomenti/thread Telegram, usa `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  ID account opzionale per canali multi-account. Quando `target: "last"`, l'ID account si applica all'ultimo canale risolto se supporta gli account; altrimenti viene ignorato. Se l'ID account non corrisponde a un account configurato per il canale risolto, la consegna viene saltata.

</ParamField>
<ParamField path="prompt" type="string">
  Sostituisce il corpo del prompt predefinito (non viene unito).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Numero massimo di caratteri consentiti dopo `HEARTBEAT_OK` prima della consegna.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Quando è true, sopprime i payload di avviso per errori degli strumenti durante le esecuzioni Heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Numero massimo di secondi consentiti per un turno agente Heartbeat prima che venga interrotto. Lascia non impostato per usare `agents.defaults.timeoutSeconds` quando impostato; altrimenti usa la cadenza Heartbeat limitata a 600 secondi.

</ParamField>
<ParamField path="activeHours" type="object">
  Limita le esecuzioni Heartbeat a una finestra temporale. Oggetto con `start` (HH:MM, inclusivo; usa `00:00` per l'inizio della giornata), `end` (HH:MM esclusivo; `24:00` consentito per la fine della giornata) e `timezone` opzionale.

- Omesso o `"user"`: usa `agents.defaults.userTimezone` se impostato; altrimenti ricorre al fuso orario del sistema host.
- `"local"`: usa sempre il fuso orario del sistema host.
- Qualsiasi identificatore IANA (ad es. `America/New_York`): usato direttamente; se non valido, ricorre al comportamento `"user"` sopra.
- `start` ed `end` non devono essere uguali per una finestra attiva; valori uguali vengono trattati come larghezza zero (sempre fuori dalla finestra).
- Fuori dalla finestra attiva, gli Heartbeat vengono saltati fino al tick successivo dentro la finestra.

</ParamField>

## Comportamento di consegna

<AccordionGroup>
  <Accordion title="Routing di sessione e destinazione">
    - Gli Heartbeat vengono eseguiti nella sessione principale dell'agente per impostazione predefinita (`agent:<id>:<mainKey>`), oppure in `global` quando `session.scope = "global"`. Imposta `session` per sostituirla con una sessione di canale specifica (Discord/WhatsApp/ecc.).
    - `session` influisce solo sul contesto di esecuzione; la consegna è controllata da `target` e `to`.
    - Per consegnare a un canale/destinatario specifico, imposta `target` + `to`. Con `target: "last"`, la consegna usa l'ultimo canale esterno per quella sessione.
    - Le consegne Heartbeat consentono destinazioni dirette/DM per impostazione predefinita. Imposta `directPolicy: "block"` per sopprimere gli invii a destinazione diretta continuando comunque a eseguire il turno Heartbeat.
    - Se la coda principale, la lane della sessione di destinazione, la lane cron o un job cron attivo è occupato, l'Heartbeat viene saltato e riprovato più tardi.
    - Se `skipWhenBusy: true`, anche il subagent con chiave di sessione di questo agente e le lane annidate rinviano le esecuzioni Heartbeat. Le lane occupate di altri agenti non rinviano questo agente.
    - Se `target` non si risolve in alcuna destinazione esterna, l'esecuzione avviene comunque ma non viene inviato alcun messaggio in uscita.

  </Accordion>
  <Accordion title="Visibilità e comportamento di salto">
    - Se `showOk`, `showAlerts` e `useIndicator` sono tutti disabilitati, l'esecuzione viene saltata in anticipo come `reason=alerts-disabled`.
    - Se è disabilitata solo la consegna degli avvisi, OpenClaw può comunque eseguire l'Heartbeat, aggiornare i timestamp delle attività in scadenza, ripristinare il timestamp di inattività della sessione e sopprimere il payload di avviso verso l'esterno.
    - Se la destinazione Heartbeat risolta supporta la digitazione, OpenClaw mostra la digitazione mentre l'esecuzione Heartbeat è attiva. Questo usa la stessa destinazione a cui l'Heartbeat invierebbe l'output chat ed è disabilitato da `typingMode: "never"`.

  </Accordion>
  <Accordion title="Ciclo di vita e audit della sessione">
    - Le risposte solo Heartbeat **non** mantengono viva la sessione. I metadati Heartbeat possono aggiornare la riga della sessione, ma la scadenza per inattività usa `lastInteractionAt` dall'ultimo messaggio reale utente/canale, e la scadenza giornaliera usa `sessionStartedAt`.
    - La cronologia di Control UI e WebChat nasconde i prompt Heartbeat e gli acknowledgment solo OK. Il transcript della sessione sottostante può comunque contenere quei turni per audit/replay.
    - Le [attività in background](/it/automation/tasks) scollegate possono accodare un evento di sistema e risvegliare Heartbeat quando la sessione principale deve notare rapidamente qualcosa. Quel risveglio non trasforma l'esecuzione Heartbeat in un'attività in background.

  </Accordion>
</AccordionGroup>

## Controlli di visibilità

Per impostazione predefinita, gli acknowledgment `HEARTBEAT_OK` vengono soppressi mentre il contenuto degli avvisi viene consegnato. Puoi regolarlo per canale o per account:

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

Precedenza: per-account → per-canale → valori predefiniti del canale → valori predefiniti integrati.

### Che cosa fa ogni flag

- `showOk`: invia un acknowledgment `HEARTBEAT_OK` quando il modello restituisce una risposta solo OK.
- `showAlerts`: invia il contenuto dell'avviso quando il modello restituisce una risposta non OK.
- `useIndicator`: emette eventi indicatore per le superfici di stato dell'interfaccia utente.

Se **tutti e tre** sono false, OpenClaw salta completamente l'esecuzione Heartbeat (nessuna chiamata al modello).

### Esempi per-canale e per-account

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

| Obiettivo                                | Config                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamento predefinito (OK silenziosi, avvisi attivi) | _(nessuna config necessaria)_                                                            |
| Completamente silenzioso (nessun messaggio, nessun indicatore) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Solo indicatore (nessun messaggio)       | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK in un solo canale                     | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opzionale)

Se nel workspace esiste un file `HEARTBEAT.md`, il prompt predefinito dice all'agente di leggerlo. Consideralo la tua "checklist Heartbeat": piccola, stabile e sicura da considerare ogni 30 minuti.

Nelle esecuzioni normali, `HEARTBEAT.md` viene iniettato solo quando la guida Heartbeat è abilitata per l'agente predefinito. Disabilitare la cadenza Heartbeat con `0m` o impostare `includeSystemPromptSection: false` lo omette dal normale contesto di bootstrap.

Sull'harness Codex nativo, il contenuto di `HEARTBEAT.md` non viene iniettato nel turno. Se il file esiste e ha contenuto non composto solo da spazi, le istruzioni della modalità collaborazione Heartbeat indirizzano Codex al file e gli dicono di leggerlo prima di procedere.

Se `HEARTBEAT.md` esiste ma è di fatto vuoto (solo righe vuote, commenti Markdown/HTML, intestazioni Markdown come `# Heading`, marcatori fence o stub di checklist vuoti), OpenClaw salta l'esecuzione Heartbeat per risparmiare chiamate API. Quel salto viene segnalato come `reason=empty-heartbeat-file`. Se il file manca, l'Heartbeat viene comunque eseguito e il modello decide che cosa fare.

Tienilo minuscolo (breve checklist o promemoria) per evitare gonfiamento del prompt.

Esempio `HEARTBEAT.md`:

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
    - Se nessuna attività è in scadenza, l'Heartbeat viene saltato completamente (`reason=no-tasks-due`) per evitare una chiamata al modello sprecata.
    - Il contenuto non relativo alle attività in `HEARTBEAT.md` viene preservato e aggiunto come contesto aggiuntivo dopo l'elenco delle attività in scadenza.
    - I timestamp dell'ultima esecuzione delle attività sono archiviati nello stato della sessione (`heartbeatTaskState`), quindi gli intervalli sopravvivono ai normali riavvii.
    - I timestamp delle attività vengono avanzati solo dopo che un'esecuzione Heartbeat completa il suo normale percorso di risposta. Le esecuzioni saltate `empty-heartbeat-file` / `no-tasks-due` non contrassegnano le attività come completate.

  </Accordion>
</AccordionGroup>

La modalità attività è utile quando vuoi che un solo file Heartbeat contenga diversi controlli periodici senza pagarli tutti a ogni tick.

### L'agente può aggiornare HEARTBEAT.md?

Sì — se glielo chiedi.

`HEARTBEAT.md` è solo un normale file nel workspace dell'agente, quindi puoi dire all'agente (in una chat normale) qualcosa come:

- "Aggiorna `HEARTBEAT.md` per aggiungere un controllo calendario giornaliero."
- "Riscrivi `HEARTBEAT.md` in modo che sia più breve e focalizzato sui follow-up della posta in arrivo."

Se vuoi che questo avvenga proattivamente, puoi anche includere una riga esplicita nel tuo prompt Heartbeat, ad esempio: "Se la checklist diventa obsoleta, aggiorna HEARTBEAT.md con una migliore."

<Warning>
Non inserire segreti (chiavi API, numeri di telefono, token privati) in `HEARTBEAT.md` — diventa parte del contesto del prompt.
</Warning>

## Risveglio manuale (su richiesta)

Puoi accodare un evento di sistema e attivare un Heartbeat immediato con:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Se più agenti hanno `heartbeat` configurato, un risveglio manuale esegue immediatamente ciascuno di quegli Heartbeat agente.

Usa `--mode next-heartbeat` per attendere il prossimo tick pianificato.

## Consegna del ragionamento (opzionale)

Per impostazione predefinita, gli Heartbeat consegnano solo il payload finale "answer".

Se vuoi trasparenza, abilita:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando abilitato, gli Heartbeat consegneranno anche un messaggio separato con prefisso `Thinking` (stessa forma di `/reasoning on`). Questo può essere utile quando l'agente gestisce più sessioni/codex e vuoi vedere perché ha deciso di scriverti — ma può anche rivelare più dettagli interni di quanto desideri. Preferisci tenerlo disattivato nelle chat di gruppo.

## Consapevolezza dei costi

Gli Heartbeat eseguono turni agente completi. Intervalli più brevi consumano più token. Per ridurre i costi:

- Usa `isolatedSession: true` per evitare di inviare l'intera cronologia della conversazione (~100K token ridotti a ~2-5K per esecuzione).
- Usa `lightContext: true` per limitare i file di bootstrap al solo `HEARTBEAT.md`.
- Imposta un `model` più economico (ad es. `ollama/llama3.2:1b`).
- Mantieni `HEARTBEAT.md` piccolo.
- Usa `target: "none"` se vuoi solo aggiornamenti dello stato interno.

## Overflow del contesto dopo Heartbeat

Se in precedenza un Heartbeat ha lasciato una sessione esistente su un modello locale più piccolo, per esempio un modello Ollama con una finestra da 32k, e il turno successivo della sessione principale segnala overflow del contesto, reimposta il modello runtime della sessione sul modello primario configurato. Il messaggio di reset di OpenClaw lo segnala quando l'ultimo modello runtime corrisponde a `heartbeat.model` configurato.

Gli Heartbeat attuali preservano il modello runtime esistente della sessione condivisa dopo il completamento dell'esecuzione. Puoi comunque usare `isolatedSession: true` per eseguire gli Heartbeat in una nuova sessione, combinarlo con `lightContext: true` per il prompt più piccolo, oppure scegliere un modello Heartbeat con una finestra di contesto abbastanza grande per la sessione condivisa.

## Correlati

- [Automazione](/it/automation) — tutti i meccanismi di automazione in sintesi
- [Attività in background](/it/automation/tasks) — come viene tracciato il lavoro scollegato
- [Fuso orario](/it/concepts/timezone) — come il fuso orario influisce sulla pianificazione degli Heartbeat
- [Risoluzione dei problemi](/it/automation/cron-jobs#troubleshooting) — debug dei problemi di automazione
