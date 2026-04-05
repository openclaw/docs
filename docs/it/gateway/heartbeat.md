---
read_when:
    - Stai regolando la cadenza o la messaggistica heartbeat
    - Stai decidendo tra heartbeat e cron per attività pianificate
summary: Messaggi di polling heartbeat e regole di notifica
title: Heartbeat
x-i18n:
    generated_at: "2026-04-05T13:52:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: f417b0d4453bed9022144d364521a59dec919d44cca8f00f0def005cd38b146f
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat o Cron?** Vedi [Automazione e attività](/it/automation) per indicazioni su quando usare ciascuno.

Heartbeat esegue **turni periodici dell'agente** nella sessione principale così il modello può
far emergere tutto ciò che richiede attenzione senza sommergerti di messaggi.

Heartbeat è un turno pianificato della sessione principale — **non** crea record di [attività in background](/it/automation/tasks).
I record delle attività servono per lavoro scollegato (esecuzioni ACP, sotto-agenti, attività cron isolate).

Risoluzione dei problemi: [Attività pianificate](/it/automation/cron-jobs#troubleshooting)

## Avvio rapido (principianti)

1. Lascia heartbeat abilitato (il valore predefinito è `30m`, oppure `1h` per l'autenticazione Anthropic OAuth/token, incluso il riuso di Claude CLI) oppure imposta la tua cadenza.
2. Crea un piccolo elenco di controllo `HEARTBEAT.md` o un blocco `tasks:` nel workspace dell'agente (facoltativo ma consigliato).
3. Decidi dove devono andare i messaggi heartbeat (`target: "none"` è il valore predefinito; imposta `target: "last"` per instradare all'ultimo contatto).
4. Facoltativo: abilita la consegna del reasoning heartbeat per maggiore trasparenza.
5. Facoltativo: usa un contesto bootstrap leggero se le esecuzioni heartbeat richiedono solo `HEARTBEAT.md`.
6. Facoltativo: abilita sessioni isolate per evitare di inviare l'intera cronologia della conversazione a ogni heartbeat.
7. Facoltativo: limita heartbeat alle ore attive (ora locale).

Configurazione di esempio:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // consegna esplicita all'ultimo contatto (il valore predefinito è "none")
        directPolicy: "allow", // predefinito: consenti target diretti/DM; imposta "block" per sopprimere
        lightContext: true, // facoltativo: inietta solo HEARTBEAT.md dai file bootstrap
        isolatedSession: true, // facoltativo: nuova sessione a ogni esecuzione (senza cronologia della conversazione)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // facoltativo: invia anche un messaggio separato `Reasoning:`
      },
    },
  },
}
```

## Valori predefiniti

- Intervallo: `30m` (oppure `1h` quando l'autenticazione Anthropic OAuth/token è la modalità di autenticazione rilevata, incluso il riuso di Claude CLI). Imposta `agents.defaults.heartbeat.every` o `agents.list[].heartbeat.every` per agente; usa `0m` per disabilitare.
- Corpo del prompt (configurabile tramite `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Il prompt heartbeat viene inviato **testualmente** come messaggio utente. Il prompt di sistema
  include una sezione “Heartbeat” e l'esecuzione viene segnalata internamente.
- Le ore attive (`heartbeat.activeHours`) vengono controllate nel fuso orario configurato.
  Fuori dalla finestra, heartbeat viene saltato fino al tick successivo all'interno della finestra.

## A cosa serve il prompt heartbeat

Il prompt predefinito è intenzionalmente ampio:

- **Attività in background**: “Consider outstanding tasks” spinge l'agente a rivedere
  i follow-up (posta in arrivo, calendario, promemoria, lavoro in coda) e far emergere tutto ciò che è urgente.
- **Check-in umano**: “Checkup sometimes on your human during day time” spinge a un
  occasionale e leggero messaggio “hai bisogno di qualcosa?”, ma evita spam notturno
  usando il tuo fuso orario locale configurato (vedi [/concepts/timezone](/concepts/timezone)).

