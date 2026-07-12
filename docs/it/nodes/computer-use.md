---
read_when:
    - Consentire all'agente Gateway di visualizzare e controllare il desktop di un Mac
    - Attivazione, autorizzazioni o sicurezza per l'uso del computer
    - Estensione del comando del nodo computer.act o dei relativi esecutori
summary: Controllo del desktop gestito dall’agente su un nodo macOS associato tramite lo strumento computer e il comando del nodo computer.act
title: Uso del computer
x-i18n:
    generated_at: "2026-07-12T07:12:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2457d15a59857ffd9c7b160ea4ebed85c8372754abfc7bf75faafc963ecb6547
    source_path: nodes/computer-use.md
    workflow: 16
---

L'uso del computer consente all'agente del Gateway di vedere e controllare un desktop **macOS** associato: acquisisce uno screenshot con il comando Node esistente `screen.snapshot` e controlla il puntatore e la tastiera tramite un unico comando Node pericoloso, `computer.act`. L'insieme di azioni segue le azioni principali per l'uso del computer di Anthropic; lo zoom opzionale `computer_20251124` non è esposto. Un modello con capacità visive lo controlla tramite lo strumento agente `computer` integrato.

L'agente emette un unico comando uniforme, `computer.act`, e non può sapere in che modo un Node lo esegue. Un Node macOS esegue `computer.act` all'interno del processo con i servizi Peekaboo incorporati e primitive CoreGraphics mirate (autorizzazioni TCC corrette, nessun processo aggiuntivo). In futuro, altre piattaforme potranno eseguire lo stesso comando senza modificare il contratto esposto all'agente.

## Requisiti

- Un Node **macOS** associato (l'app OpenClaw per macOS in esecuzione in modalità Node).
- L'impostazione dell'app macOS **Allow Computer Control** abilitata (predefinita: disabilitata).
- L'autorizzazione **Accessibility** di macOS concessa a OpenClaw (per l'iniezione di eventi del puntatore e della tastiera) e l'autorizzazione **Screen Recording** (per `screen.snapshot`).
- Il comando `computer.act` armato sul Gateway (è pericoloso e disarmato per impostazione predefinita).
- Un modello agente con capacità visive.
- Una policy degli strumenti che esponga `computer`. Il profilo `coding` predefinito non lo espone. Aggiungere `computer` a `tools.alsoAllow`; gli agenti in sandbox devono aggiungerlo anche a `tools.sandbox.tools.alsoAllow`.

## Lo strumento agente `computer`

Lo strumento integrato `computer` accetta un'azione per chiamata. Le coordinate sono pixel interi non negativi nello screenshot più recente; il Node le converte in punti dello schermo. Le azioni basate sulle coordinate devono riportare il `frameId` del risultato dello screenshot e un eventuale `screenIndex` esplicito deve corrispondere a quel fotogramma. OpenClaw trasferisce inoltre dallo screenshot all'azione un'identità dello schermo emessa dal Node, in modo che la riconnessione di uno schermo o una modifica della geometria provochi un errore sicuro anziché reindirizzare silenziosamente l'azione allo stesso indice. Questi controlli rifiutano i token ipotizzati e quelli provenienti da un altro fotogramma o schermo fornito. Un token non garantisce l'attualità: le app possono modificare i pixel sullo stesso schermo dopo l'acquisizione, quindi acquisire un nuovo screenshot ogni volta che la scena potrebbe essere cambiata.

- Lettura: `screenshot`.
- Puntatore: `left_click`, `right_click`, `middle_click`, `double_click`, `triple_click`, `mouse_move`, `left_click_drag` (con `startCoordinate`), `left_mouse_down`, `left_mouse_up`.
- Scorrimento: `scroll` con `scrollDirection` (`up|down|left|right`) e `scrollAmount` (scatti della rotellina).
- Tastiera: `type` (testo), `key` (combinazione come `cmd+shift+t` o `Return`), `hold_key` (combinazione nel campo `text` mantenuta per `duration` secondi).
- Temporizzazione: `wait` (`duration` secondi).

I tasti modificatori vengono specificati nel campo `text` delle azioni di clic e scorrimento (`shift`, `ctrl`, `alt`, `cmd`). Dopo un'azione di input, lo strumento restituisce un nuovo screenshot affinché il modello possa osservarne il risultato. Se è connesso più di un Node in grado di controllare il computer, specificare esplicitamente `node`.

