---
read_when:
    - Refactoring del ciclo di vita della sessione ACP o pulizia del processo ACPX
    - Risoluzione dei problemi relativi ai processi orfani ACPX, al riutilizzo dei PID o alla sicurezza della pulizia multi-Gateway
    - Modifica della visibilità di sessions_list per le sessioni ACP o di sottoagenti avviate
    - Progettare metadati di proprietà per attività in background, sessioni ACP o lease di processo
sidebarTitle: ACP lifecycle refactor
summary: Piano di migrazione per rendere esplicita la proprietà della sessione ACP e del processo ACPX
title: Refactoring del ciclo di vita ACP
x-i18n:
    generated_at: "2026-05-07T13:25:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Il ciclo di vita ACP attualmente funziona, ma troppo viene dedotto a posteriori.
La pulizia dei processi ricostruisce la proprietà da PID, stringhe di comando, percorsi dei wrapper e dalla tabella dei processi live. La visibilità delle sessioni ricostruisce la proprietà da stringhe session-key più lookup secondari `sessions.list({ spawnedBy })`.
Questo rende possibili correzioni mirate, ma rende anche facile perdere casi limite:
riutilizzo dei PID, comandi tra virgolette, nipoti degli adapter, root di stato multi-Gateway,
`cancel` rispetto a `close`, e visibilità `tree` rispetto ad `all` diventano tutti punti separati in cui riscoprire le stesse regole di proprietà.

Questo refactor rende la proprietà un concetto di primo livello. L'obiettivo non è una nuova superficie di prodotto ACP; è un contratto interno più sicuro per il comportamento ACP e ACPX esistente.

## Obiettivi

- La pulizia non invia mai segnali a un processo a meno che le prove live correnti corrispondano a un lease posseduto da OpenClaw.
- `cancel`, `close` e la mietitura all'avvio hanno intenti di ciclo di vita distinti.
- `sessions_list`, `sessions_history`, `sessions_send` e i controlli di stato usano lo stesso modello di sessione posseduta dal richiedente.
- Le installazioni multi-Gateway non possono mietere i wrapper ACPX l'una dell'altra.
- I vecchi record di sessione ACPX continuano a funzionare durante la migrazione.
- Il runtime resta posseduto dal Plugin; core non apprende dettagli del pacchetto ACPX.

## Non obiettivi

- Sostituire ACPX o cambiare la superficie pubblica del comando `/acp`.
- Spostare in core il comportamento degli adapter ACP specifico del vendor.
- Richiedere agli utenti di pulire manualmente lo stato prima dell'aggiornamento.
- Fare in modo che `cancel` chiuda sessioni ACP riutilizzabili.

## Modello di destinazione

### Identità dell'istanza Gateway

Ogni processo Gateway dovrebbe avere un id stabile dell'istanza runtime:

```ts
type GatewayInstanceId = string;
```

Può essere generato all'avvio del Gateway e persistito nello stato per la durata di vita di quell'installazione. Non è un segreto di sicurezza; è un discriminatore di proprietà usato per evitare di confondere i processi ACP di un Gateway con i processi di un altro Gateway.

### Proprietà della sessione ACP

Ogni sessione ACP generata dovrebbe avere metadati di proprietà normalizzati:

```ts
type AcpSessionOwner = {
  sessionKey: string;
  spawnedBy?: string;
  parentSessionKey?: string;
  ownerSessionKey: string;
  agentId: string;
  backend: "acpx";
  gatewayInstanceId: GatewayInstanceId;
  createdAt: number;
};
```

Il Gateway dovrebbe restituire questi campi sulle righe di sessione quando sono noti.
Il filtro di visibilità dovrebbe essere un controllo puro sui metadati della riga:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Questo rimuove dalle verifiche di visibilità le chiamate secondarie nascoste a `sessions.list({ spawnedBy })`. Un figlio ACP cross-agent generato è posseduto dal richiedente perché la riga lo dichiara, non perché una seconda query capita di trovarlo.

### Lease dei processi ACPX

Ogni avvio di wrapper generato dovrebbe creare un record di lease:

