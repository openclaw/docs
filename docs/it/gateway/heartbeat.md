---
read_when:
    - Regolare la cadenza o la messaggistica di Heartbeat
    - Decidere tra Heartbeat e Cron per le attività pianificate
sidebarTitle: Heartbeat
summary: Messaggi di polling Heartbeat e regole di notifica
title: Heartbeat
x-i18n:
    generated_at: "2026-04-26T11:28:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0d3e9c531062d90e8e24cb7795fed20bc0985c3eadc8ed367295fc2544d14e
    source_path: gateway/heartbeat.md
    workflow: 15
---

<Note>
**Heartbeat o Cron?** Vedi [Automazione e attività](/it/automation) per indicazioni su quando usare ciascuno.
</Note>

Heartbeat esegue **turni periodici dell'agente** nella sessione principale, così il modello può segnalare tutto ciò che richiede attenzione senza tempestarti di messaggi.

Heartbeat è un turno pianificato della sessione principale: **non** crea record di [attività in background](/it/automation/tasks). I record delle attività servono per lavoro scollegato (esecuzioni ACP, sottoagenti, processi Cron isolati).

Risoluzione dei problemi: [Attività pianificate](/it/automation/cron-jobs#troubleshooting)

## Avvio rapido (principianti)

<Steps>
  <Step title="Scegli una cadenza">
    Lascia gli heartbeat abilitati (il valore predefinito è `30m`, oppure `1h` per autenticazione Anthropic OAuth/token, incluso il riuso di Claude CLI) oppure imposta la tua cadenza.
  </Step>
  <Step title="Aggiungi HEARTBEAT.md (facoltativo)">
    Crea un piccolo elenco di controllo `HEARTBEAT.md` o un blocco `tasks:` nel workspace dell'agente.
  </Step>
  <Step title="Decidi dove devono andare i messaggi heartbeat">
    `target: "none"` è il valore predefinito; imposta `target: "last"` per instradarli all'ultimo contatto.
  </Step>
  <Step title="Ottimizzazione facoltativa">
    - Abilita la consegna del ragionamento heartbeat per una maggiore trasparenza.
    - Usa un contesto bootstrap leggero se le esecuzioni heartbeat hanno bisogno solo di `HEARTBEAT.md`.
    - Abilita sessioni isolate per evitare di inviare l'intera cronologia della conversazione a ogni heartbeat.
    - Limita gli heartbeat alle ore attive (ora locale).
  </Step>
</Steps>

Esempio di configurazione:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // consegna esplicita all'ultimo contatto (il valore predefinito è "none")
        directPolicy: "allow", // predefinito: consente target diretti/DM; imposta "block" per sopprimere
        lightContext: true, // facoltativo: inietta solo HEARTBEAT.md dai file bootstrap
        isolatedSession: true, // facoltativo: nuova sessione a ogni esecuzione (nessuna cronologia conversazione)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // facoltativo: invia anche un messaggio separato `Reasoning:`
      },
    },
  },
}
```

## Valori predefiniti

- Intervallo: `30m` (oppure `1h` quando la modalità auth rilevata è Anthropic OAuth/token, incluso il riuso di Claude CLI). Imposta `agents.defaults.heartbeat.every` oppure `agents.list[].heartbeat.every`; usa `0m` per disabilitare.
- Corpo del prompt (configurabile tramite `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Il prompt heartbeat viene inviato **verbatim** come messaggio utente. Il prompt di sistema include una sezione "Heartbeat" solo quando gli heartbeat sono abilitati per l'agente predefinito, e l'esecuzione è contrassegnata internamente.
- Quando gli heartbeat sono disabilitati con `0m`, le esecuzioni normali omettono anche `HEARTBEAT.md` dal contesto bootstrap così il modello non vede istruzioni solo-heartbeat.
- Le ore attive (`heartbeat.activeHours`) vengono controllate nella timezone configurata. Fuori dalla finestra, gli heartbeat vengono saltati fino al tick successivo all'interno della finestra.

## A cosa serve il prompt heartbeat

Il prompt predefinito è intenzionalmente ampio:

- **Attività in background**: "Consider outstanding tasks" spinge l'agente a rivedere i followup (posta in arrivo, calendario, promemoria, lavoro in coda) e segnalare tutto ciò che è urgente.
- **Check-in umano**: "Checkup sometimes on your human during day time" incoraggia un occasionale messaggio leggero del tipo "hai bisogno di qualcosa?", ma evita spam notturno usando la tua timezone locale configurata (vedi [Timezone](/it/concepts/timezone)).