Heartbeat può reagire alle [attività in background](/it/automation/tasks) completate, ma un'esecuzione heartbeat di per sé non crea un record attività.

Se vuoi che heartbeat faccia qualcosa di molto specifico (ad esempio “controlla le statistiche Gmail PubSub”
o “verifica lo stato del gateway”), imposta `agents.defaults.heartbeat.prompt` (o
`agents.list[].heartbeat.prompt`) su un corpo personalizzato (inviato testualmente).

## Contratto di risposta

- Se non c'è nulla che richiede attenzione, rispondi con **`HEARTBEAT_OK`**.
- Durante le esecuzioni heartbeat, OpenClaw tratta `HEARTBEAT_OK` come un ack quando appare
  all'**inizio o alla fine** della risposta. Il token viene rimosso e la risposta viene
  eliminata se il contenuto rimanente è **≤ `ackMaxChars`** (predefinito: 300).
- Se `HEARTBEAT_OK` appare **nel mezzo** di una risposta, non viene trattato
  in modo speciale.
- Per gli avvisi, **non** includere `HEARTBEAT_OK`; restituisci solo il testo dell'avviso.

Al di fuori di heartbeat, un `HEARTBEAT_OK` accidentale all'inizio/fine di un messaggio viene rimosso
e registrato nei log; un messaggio che contiene solo `HEARTBEAT_OK` viene eliminato.

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
        isolatedSession: false, // predefinito: false; true esegue ogni heartbeat in una nuova sessione (senza cronologia della conversazione)
        target: "last", // predefinito: none | opzioni: last | none | <channel id> (core o plugin, ad es. "bluebubbles")
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

- `agents.defaults.heartbeat` imposta il comportamento heartbeat globale.
- `agents.list[].heartbeat` viene unito sopra; se un qualsiasi agente ha un blocco `heartbeat`, **solo quegli agenti** eseguono heartbeat.
- `channels.defaults.heartbeat` imposta i valori predefiniti di visibilità per tutti i canali.
- `channels.<channel>.heartbeat` sovrascrive i valori predefiniti del canale.
- `channels.<channel>.accounts.<id>.heartbeat` (canali multi-account) sovrascrive le impostazioni per canale.

### Heartbeat per agente

Se un qualsiasi elemento `agents.list[]` include un blocco `heartbeat`, **solo quegli agenti**
eseguono heartbeat. Il blocco per agente viene unito sopra `agents.defaults.heartbeat`
(così puoi impostare una sola volta i valori condivisi e sovrascriverli per agente).

Esempio: due agenti, solo il secondo agente esegue heartbeat.

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
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Esempio di ore attive