```ts
type AcpxProcessLease = {
  leaseId: string;
  gatewayInstanceId: GatewayInstanceId;
  sessionKey: string;
  wrapperRoot: string;
  wrapperPath: string;
  rootPid: number;
  processGroupId?: number;
  commandHash: string;
  startedAt: number;
  state: "open" | "closing" | "closed" | "lost";
};
```

Il processo wrapper dovrebbe ricevere l'id del lease e l'id dell'istanza Gateway nel proprio ambiente:

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Quando la piattaforma lo consente, la verifica dovrebbe preferire metadati del processo live che non possano essere confusi dalle virgolette nei comandi:

- il PID root esiste ancora
- il percorso del wrapper live è sotto `wrapperRoot`
- il gruppo di processi corrisponde al lease quando disponibile
- l'ambiente contiene l'id del lease atteso quando leggibile
- l'hash del comando o il percorso dell'eseguibile corrisponde al lease

Se il processo live non può essere verificato, la pulizia fallisce in modo chiuso.

## Controller del ciclo di vita

Introdurre un unico controller del ciclo di vita ACPX che possieda i lease dei processi e la policy di pulizia:

```ts
interface AcpxLifecycleController {
  ensureSession(input: AcpRuntimeEnsureInput): Promise<AcpRuntimeHandle>;
  cancelTurn(handle: AcpRuntimeHandle): Promise<void>;
  closeSession(input: {
    handle: AcpRuntimeHandle;
    discardPersistentState?: boolean;
    reason?: string;
  }): Promise<void>;
  reapStartupOrphans(): Promise<void>;
  verifyOwnedTree(lease: AcpxProcessLease): Promise<OwnedProcessTree | null>;
}
```

`cancelTurn` richiede solo l'annullamento del turno. Non deve mietere processi wrapper o adapter riutilizzabili.

`closeSession` può mietere, ma solo dopo aver caricato il record della sessione, caricato il lease e verificato che l'albero dei processi live appartenga ancora a quel lease.

`reapStartupOrphans` parte dai lease aperti nello stato. Può usare la tabella dei processi per trovare discendenti, ma non dovrebbe prima scansionare comandi arbitrari che sembrano ACP e poi decidere che probabilmente sono nostri.

## Contratto dei wrapper

I wrapper generati dovrebbero restare piccoli. Dovrebbero:

- avviare l'adapter in un gruppo di processi dove supportato
- inoltrare i normali segnali di terminazione al gruppo di processi
- rilevare la morte del genitore
- alla morte del genitore, inviare SIGTERM, poi mantenere vivo il wrapper finché non viene eseguito il fallback SIGKILL
- riportare il PID root e l'id del gruppo di processi al controller del ciclo di vita quando disponibile

I wrapper non dovrebbero decidere la policy delle sessioni. Applicano solo la pulizia locale dell'albero dei processi per il proprio gruppo adapter.

## Contratto di visibilità delle sessioni

La visibilità dovrebbe usare la proprietà normalizzata della riga:

```ts
type SessionVisibilityInput = {
  requesterSessionKey: string;
  row: {
    key: string;
    agentId: string;
    ownerSessionKey?: string;
    spawnedBy?: string;
    parentSessionKey?: string;
  };
  visibility: "self" | "tree" | "agent" | "all";
  a2aPolicy: AgentToAgentPolicy;
};
```

Regole:

- `self`: solo la sessione del richiedente.
- `tree`: la sessione del richiedente più le righe possedute dal richiedente o generate a partire da esso.
- `all`: tutte le righe dello stesso agente, le righe cross-agent consentite da a2a e le righe cross-agent generate e possedute dal richiedente anche quando a2a generale è disabilitato.
- `agent`: solo lo stesso agente, a meno che una relazione di proprietà esplicita dica che la riga appartiene al richiedente.

Questo rende `tree` e `all` monotone: `all` non deve nascondere un figlio posseduto che `tree` mostrerebbe.

## Piano di migrazione

### Fase 1: Aggiungere identità e lease

- Aggiungere `gatewayInstanceId` allo stato del Gateway.
- Aggiungere uno store di lease ACPX sotto la directory di stato ACPX.
- Scrivere un lease prima di generare un wrapper.
- Salvare `leaseId` sui nuovi record di sessione ACPX.
- Conservare i campi PID e comando esistenti per i vecchi record.