Heartbeat può reagire a [attività in background](/it/automation/tasks) completate, ma un'esecuzione heartbeat di per sé non crea un record attività.

Se vuoi che un heartbeat faccia qualcosa di molto specifico (ad esempio "controlla le statistiche Gmail PubSub" oppure "verifica lo stato del gateway"), imposta `agents.defaults.heartbeat.prompt` (oppure `agents.list[].heartbeat.prompt`) su un corpo personalizzato (inviato verbatim).

## Contratto di risposta

- Se non c'è nulla che richieda attenzione, rispondi con **`HEARTBEAT_OK`**.
- Durante le esecuzioni heartbeat, OpenClaw tratta `HEARTBEAT_OK` come un ack quando compare **all'inizio o alla fine** della risposta. Il token viene rimosso e la risposta viene scartata se il contenuto rimanente è **≤ `ackMaxChars`** (predefinito: 300).
- Se `HEARTBEAT_OK` compare **nel mezzo** di una risposta, non viene trattato in modo speciale.
- Per gli avvisi, **non** includere `HEARTBEAT_OK`; restituisci solo il testo dell'avviso.

Fuori dagli heartbeat, un `HEARTBEAT_OK` accidentale all'inizio/fine di un messaggio viene rimosso e registrato nei log; un messaggio che contiene solo `HEARTBEAT_OK` viene scartato.

## Configurazione

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // predefinito: 30m (0m disabilita)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // predefinito: false (consegna un messaggio separato Reasoning: quando disponibile)
        lightContext: false, // predefinito: false; true mantiene solo HEARTBEAT.md dai file bootstrap del workspace
        isolatedSession: false, // predefinito: false; true esegue ogni heartbeat in una nuova sessione (nessuna cronologia conversazione)
        target: "last", // predefinito: none | opzioni: last | none | <channel id> (core o Plugin, ad es. "bluebubbles")
        to: "+15551234567", // override facoltativo specifico del canale
        accountId: "ops-bot", // id canale multi-account facoltativo
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // numero massimo di caratteri consentiti dopo HEARTBEAT_OK
      },
    },
  },
}
```

### Ambito e precedenza

- `agents.defaults.heartbeat` imposta il comportamento globale di Heartbeat.
- `agents.list[].heartbeat` viene unito sopra; se un agente ha un blocco `heartbeat`, **solo quegli agenti** eseguono heartbeat.
- `channels.defaults.heartbeat` imposta i valori predefiniti di visibilità per tutti i canali.
- `channels.<channel>.heartbeat` sovrascrive i valori predefiniti del canale.
- `channels.<channel>.accounts.<id>.heartbeat` (canali multi-account) sovrascrive le impostazioni per canale.

### Heartbeat per agente

Se una qualsiasi voce `agents.list[]` include un blocco `heartbeat`, **solo quegli agenti** eseguono heartbeat. Il blocco per agente viene unito sopra `agents.defaults.heartbeat` (così puoi impostare una volta i valori predefiniti condivisi e poi sovrascriverli per agente).

Esempio: due agenti, solo il secondo esegue heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // consegna esplicita all'ultimo contatto (il valore predefinito è "none")
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

Limita gli heartbeat all'orario lavorativo in una timezone specifica:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // consegna esplicita all'ultimo contatto (il valore predefinito è "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // facoltativo; usa userTimezone se impostato, altrimenti la timezone dell'host
        },
      },
    },
  },
}
```

Fuori da questa finestra (prima delle 9:00 o dopo le 22:00 Eastern), gli heartbeat vengono saltati. Il tick pianificato successivo all'interno della finestra verrà eseguito normalmente.

### Configurazione 24/7

Se vuoi che gli heartbeat vengano eseguiti tutto il giorno, usa uno di questi schemi:

- Ometti completamente `activeHours` (nessuna restrizione di finestra temporale; questo è il comportamento predefinito).
- Imposta una finestra di un'intera giornata: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Non impostare la stessa ora per `start` ed `end` (ad esempio `08:00` fino a `08:00`). Viene trattata come una finestra di ampiezza zero, quindi gli heartbeat vengono sempre saltati.
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
          to: "12345678:topic:42", // facoltativo: instrada verso un topic/thread specifico
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
  Intervallo Heartbeat (stringa durata; unità predefinita = minuti).
