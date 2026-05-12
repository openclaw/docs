---
read_when:
    - Regolazione della cadenza dell'Heartbeat o della messaggistica
    - Scegliere tra Heartbeat e Cron per le attività pianificate
sidebarTitle: Heartbeat
summary: Messaggi di polling Heartbeat e regole di notifica
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T23:30:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 247a0fe25ef6e47ec447e6c911ac66af4ab669e15dba886c967250b56e9f1a9c
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat o cron?** Consulta [Automazione](/it/automation) per indicazioni su quando usare ciascuno.
</Note>

Heartbeat esegue **turni periodici dell'agente** nella sessione principale, così il modello può far emergere qualsiasi cosa richieda attenzione senza inviarti spam.

Heartbeat è un turno pianificato nella sessione principale: **non** crea record di [attività in background](/it/automation/tasks). I record delle attività sono per lavoro scollegato (esecuzioni ACP, sottoagenti, processi cron isolati).

Risoluzione dei problemi: [Attività pianificate](/it/automation/cron-jobs#troubleshooting)

## Avvio rapido (principianti)

<Steps>
  <Step title="Scegli una cadenza">
    Lascia abilitati gli heartbeat (il valore predefinito è `30m`, oppure `1h` per l'autenticazione OAuth/token di Anthropic, incluso il riuso di Claude CLI) oppure imposta la tua cadenza.
  </Step>
  <Step title="Aggiungi HEARTBEAT.md (facoltativo)">
    Crea una piccola checklist `HEARTBEAT.md` o un blocco `tasks:` nell'area di lavoro dell'agente.
  </Step>
  <Step title="Decidi dove devono andare i messaggi di heartbeat">
    `target: "none"` è il valore predefinito; imposta `target: "last"` per instradare all'ultimo contatto.
  </Step>
  <Step title="Regolazione facoltativa">
    - Abilita la consegna del ragionamento di heartbeat per trasparenza.
    - Usa un contesto di bootstrap leggero se le esecuzioni di heartbeat hanno bisogno solo di `HEARTBEAT.md`.
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
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Valori predefiniti

- Intervallo: `30m` (oppure `1h` quando l'autenticazione OAuth/token di Anthropic è la modalità di autenticazione rilevata, incluso il riuso di Claude CLI). Imposta `agents.defaults.heartbeat.every` o `agents.list[].heartbeat.every` per agente; usa `0m` per disabilitare.
- Corpo del prompt (configurabile tramite `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Il prompt di heartbeat viene inviato **alla lettera** come messaggio dell'utente. Il prompt di sistema include una sezione "Heartbeat" solo quando gli heartbeat sono abilitati per l'agente predefinito e l'esecuzione è contrassegnata internamente.
- Quando gli heartbeat sono disabilitati con `0m`, anche le esecuzioni normali omettono `HEARTBEAT.md` dal contesto di bootstrap, così il modello non vede istruzioni valide solo per heartbeat.
- Gli orari attivi (`heartbeat.activeHours`) vengono controllati nel fuso orario configurato. Fuori dalla finestra, gli heartbeat vengono saltati fino al tick successivo dentro la finestra.
- Gli heartbeat vengono rinviati automaticamente mentre un lavoro cron è attivo o in coda. Imposta `heartbeat.skipWhenBusy: true` per rinviare anche un agente sulle proprie lane di sottoagente o comandi annidati basate sulla chiave di sessione; gli agenti sibling non vengono più messi in pausa solo perché un altro agente ha lavoro di sottoagente in corso.

## A cosa serve il prompt di heartbeat

Il prompt predefinito è intenzionalmente ampio:

- **Attività in background**: "Considera le attività in sospeso" spinge l'agente a rivedere i follow-up (inbox, calendario, promemoria, lavoro in coda) e a far emergere qualsiasi cosa urgente.
- **Check-in umano**: "Controlla a volte il tuo umano durante il giorno" spinge a inviare occasionalmente un messaggio leggero del tipo "ti serve qualcosa?", ma evita lo spam notturno usando il fuso orario locale configurato (vedi [Fuso orario](/it/concepts/timezone)).

Heartbeat può reagire alle [attività in background](/it/automation/tasks) completate, ma un'esecuzione di heartbeat di per sé non crea un record di attività.

Se vuoi che un heartbeat faccia qualcosa di molto specifico (ad esempio "controlla le statistiche Gmail PubSub" o "verifica lo stato del gateway"), imposta `agents.defaults.heartbeat.prompt` (o `agents.list[].heartbeat.prompt`) su un corpo personalizzato (inviato alla lettera).

## Contratto della risposta

- Se nulla richiede attenzione, rispondi con **`HEARTBEAT_OK`**.
- Le esecuzioni di heartbeat con capacità di usare strumenti possono invece chiamare `heartbeat_respond` con `notify: false` per nessun aggiornamento visibile, oppure `notify: true` più `notificationText` per un avviso. Quando presente, la risposta strutturata dello strumento ha precedenza sul fallback testuale.
- Durante le esecuzioni di heartbeat, OpenClaw tratta `HEARTBEAT_OK` come un ack quando compare all'**inizio o alla fine** della risposta. Il token viene rimosso e la risposta viene scartata se il contenuto rimanente è **≤ `ackMaxChars`** (predefinito: 300).
- Se `HEARTBEAT_OK` compare nel **mezzo** di una risposta, non viene trattato in modo speciale.
- Per gli avvisi, **non** includere `HEARTBEAT_OK`; restituisci solo il testo dell'avviso.

Fuori dagli heartbeat, un `HEARTBEAT_OK` indesiderato all'inizio/fine di un messaggio viene rimosso e registrato; un messaggio che contiene solo `HEARTBEAT_OK` viene scartato.

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

- `agents.defaults.heartbeat` imposta il comportamento globale degli Heartbeat.
- `agents.list[].heartbeat` si combina con le impostazioni globali; se un agente ha un blocco `heartbeat`, **solo quegli agenti** eseguono gli Heartbeat.
- `channels.defaults.heartbeat` imposta le impostazioni predefinite di visibilità per tutti i canali.
- `channels.<channel>.heartbeat` sovrascrive le impostazioni predefinite del canale.
- `channels.<channel>.accounts.<id>.heartbeat` (canali multi-account) sovrascrive le impostazioni per canale.

### Heartbeat per agente

Se una qualsiasi voce `agents.list[]` include un blocco `heartbeat`, **solo quegli agenti** eseguono gli Heartbeat. Il blocco per agente si combina con `agents.defaults.heartbeat` (così puoi impostare una sola volta le impostazioni predefinite condivise e sovrascriverle per agente).

Esempio: due agenti, solo il secondo agente esegue gli Heartbeat.

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

Se vuoi che gli Heartbeat vengano eseguiti tutto il giorno, usa uno di questi pattern:

- Ometti completamente `activeHours` (nessuna restrizione di finestra temporale; questo è il comportamento predefinito).
- Imposta una finestra di un'intera giornata: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Non impostare lo stesso orario di `start` e `end` (ad esempio da `08:00` a `08:00`). Questo viene trattato come una finestra di ampiezza zero, quindi gli Heartbeat vengono sempre saltati.
</Warning>

### Esempio multi-account

Usa `accountId` per indirizzare un account specifico sui canali multi-account come Telegram:

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

### Note sul campo

<ParamField path="every" type="string">
  Intervallo Heartbeat (stringa di durata; unità predefinita = minuti).
</ParamField>
<ParamField path="model" type="string">
  Override opzionale del modello per le esecuzioni Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Se abilitato, invia anche il messaggio separato `Reasoning:` quando disponibile (stessa forma di `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Quando è true, le esecuzioni Heartbeat usano un contesto di bootstrap leggero e mantengono solo `HEARTBEAT.md` dai file di bootstrap del workspace.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Quando è true, ogni Heartbeat viene eseguito in una nuova sessione senza cronologia di conversazione precedente. Usa lo stesso modello di isolamento di cron `sessionTarget: "isolated"`. Riduce drasticamente il costo in token per Heartbeat. Combinalo con `lightContext: true` per il massimo risparmio. L'instradamento della consegna usa comunque il contesto della sessione principale.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Quando è true, le esecuzioni Heartbeat vengono rinviate nelle corsie extra occupate dell'agente: il relativo subagente con chiave di sessione o il lavoro di comandi annidati. Le corsie Cron rinviano sempre gli Heartbeat, anche senza questo flag, quindi gli host con modello locale non eseguono prompt Cron e Heartbeat contemporaneamente.
</ParamField>
<ParamField path="session" type="string">
  Chiave di sessione opzionale per le esecuzioni Heartbeat.

- `main` (predefinito): sessione principale dell'agente.
- Chiave di sessione esplicita (copiala da `openclaw sessions --json` o dalla [CLI delle sessioni](/it/cli/sessions)).
- Formati delle chiavi di sessione: vedi [Sessioni](/it/concepts/session) e [Gruppi](/it/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: consegna all'ultimo canale esterno usato.
- canale esplicito: qualsiasi canale configurato o id Plugin, ad esempio `discord`, `matrix`, `telegram` o `whatsapp`.
- `none` (predefinito): esegue l'Heartbeat ma **non consegna** esternamente.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Controlla il comportamento di consegna diretta/DM. `allow`: consente la consegna Heartbeat diretta/DM. `block`: sopprime la consegna diretta/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Override opzionale del destinatario (id specifico del canale, ad esempio E.164 per WhatsApp o un id chat Telegram). Per argomenti/thread Telegram, usa `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id account opzionale per canali multi-account. Quando `target: "last"`, l'id account si applica all'ultimo canale risolto se supporta gli account; altrimenti viene ignorato. Se l'id account non corrisponde a un account configurato per il canale risolto, la consegna viene saltata.

</ParamField>
<ParamField path="prompt" type="string">
  Sovrascrive il corpo del prompt predefinito (non viene unito).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Numero massimo di caratteri consentiti dopo `HEARTBEAT_OK` prima della consegna.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Quando è true, sopprime i payload di avviso per errori degli strumenti durante le esecuzioni Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Limita le esecuzioni Heartbeat a una finestra temporale. Oggetto con `start` (HH:MM, inclusivo; usa `00:00` per l'inizio della giornata), `end` (HH:MM esclusivo; `24:00` consentito per la fine della giornata) e `timezone` facoltativo.

- Omesso o `"user"`: usa `agents.defaults.userTimezone` se impostato, altrimenti ripiega sul fuso orario del sistema host.
- `"local"`: usa sempre il fuso orario del sistema host.
- Qualsiasi identificatore IANA (ad es. `America/New_York`): usato direttamente; se non valido, ripiega sul comportamento `"user"` descritto sopra.
- `start` e `end` non devono essere uguali per una finestra attiva; valori uguali sono trattati come larghezza zero (sempre fuori dalla finestra).
- Fuori dalla finestra attiva, gli Heartbeat vengono saltati fino al tick successivo all'interno della finestra.

</ParamField>

## Comportamento di consegna

<AccordionGroup>
  <Accordion title="Routing di sessione e destinazione">
    - Gli Heartbeat vengono eseguiti per impostazione predefinita nella sessione principale dell'agente (`agent:<id>:<mainKey>`), oppure in `global` quando `session.scope = "global"`. Imposta `session` per sovrascrivere verso una sessione di canale specifica (Discord/WhatsApp/ecc.).
    - `session` influisce solo sul contesto di esecuzione; la consegna è controllata da `target` e `to`.
    - Per consegnare a un canale/destinatario specifico, imposta `target` + `to`. Con `target: "last"`, la consegna usa l'ultimo canale esterno per quella sessione.
    - Le consegne Heartbeat consentono per impostazione predefinita destinazioni dirette/DM. Imposta `directPolicy: "block"` per sopprimere gli invii a destinazioni dirette continuando comunque a eseguire il turno Heartbeat.
    - Se la coda principale, la corsia della sessione di destinazione, la corsia cron o un processo cron attivo è occupato, l'Heartbeat viene saltato e ritentato più tardi.
    - Se `skipWhenBusy: true`, anche il subagente di questo agente basato sulla chiave di sessione e le corsie annidate rinviano le esecuzioni Heartbeat. Le corsie occupate di altri agenti non rinviano questo agente.
    - Se `target` non si risolve in nessuna destinazione esterna, l'esecuzione avviene comunque ma non viene inviato alcun messaggio in uscita.

  </Accordion>
  <Accordion title="Visibilità e comportamento di salto">
    - Se `showOk`, `showAlerts` e `useIndicator` sono tutti disabilitati, l'esecuzione viene saltata in anticipo come `reason=alerts-disabled`.
    - Se è disabilitata solo la consegna degli avvisi, OpenClaw può comunque eseguire l'Heartbeat, aggiornare i timestamp delle attività in scadenza, ripristinare il timestamp di inattività della sessione e sopprimere il payload di avviso verso l'esterno.
    - Se la destinazione Heartbeat risolta supporta la digitazione, OpenClaw mostra la digitazione mentre l'esecuzione Heartbeat è attiva. Questo usa la stessa destinazione a cui l'Heartbeat invierebbe l'output della chat ed è disabilitato da `typingMode: "never"`.

  </Accordion>
  <Accordion title="Ciclo di vita della sessione e audit">
    - Le risposte solo Heartbeat **non** mantengono viva la sessione. I metadati Heartbeat possono aggiornare la riga della sessione, ma la scadenza per inattività usa `lastInteractionAt` dell'ultimo vero messaggio utente/canale, e la scadenza giornaliera usa `sessionStartedAt`.
    - La cronologia dell'interfaccia di controllo e di WebChat nasconde i prompt Heartbeat e le conferme solo OK. La trascrizione sottostante della sessione può comunque contenere quei turni per audit/riproduzione.
    - Le [attività in background](/it/automation/tasks) scollegate possono accodare un evento di sistema e riattivare Heartbeat quando la sessione principale deve notare qualcosa rapidamente. Quella riattivazione non fa sì che l'Heartbeat esegua un'attività in background.

  </Accordion>
</AccordionGroup>

## Controlli di visibilità

Per impostazione predefinita, le conferme `HEARTBEAT_OK` sono soppresse mentre il contenuto degli avvisi viene consegnato. Puoi regolare questo comportamento per canale o per account:

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

Precedenza: per account → per canale → valori predefiniti del canale → valori predefiniti integrati.

### Che cosa fa ogni flag

- `showOk`: invia una conferma `HEARTBEAT_OK` quando il modello restituisce una risposta solo OK.
- `showAlerts`: invia il contenuto dell'avviso quando il modello restituisce una risposta non OK.
- `useIndicator`: emette eventi indicatore per le superfici di stato dell'interfaccia utente.

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

### Schemi comuni

| Obiettivo                                | Configurazione                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamento predefinito (OK silenziosi, avvisi attivi) | _(nessuna configurazione necessaria)_                                                     |
| Completamente silenzioso (nessun messaggio, nessun indicatore) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Solo indicatore (nessun messaggio)       | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK in un solo canale                     | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (facoltativo)

Se nel workspace esiste un file `HEARTBEAT.md`, il prompt predefinito indica all'agente di leggerlo. Consideralo la tua "checklist Heartbeat": piccola, stabile e sicura da includere ogni 30 minuti.

Nelle esecuzioni normali, `HEARTBEAT.md` viene iniettato solo quando la guida Heartbeat è abilitata per l'agente predefinito. Disabilitare la cadenza Heartbeat con `0m` o impostare `includeSystemPromptSection: false` lo omette dal normale contesto di bootstrap.

Se `HEARTBEAT.md` esiste ma è di fatto vuoto (solo righe vuote e intestazioni markdown come `# Heading`), OpenClaw salta l'esecuzione Heartbeat per risparmiare chiamate API. Quel salto viene riportato come `reason=empty-heartbeat-file`. Se il file manca, l'Heartbeat viene comunque eseguito e il modello decide cosa fare.

Mantienilo minuscolo (breve checklist o promemoria) per evitare il rigonfiamento del prompt.

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

La modalità attività è utile quando vuoi che un solo file Heartbeat contenga diversi controlli periodici senza pagare per tutti a ogni tick.

### L'agente può aggiornare HEARTBEAT.md?

Sì — se glielo chiedi.

`HEARTBEAT.md` è solo un normale file nel workspace dell'agente, quindi puoi dire all'agente (in una normale chat) qualcosa come:

- "Aggiorna `HEARTBEAT.md` per aggiungere un controllo giornaliero del calendario."
- "Riscrivi `HEARTBEAT.md` in modo che sia più breve e focalizzato sui follow-up della posta in arrivo."

Se vuoi che questo avvenga in modo proattivo, puoi anche includere una riga esplicita nel tuo prompt Heartbeat come: "Se la checklist diventa obsoleta, aggiorna HEARTBEAT.md con una migliore."

<Warning>
Non inserire segreti (chiavi API, numeri di telefono, token privati) in `HEARTBEAT.md` — diventa parte del contesto del prompt.
</Warning>

## Riattivazione manuale (su richiesta)

Puoi accodare un evento di sistema e attivare un Heartbeat immediato con:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Se più agenti hanno `heartbeat` configurato, una riattivazione manuale esegue immediatamente ciascuno di questi Heartbeat degli agenti.

Usa `--mode next-heartbeat` per attendere il prossimo tick programmato.

## Consegna del ragionamento (facoltativa)

Per impostazione predefinita, gli Heartbeat consegnano solo il payload finale della "risposta".

Se vuoi trasparenza, abilita:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando è abilitato, gli Heartbeat consegneranno anche un messaggio separato con prefisso `Reasoning:` (stessa forma di `/reasoning on`). Questo può essere utile quando l'agente gestisce più sessioni/codex e vuoi vedere perché ha deciso di contattarti, ma può anche esporre più dettagli interni di quanti ne desideri. È preferibile mantenerlo disattivato nelle chat di gruppo.

## Consapevolezza dei costi

Gli Heartbeat eseguono turni completi dell'agente. Intervalli più brevi consumano più token. Per ridurre i costi:

- Usa `isolatedSession: true` per evitare di inviare l'intera cronologia della conversazione (da circa 100K token a circa 2-5K per esecuzione).
- Usa `lightContext: true` per limitare i file di bootstrap al solo `HEARTBEAT.md`.
- Imposta un `model` più economico (ad es. `ollama/llama3.2:1b`).
- Mantieni `HEARTBEAT.md` piccolo.
- Usa `target: "none"` se vuoi solo aggiornamenti dello stato interno.

## Overflow del contesto dopo Heartbeat

Se in precedenza un Heartbeat ha lasciato una sessione esistente su un modello locale più piccolo, ad esempio un modello Ollama con una finestra da 32k, e il turno successivo della sessione principale segnala overflow del contesto, reimposta il modello runtime della sessione sul modello primario configurato. Il messaggio di reset di OpenClaw lo segnala quando l'ultimo modello runtime corrisponde a `heartbeat.model` configurato.

Gli Heartbeat attuali preservano il modello runtime esistente della sessione condivisa dopo il completamento dell'esecuzione. Puoi comunque usare `isolatedSession: true` per eseguire gli Heartbeat in una sessione nuova, combinarlo con `lightContext: true` per il prompt più piccolo, oppure scegliere un modello Heartbeat con una finestra di contesto abbastanza grande per la sessione condivisa.

## Correlati

- [Automazione](/it/automation) — tutti i meccanismi di automazione in sintesi
- [Attività in background](/it/automation/tasks) — come viene tracciato il lavoro scollegato
- [Fuso orario](/it/concepts/timezone) — come il fuso orario influisce sulla pianificazione Heartbeat
- [Risoluzione dei problemi](/it/automation/cron-jobs#troubleshooting) — debug dei problemi di automazione