### Fase 2: Pulizia lease-first

- Modificare la pulizia di chiusura per caricare prima `leaseId`.
- Verificare la proprietà del processo live rispetto al lease prima di inviare segnali.
- Conservare il fallback attuale su PID root e root del wrapper solo per i record legacy.
- Contrassegnare i lease come `closed` dopo una pulizia verificata.
- Contrassegnare i lease come `lost` quando il processo è scomparso prima della pulizia.

### Fase 3: Mietitura all'avvio lease-first

- La mietitura all'avvio scansiona i lease aperti.
- Per ogni lease, verificare il processo root e raccogliere i discendenti.
- Mietere gli alberi verificati a partire dai figli.
- Far scadere i vecchi lease `closed` e `lost` con una finestra di conservazione limitata.
- Conservare la scansione dei marker di comando solo come fallback legacy temporaneo, protetta dalla root del wrapper e dall'istanza Gateway dove possibile.

### Fase 4: Righe di proprietà delle sessioni

- Aggiungere metadati di proprietà alle righe di sessione del Gateway.
- Insegnare agli writer ACPX, subagent, background-task e session-store a popolare `ownerSessionKey` o `spawnedBy`.
- Convertire i controlli di visibilità delle sessioni per usare i metadati delle righe.
- Rimuovere i lookup secondari `sessions.list({ spawnedBy })` al momento della visibilità.

### Fase 5: Rimuovere le euristiche legacy

Dopo una finestra di rilascio:

- smettere di fare affidamento sulle stringhe di comando root salvate per la pulizia ACPX non legacy
- rimuovere le scansioni dei marker di comando all'avvio
- rimuovere i lookup di lista di fallback per la visibilità
- mantenere un comportamento difensivo che fallisce in modo chiuso per lease mancanti o non verificabili

## Test

Aggiungere due suite table-driven.

Simulatore del ciclo di vita dei processi:

- PID riutilizzato da un processo non correlato
- PID riutilizzato dalla root wrapper di un altro Gateway
- il comando wrapper salvato è quotato dalla shell, il comando `ps` live no
- il figlio dell'adapter termina, il nipote rimane nel gruppo di processi
- il fallback SIGTERM alla morte del genitore arriva a SIGKILL
- elenco dei processi non disponibile
- lease obsoleto con processo mancante
- orfano all'avvio con wrapper, figlio adapter e nipote

Matrice di visibilità delle sessioni:

- `self`, `tree`, `agent`, `all`
- a2a abilitato e disabilitato
- riga dello stesso agente
- riga cross-agent
- riga ACP cross-agent generata e posseduta dal richiedente
- richiedente in sandbox limitato a `tree`
- azioni di elenco, cronologia, invio e stato

L'invariante importante: un figlio generato e posseduto dal richiedente è visibile ovunque la visibilità configurata includa l'albero della sessione del richiedente, e `all` non è meno capace di `tree`.

## Note di compatibilità

I vecchi record di sessione potrebbero non avere `leaseId`. Dovrebbero usare il percorso di pulizia legacy che fallisce in modo chiuso:

- richiedere un processo root live
- richiedere la proprietà della root wrapper quando è atteso un wrapper generato
- richiedere corrispondenza del comando per root non wrapper
- non inviare mai segnali basandosi solo su metadati PID salvati e obsoleti

Se un record legacy non può essere verificato, lasciarlo com'è. La pulizia dei lease all'avvio e la successiva finestra di rilascio dovrebbero alla fine ritirare il fallback.

## Criteri di successo

- La chiusura di una sessione ACPX vecchia o obsoleta non può uccidere il processo di un altro Gateway.
- La morte del genitore non lascia in esecuzione nipoti adapter ostinati.
- `cancel` interrompe il turno attivo senza chiudere sessioni riutilizzabili.
- `sessions_list` può mostrare figli ACP cross-agent posseduti dal richiedente sia sotto `tree` sia sotto `all`.
- La pulizia all'avvio è guidata dai lease, non da scansioni ampie delle stringhe di comando.
- I test mirati della matrice di processi e visibilità coprono ogni caso limite che in precedenza richiedeva correzioni di revisione una tantum.