</ParamField>
<ParamField path="model" type="string">
  Override facoltativo del modello per le esecuzioni heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Quando abilitato, consegna anche il messaggio separato `Reasoning:` quando disponibile (stessa forma di `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Quando true, le esecuzioni heartbeat usano un contesto bootstrap leggero e mantengono solo `HEARTBEAT.md` dai file bootstrap del workspace.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Quando true, ogni heartbeat viene eseguito in una nuova sessione senza cronologia conversazionale precedente. Usa lo stesso schema di isolamento di Cron `sessionTarget: "isolated"`. Riduce drasticamente il costo in token per heartbeat. Combinalo con `lightContext: true` per il massimo risparmio. Il routing di consegna continua comunque a usare il contesto della sessione principale.
</ParamField>
<ParamField path="session" type="string">
  Chiave di sessione facoltativa per le esecuzioni heartbeat.

  - `main` (predefinito): sessione principale dell'agente.
  - Chiave di sessione esplicita (copiala da `openclaw sessions --json` o dalla [CLI sessions](/it/cli/sessions)).
  - Formati della chiave di sessione: vedi [Sessioni](/it/concepts/session) e [Gruppi](/it/channels/groups).
</ParamField>
<ParamField path="target" type="string">
  - `last`: consegna all'ultimo canale esterno usato.
  - canale esplicito: qualsiasi canale configurato o id Plugin, per esempio `discord`, `matrix`, `telegram` o `whatsapp`.
  - `none` (predefinito): esegue l'heartbeat ma **non lo consegna** esternamente.
</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Controlla il comportamento di consegna diretta/DM. `allow`: consente la consegna heartbeat diretta/DM. `block`: sopprime la consegna diretta/DM (`reason=dm-blocked`).
</ParamField>
<ParamField path="to" type="string">
  Override facoltativo del destinatario (id specifico del canale, ad es. E.164 per WhatsApp o un id chat Telegram). Per topic/thread Telegram, usa `<chatId>:topic:<messageThreadId>`.
</ParamField>
<ParamField path="accountId" type="string">
  ID account facoltativo per canali multi-account. Quando `target: "last"`, l'id account si applica all'ultimo canale risolto se supporta account; altrimenti viene ignorato. Se l'id account non corrisponde a un account configurato per il canale risolto, la consegna viene saltata.
</ParamField>
<ParamField path="prompt" type="string">
  Sovrascrive il corpo del prompt predefinito (non viene unito).
</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Numero massimo di caratteri consentiti dopo `HEARTBEAT_OK` prima della consegna.
</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Quando true, sopprime i payload di avviso di errore degli strumenti durante le esecuzioni heartbeat.
</ParamField>
<ParamField path="activeHours" type="object">
  Limita le esecuzioni heartbeat a una finestra temporale. Oggetto con `start` (HH:MM, inclusivo; usa `00:00` per l'inizio del giorno), `end` (HH:MM esclusivo; `24:00` consentito per la fine del giorno) e `timezone` facoltativa.

  - Ometti oppure `"user"`: usa `agents.defaults.userTimezone` se impostato, altrimenti usa come fallback la timezone del sistema host.
  - `"local"`: usa sempre la timezone del sistema host.
  - Qualsiasi identificatore IANA (ad es. `America/New_York`): viene usato direttamente; se non è valido, si usa come fallback il comportamento `"user"` sopra.
  - `start` ed `end` non devono essere uguali per una finestra attiva; valori uguali sono trattati come ampiezza zero (sempre fuori dalla finestra).
  - Fuori dalla finestra attiva, gli heartbeat vengono saltati fino al tick successivo all'interno della finestra.
</ParamField>

## Comportamento di consegna

<AccordionGroup>
  <Accordion title="Routing di sessione e target">
    - Gli heartbeat vengono eseguiti nella sessione principale dell'agente per impostazione predefinita (`agent:<id>:<mainKey>`), oppure `global` quando `session.scope = "global"`. Imposta `session` per sovrascrivere con una sessione di canale specifica (Discord/WhatsApp/ecc.).
    - `session` influisce solo sul contesto dell'esecuzione; la consegna è controllata da `target` e `to`.
    - Per consegnare a un canale/destinatario specifico, imposta `target` + `to`. Con `target: "last"`, la consegna usa l'ultimo canale esterno di quella sessione.
    - Le consegne heartbeat consentono i target diretti/DM per impostazione predefinita. Imposta `directPolicy: "block"` per sopprimere gli invii verso target diretti pur continuando a eseguire il turno heartbeat.
    - Se la queue principale è occupata, l'heartbeat viene saltato e ritentato più tardi.
    - Se `target` non si risolve in alcuna destinazione esterna, l'esecuzione avviene comunque ma non viene inviato alcun messaggio in uscita.
  </Accordion>
  <Accordion title="Visibilità e comportamento di salto">
    - Se `showOk`, `showAlerts` e `useIndicator` sono tutti disabilitati, l'esecuzione viene saltata subito con `reason=alerts-disabled`.
    - Se è disabilitata solo la consegna degli avvisi, OpenClaw può comunque eseguire l'heartbeat, aggiornare i timestamp delle attività dovute, ripristinare il timestamp idle della sessione e sopprimere il payload esterno dell'avviso.
    - Se il target heartbeat risolto supporta l'indicatore di digitazione, OpenClaw mostra che sta digitando mentre l'esecuzione heartbeat è attiva. Questo usa lo stesso target a cui l'heartbeat invierebbe l'output chat ed è disabilitato da `typingMode: "never"`.
  </Accordion>
  <Accordion title="Ciclo di vita della sessione e audit">
    - Le risposte solo-heartbeat **non** mantengono viva la sessione. I metadati heartbeat possono aggiornare la riga della sessione, ma la scadenza per inattività usa `lastInteractionAt` dell'ultimo messaggio reale utente/canale, e la scadenza giornaliera usa `sessionStartedAt`.
    - La cronologia di Control UI e WebChat nasconde i prompt heartbeat e gli acknowledgment solo-OK. Il transcript di sessione sottostante può comunque contenere quei turni per audit/replay.
    - Le [attività in background](/it/automation/tasks) scollegate possono accodare un evento di sistema e risvegliare Heartbeat quando la sessione principale dovrebbe notare qualcosa rapidamente. Questo risveglio non trasforma l'esecuzione heartbeat in un'attività in background.
  </Accordion>
</AccordionGroup>

## Controlli di visibilità

Per impostazione predefinita, gli acknowledgment `HEARTBEAT_OK` vengono soppressi mentre il contenuto degli avvisi viene consegnato. Puoi regolare questo comportamento per canale o per account:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Nascondi HEARTBEAT_OK (predefinito)
      showAlerts: true # Mostra i messaggi di avviso (predefinito)
      useIndicator: true # Emetti eventi indicatore (predefinito)
  telegram:
    heartbeat:
      showOk: true # Mostra gli acknowledgment OK su Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Sopprimi la consegna degli avvisi per questo account
```

Precedenza: per-account → per-canale → valori predefiniti del canale → valori predefiniti integrati.

### Cosa fa ogni flag

- `showOk`: invia un acknowledgment `HEARTBEAT_OK` quando il modello restituisce una risposta solo-OK.
- `showAlerts`: invia il contenuto dell'avviso quando il modello restituisce una risposta non-OK.
- `useIndicator`: emette eventi indicatore per le superfici UI di stato.

Se **tutti e tre** sono false, OpenClaw salta completamente l'esecuzione heartbeat (nessuna chiamata al modello).

### Esempi per canale vs per-account

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
          showAlerts: false # sopprimi gli avvisi solo per l'account ops
  telegram:
    heartbeat:
      showOk: true
```

### Schemi comuni

| Obiettivo                                  | Configurazione                                                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Comportamento predefinito (OK silenziosi, avvisi attivi) | _(nessuna configurazione necessaria)_                                                     |
| Completamente silenzioso (nessun messaggio, nessun indicatore) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Solo indicatore (nessun messaggio)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK in un solo canale                       | `channels.telegram.heartbeat: { showOk: true }`                                           |

## HEARTBEAT.md (facoltativo)

Se nel workspace esiste un file `HEARTBEAT.md`, il prompt predefinito dice all'agente di leggerlo. Pensalo come alla tua "checklist heartbeat": piccola, stabile e sicura da includere ogni 30 minuti.

Nelle esecuzioni normali, `HEARTBEAT.md` viene iniettato solo quando la guida heartbeat è abilitata per l'agente predefinito. Disabilitando la cadenza heartbeat con `0m` oppure impostando `includeSystemPromptSection: false`, viene omesso dal normale contesto bootstrap.

Se `HEARTBEAT.md` esiste ma è di fatto vuoto (solo righe vuote e intestazioni markdown come `# Heading`), OpenClaw salta l'esecuzione heartbeat per risparmiare chiamate API. Questo salto viene segnalato come `reason=empty-heartbeat-file`. Se il file manca, l'heartbeat viene comunque eseguito e il modello decide cosa fare.

Mantienilo piccolo (breve checklist o promemoria) per evitare di gonfiare il prompt.

Esempio di `HEARTBEAT.md`:

```md
# Checklist Heartbeat

- Scansione rapida: c'è qualcosa di urgente nelle inbox?
- Se è giorno, fai un leggero check-in se non c'è nient'altro in sospeso.
- Se un'attività è bloccata, annota _cosa manca_ e chiedilo a Peter la prossima volta.
```

### Blocchi `tasks:`

`HEARTBEAT.md` supporta anche un piccolo blocco strutturato `tasks:` per controlli basati su intervallo direttamente dentro Heartbeat.

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
    - Solo le attività **dovute** vengono incluse nel prompt heartbeat per quel tick.
    - Se nessuna attività è dovuta, l'heartbeat viene saltato completamente (`reason=no-tasks-due`) per evitare una chiamata al modello sprecata.
    - Il contenuto non-task di `HEARTBEAT.md` viene preservato e aggiunto come contesto aggiuntivo dopo l'elenco delle attività dovute.
    - I timestamp dell'ultima esecuzione delle attività sono memorizzati nello stato della sessione (`heartbeatTaskState`), quindi gli intervalli sopravvivono ai normali riavvii.
    - I timestamp delle attività vengono avanzati solo dopo che un'esecuzione heartbeat completa il normale percorso di risposta. Le esecuzioni saltate `empty-heartbeat-file` / `no-tasks-due` non contrassegnano le attività come completate.
  </Accordion>
</AccordionGroup>

La modalità task è utile quando vuoi che un unico file heartbeat contenga diversi controlli periodici senza pagare per tutti a ogni tick.

### L'agente può aggiornare HEARTBEAT.md?

Sì — se glielo chiedi.

`HEARTBEAT.md` è solo un normale file nel workspace dell'agente, quindi puoi dire all'agente (in una chat normale) qualcosa come:

- "Aggiorna `HEARTBEAT.md` per aggiungere un controllo giornaliero del calendario."
- "Riscrivi `HEARTBEAT.md` in modo che sia più corto e focalizzato sui follow-up della inbox."

Se vuoi che questo avvenga in modo proattivo, puoi anche includere una riga esplicita nel prompt heartbeat come: "If the checklist becomes stale, update HEARTBEAT.md with a better one."

<Warning>
Non inserire segreti (chiavi API, numeri di telefono, token privati) in `HEARTBEAT.md` — entra a far parte del contesto del prompt.
</Warning>

## Risveglio manuale (on-demand)

Puoi accodare un evento di sistema e attivare immediatamente un heartbeat con:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Se più agenti hanno `heartbeat` configurato, un risveglio manuale esegue immediatamente gli heartbeat di ciascuno di quegli agenti.

Usa `--mode next-heartbeat` per attendere il tick pianificato successivo.

## Consegna del ragionamento (facoltativa)

Per impostazione predefinita, gli heartbeat consegnano solo il payload finale della "risposta".

Se vuoi trasparenza, abilita:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando abilitato, gli heartbeat consegneranno anche un messaggio separato prefissato con `Reasoning:` (stessa forma di `/reasoning on`). Questo può essere utile quando l'agente gestisce più sessioni/codex e vuoi capire perché ha deciso di contattarti — ma può anche esporre più dettagli interni di quanti ne desideri. È preferibile lasciarlo disattivato nelle chat di gruppo.

## Consapevolezza dei costi

Gli heartbeat eseguono turni completi dell'agente. Intervalli più brevi consumano più token. Per ridurre i costi:

- Usa `isolatedSession: true` per evitare di inviare l'intera cronologia della conversazione (da ~100K token a ~2-5K per esecuzione).
- Usa `lightContext: true` per limitare i file bootstrap al solo `HEARTBEAT.md`.
- Imposta un `model` più economico (ad es. `ollama/llama3.2:1b`).
- Mantieni piccolo `HEARTBEAT.md`.
- Usa `target: "none"` se vuoi solo aggiornamenti interni di stato.

## Correlati

- [Automazione e attività](/it/automation) — panoramica di tutti i meccanismi di automazione
- [Attività in background](/it/automation/tasks) — come viene tracciato il lavoro scollegato
- [Timezone](/it/concepts/timezone) — come la timezone influisce sulla pianificazione Heartbeat
- [Risoluzione dei problemi](/it/automation/cron-jobs#troubleshooting) — debug dei problemi di automazione