Limita heartbeat alle ore lavorative in un fuso orario specifico:

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
          timezone: "America/New_York", // facoltativo; usa il tuo userTimezone se impostato, altrimenti il fuso orario dell'host
        },
      },
    },
  },
}
```

Fuori da questa finestra (prima delle 9:00 o dopo le 22:00 Eastern), heartbeat viene saltato. Il successivo tick pianificato all'interno della finestra verrà eseguito normalmente.

### Configurazione 24/7

Se vuoi che heartbeat venga eseguito tutto il giorno, usa uno di questi schemi:

- Ometti completamente `activeHours` (nessuna limitazione di finestra temporale; questo è il comportamento predefinito).
- Imposta una finestra di giornata intera: `activeHours: { start: "00:00", end: "24:00" }`.

Non impostare la stessa ora per `start` e `end` (ad esempio `08:00` e `08:00`).
Viene trattata come una finestra di ampiezza zero, quindi heartbeat viene sempre saltato.

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
          to: "12345678:topic:42", // facoltativo: instrada a un topic/thread specifico
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

- `every`: intervallo heartbeat (stringa durata; unità predefinita = minuti).
- `model`: override facoltativo del modello per le esecuzioni heartbeat (`provider/model`).
- `includeReasoning`: quando abilitato, consegna anche il messaggio separato `Reasoning:` quando disponibile (stessa forma di `/reasoning on`).
- `lightContext`: quando è true, le esecuzioni heartbeat usano un contesto bootstrap leggero e mantengono solo `HEARTBEAT.md` dai file bootstrap del workspace.
- `isolatedSession`: quando è true, ogni heartbeat viene eseguito in una nuova sessione senza cronologia della conversazione precedente. Usa lo stesso schema di isolamento del cron `sessionTarget: "isolated"`. Riduce drasticamente il costo in token per heartbeat. Combinalo con `lightContext: true` per il massimo risparmio. L'instradamento della consegna usa comunque il contesto della sessione principale.
- `session`: chiave di sessione facoltativa per le esecuzioni heartbeat.
  - `main` (predefinita): sessione principale dell'agente.
  - Chiave di sessione esplicita (copiala da `openclaw sessions --json` o dalla [CLI delle sessioni](/cli/sessions)).
  - Formati delle chiavi di sessione: vedi [Sessioni](/concepts/session) e [Gruppi](/it/channels/groups).
- `target`:
  - `last`: consegna all'ultimo canale esterno usato.
  - canale esplicito: qualsiasi canale configurato o id plugin, ad esempio `discord`, `matrix`, `telegram` o `whatsapp`.
  - `none` (predefinito): esegue heartbeat ma **non effettua** consegna esterna.
- `directPolicy`: controlla il comportamento di consegna diretta/DM:
  - `allow` (predefinito): consente la consegna heartbeat diretta/DM.
  - `block`: sopprime la consegna diretta/DM (`reason=dm-blocked`).
- `to`: override facoltativo del destinatario (id specifico del canale, ad es. E.164 per WhatsApp o un id chat Telegram). Per topic/thread Telegram, usa `<chatId>:topic:<messageThreadId>`.
- `accountId`: id account facoltativo per canali multi-account. Quando `target: "last"`, l'id account si applica al canale risolto come ultimo se supporta account; altrimenti viene ignorato. Se l'id account non corrisponde a un account configurato per il canale risolto, la consegna viene saltata.
- `prompt`: sovrascrive il corpo del prompt predefinito (non viene unito).
- `ackMaxChars`: numero massimo di caratteri consentiti dopo `HEARTBEAT_OK` prima della consegna.
- `suppressToolErrorWarnings`: quando è true, sopprime i payload di avviso degli errori degli strumenti durante le esecuzioni heartbeat.
- `activeHours`: limita le esecuzioni heartbeat a una finestra temporale. Oggetto con `start` (HH:MM, inclusivo; usa `00:00` per l'inizio della giornata), `end` (HH:MM esclusivo; `24:00` consentito per la fine della giornata) e `timezone` facoltativo.
  - Ometto o `"user"`: usa il tuo `agents.defaults.userTimezone` se impostato, altrimenti ripiega sul fuso orario del sistema host.
  - `"local"`: usa sempre il fuso orario del sistema host.
  - Qualsiasi identificatore IANA (ad es. `America/New_York`): usato direttamente; se non valido, ripiega sul comportamento `"user"` sopra.
  - `start` e `end` non devono essere uguali per una finestra attiva; valori uguali sono trattati come ampiezza zero (sempre fuori dalla finestra).
  - Fuori dalla finestra attiva, heartbeat viene saltato fino al tick successivo all'interno della finestra.

## Comportamento della consegna

- Per impostazione predefinita, heartbeat viene eseguito nella sessione principale dell'agente (`agent:<id>:<mainKey>`),
  oppure `global` quando `session.scope = "global"`. Imposta `session` per sovrascrivere con una
  sessione di canale specifica (Discord/WhatsApp/ecc.).
- `session` influisce solo sul contesto di esecuzione; la consegna è controllata da `target` e `to`.
- Per consegnare a un canale/destinatario specifico, imposta `target` + `to`. Con
  `target: "last"`, la consegna usa l'ultimo canale esterno per quella sessione.
- Per impostazione predefinita, le consegne heartbeat consentono target diretti/DM. Imposta `directPolicy: "block"` per sopprimere gli invii a target diretti pur continuando a eseguire il turno heartbeat.
- Se la coda principale è occupata, heartbeat viene saltato e ritentato più tardi.
- Se `target` non si risolve in alcuna destinazione esterna, l'esecuzione avviene comunque ma non
  viene inviato alcun messaggio in uscita.
- Se `showOk`, `showAlerts` e `useIndicator` sono tutti disabilitati, l'esecuzione viene saltata in anticipo come `reason=alerts-disabled`.
- Se è disabilitata solo la consegna degli avvisi, OpenClaw può comunque eseguire heartbeat, aggiornare i timestamp delle attività scadute, ripristinare il timestamp di inattività della sessione e sopprimere il payload di avviso verso l'esterno.
- Le risposte solo-heartbeat **non** mantengono attiva la sessione; l'ultimo `updatedAt`
  viene ripristinato così che la scadenza per inattività si comporti normalmente.
- Le [attività in background](/it/automation/tasks) scollegate possono accodare un evento di sistema e attivare heartbeat quando la sessione principale deve notare rapidamente qualcosa. Questa attivazione non fa diventare l'esecuzione heartbeat un'attività in background.

## Controlli di visibilità

Per impostazione predefinita, gli ack `HEARTBEAT_OK` vengono soppressi mentre il contenuto degli avvisi
viene consegnato. Puoi regolare questo comportamento per canale o per account:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Nasconde HEARTBEAT_OK (predefinito)
      showAlerts: true # Mostra i messaggi di avviso (predefinito)
      useIndicator: true # Emette eventi indicatore (predefinito)
  telegram:
    heartbeat:
      showOk: true # Mostra gli ack OK su Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Sopprime la consegna degli avvisi per questo account
```