Gli screenshot restano **esclusivamente disponibili al modello**: non vengono mai recapitati automaticamente al canale di chat. Considerare tutti i contenuti visualizzati sullo schermo come input non attendibile; lo strumento avverte il modello di non seguire istruzioni visualizzate sullo schermo che siano in conflitto con la richiesta dell'utente.

## Il comando Node `computer.act`

`computer.act` è l'unico comando Node attraverso cui lo strumento instrada l'input (`node.invoke` con `command: "computer.act"`). È:

- **Pericoloso per impostazione predefinita**: è incluso tra i comandi Node pericolosi integrati ed escluso dall'elenco di autorizzazione di runtime finché non viene armato esplicitamente. Un Node macOS può comunque dichiararlo durante l'associazione, in modo che l'interfaccia venga approvata una sola volta.
- **Esclusivo di macOS** al momento: viene pubblicizzato soltanto da un Node macOS in cui **Allow Computer Control** è abilitato.

Le letture riutilizzano `screen.snapshot`; non esiste un secondo percorso di acquisizione. Consultare [Node per fotocamera e schermo](/it/nodes/camera) per il comando di acquisizione condiviso.

## Abilitazione e attivazione

1. Nell'app macOS, abilitare **Settings → Allow Computer Control**. Quindi aprire **Settings → Permissions** e concedere **Accessibility** e **Screen Recording** nelle Impostazioni di Sistema di macOS.
2. Approvare l'aggiornamento dell'associazione sul Gateway (un nuovo comando impone una nuova associazione).
3. Esporre lo strumento all'agente con capacità visive. Per il profilo `coding` predefinito:

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // Anche gli agenti in sandbox richiedono questo secondo controllo:
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. Armare `computer.act` per un intervallo limitato. Il Plugin `phone-control` espone un gruppo `computer`:

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   L'attivazione richiede `operator.admin` (oppure il proprietario) e scade automaticamente. Il gruppo precedente `/phone arm all` esclude intenzionalmente il controllo del desktop; utilizzare il gruppo esplicito `computer`. L'attivazione determina soltanto ciò che il Gateway può invocare; l'app macOS continua ad applicare la propria impostazione **Allow Computer Control** e le autorizzazioni del sistema operativo.

Per l'autorizzazione permanente, aggiungere `computer.act` a `gateway.nodes.allowCommands` **e rimuoverlo da** `gateway.nodes.denyCommands`; l'elenco di negazione ha la precedenza. L'autorizzazione permanente non scade automaticamente. Le voci già presenti prima di `/phone arm` rimangono dopo `/phone disarm`; non convertire una concessione temporanea in permanente mentre è armata.

L'autorizzazione è intenzionalmente suddivisa tra abilitazione e utilizzo. L'attivazione o
la configurazione permanente di `computer.act` richiede privilegi amministrativi.
Una volta armato, un operatore autenticato con `operator.write` può invocare
`computer.act` tramite `node.invoke` finché la concessione non scade o viene disarmata;
non viene eseguito alcun controllo amministrativo per ogni azione. L'approvazione di un Node che dichiara
`computer.act` registra soltanto l'interfaccia affinché possa essere armata in seguito e non
abilita di per sé l'invocazione.

## Sicurezza

- Prima dell'autorizzazione, tutti i livelli (policy degli strumenti, policy dei comandi del Gateway, impostazione macOS, Accessibility e Screen Recording) devono concordare. Una volta armato, le azioni vengono eseguite senza conferma per ogni singola azione fino alla scadenza o a `/phone disarm`.
- L'input di testo viene inviato un grafema alla volta. Annullamento, disconnessione, pausa, disabilitazione o sostituzione dell'endpoint lo interrompono prima del grafema successivo, impedendo che la parte residua obsoleta continui.
- Gli screenshot sono disponibili esclusivamente al modello e non vengono mai inviati automaticamente alla chat (segnalazione [#44759](https://github.com/openclaw/openclaw/issues/44759)).
- Considerare il contenuto dello schermo non attendibile; può contenere prompt injection.

## Relazione con gli altri percorsi di controllo del desktop

Questo è il percorso controllato dall'agente. Consultare [Bridge Peekaboo](/it/platforms/mac/peekaboo) per informazioni sul rapporto con l'host PeekabooBridge, Codex Computer Use e il MCP diretto `cua-driver`.