Precedenza: per-account → per-canale → valori predefiniti del canale → valori predefiniti integrati.

### Cosa fa ogni flag

- `showOk`: invia un ack `HEARTBEAT_OK` quando il modello restituisce una risposta composta solo da OK.
- `showAlerts`: invia il contenuto dell'avviso quando il modello restituisce una risposta diversa da OK.
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
          showAlerts: false # sopprime gli avvisi solo per l'account ops
  telegram:
    heartbeat:
      showOk: true
```

### Schemi comuni

| Obiettivo                                | Configurazione                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamento predefinito (OK silenziosi, avvisi attivi) | _(nessuna configurazione necessaria)_                                      |
| Completamente silenzioso (nessun messaggio, nessun indicatore) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Solo indicatore (nessun messaggio)       | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK in un solo canale                     | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (facoltativo)

Se nel workspace esiste un file `HEARTBEAT.md`, il prompt predefinito dice all'agente
di leggerlo. Consideralo come il tuo “elenco di controllo heartbeat”: piccolo, stabile e
sicuro da includere ogni 30 minuti.

Se `HEARTBEAT.md` esiste ma è di fatto vuoto (solo righe vuote e intestazioni Markdown
come `# Heading`), OpenClaw salta l'esecuzione heartbeat per risparmiare chiamate API.
Questo salto viene riportato come `reason=empty-heartbeat-file`.
Se il file manca, heartbeat viene comunque eseguito e il modello decide cosa fare.

Mantienilo piccolo (breve elenco di controllo o promemoria) per evitare il gonfiore del prompt.

Esempio di `HEARTBEAT.md`:

```md
# Elenco di controllo heartbeat

- Scansione rapida: c'è qualcosa di urgente nelle caselle di posta?
- Se è giorno, fai un leggero check-in se non c'è altro in sospeso.
- Se un'attività è bloccata, annota _cosa manca_ e chiedilo a Peter la prossima volta.
```

### Blocchi `tasks:`

`HEARTBEAT.md` supporta anche un piccolo blocco strutturato `tasks:` per
controlli basati su intervalli all'interno di heartbeat stesso.

Esempio:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Istruzioni aggiuntive

- Mantieni brevi gli avvisi.
- Se non c'è nulla che richiede attenzione dopo tutte le attività scadute, rispondi HEARTBEAT_OK.
```

Comportamento:

- OpenClaw analizza il blocco `tasks:` e controlla ogni attività rispetto al proprio `interval`.
- Solo le attività **scadute** vengono incluse nel prompt heartbeat per quel tick.
- Se non ci sono attività scadute, heartbeat viene saltato completamente (`reason=no-tasks-due`) per evitare una chiamata al modello sprecata.
- Il contenuto non-task in `HEARTBEAT.md` viene conservato e aggiunto come contesto supplementare dopo l'elenco delle attività scadute.
- I timestamp dell'ultima esecuzione delle attività vengono archiviati nello stato della sessione (`heartbeatTaskState`), così gli intervalli sopravvivono ai normali riavvii.
- I timestamp delle attività avanzano solo dopo che un'esecuzione heartbeat completa il normale percorso di risposta. Le esecuzioni saltate `empty-heartbeat-file` / `no-tasks-due` non segnano le attività come completate.

La modalità attività è utile quando vuoi che un singolo file heartbeat contenga diversi controlli periodici senza pagare tutti a ogni tick.

### L'agente può aggiornare HEARTBEAT.md?

Sì — se glielo chiedi.

`HEARTBEAT.md` è solo un normale file nel workspace dell'agente, quindi puoi dire
all'agente (in una chat normale) qualcosa come:

- “Aggiorna `HEARTBEAT.md` per aggiungere un controllo quotidiano del calendario.”
- “Riscrivi `HEARTBEAT.md` in modo che sia più corto e focalizzato sui follow-up della posta in arrivo.”

Se vuoi che questo avvenga in modo proattivo, puoi anche includere una riga esplicita nel
prompt heartbeat come: “Se l'elenco di controllo diventa obsoleto, aggiorna HEARTBEAT.md
con uno migliore.”

Nota di sicurezza: non inserire segreti (chiavi API, numeri di telefono, token privati) in
`HEARTBEAT.md` — diventa parte del contesto del prompt.

## Attivazione manuale (su richiesta)

Puoi accodare un evento di sistema e attivare immediatamente heartbeat con:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Se più agenti hanno `heartbeat` configurato, un'attivazione manuale esegue immediatamente ciascuno di quegli
heartbeat degli agenti.

Usa `--mode next-heartbeat` per attendere il tick pianificato successivo.

## Consegna del reasoning (facoltativa)

Per impostazione predefinita, heartbeat consegna solo il payload finale della “risposta”.

Se vuoi trasparenza, abilita:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando è abilitato, heartbeat consegnerà anche un messaggio separato con prefisso
`Reasoning:` (stessa forma di `/reasoning on`). Questo può essere utile quando l'agente
gestisce più sessioni/codex e vuoi capire perché ha deciso di inviarti un ping
— ma può anche esporre più dettagli interni di quanto desideri. È preferibile lasciarlo
disattivato nelle chat di gruppo.

## Consapevolezza dei costi

Heartbeat esegue turni completi dell'agente. Intervalli più brevi consumano più token. Per ridurre il costo:

- Usa `isolatedSession: true` per evitare di inviare l'intera cronologia della conversazione (da ~100K token a ~2-5K per esecuzione).
- Usa `lightContext: true` per limitare i file bootstrap al solo `HEARTBEAT.md`.
- Imposta un `model` più economico (ad es. `ollama/llama3.2:1b`).
- Mantieni `HEARTBEAT.md` piccolo.
- Usa `target: "none"` se vuoi solo aggiornamenti di stato interni.

## Correlati

- [Automazione e attività](/it/automation) — tutti i meccanismi di automazione a colpo d'occhio
- [Attività in background](/it/automation/tasks) — come viene tracciato il lavoro scollegato
- [Fuso orario](/concepts/timezone) — come il fuso orario influisce sulla pianificazione heartbeat
- [Risoluzione dei problemi](/it/automation/cron-jobs#troubleshooting) — debug dei problemi di automazione
