---
read_when:
    - Refactoring del ciclo di vita delle sessioni ACP o della pulizia dei processi ACPX
    - Debug dei processi orfani ACPX, del riutilizzo dei PID o della sicurezza della pulizia con più Gateway
    - Modifica della visibilità di sessions_list per le sessioni ACP o dei subagenti generate
    - Progettazione dei metadati di proprietà per attività in background, sessioni ACP o lease di processo
sidebarTitle: ACP lifecycle refactor
summary: Piano di migrazione per rendere esplicita la proprietà della sessione ACP e del processo ACPX
title: Refactoring del ciclo di vita di ACP
x-i18n:
    generated_at: "2026-07-12T07:27:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
---

Il ciclo di vita ACP attualmente funziona, ma una parte eccessiva viene dedotta a posteriori.
La pulizia dei processi ricostruisce la proprietà a partire da PID, stringhe di comando, percorsi
dei wrapper e tabella dei processi attivi. La visibilità delle sessioni ricostruisce la proprietà
dalle stringhe delle chiavi di sessione insieme a ricerche secondarie `sessions.list({ spawnedBy })`.
Ciò rende possibili correzioni circoscritte, ma facilita anche la mancata gestione dei casi limite:
riutilizzo dei PID, comandi tra virgolette, processi nipoti degli adapter, radici di stato con più Gateway,
`cancel` rispetto a `close` e visibilità `tree` rispetto a `all` diventano tutti punti distinti
in cui riscoprire le stesse regole di proprietà.

Questo refactoring rende la proprietà un concetto di prima classe. L'obiettivo non è una nuova
superficie di prodotto ACP, ma un contratto interno più sicuro per il comportamento ACP e ACPX esistente.

## Obiettivi

- La pulizia non invia mai un segnale a un processo, a meno che le evidenze attive correnti non corrispondano a un
  lease di proprietà di OpenClaw.
- `cancel`, `close` e la rimozione all'avvio hanno finalità distinte nel ciclo di vita.
- `sessions_list`, `sessions_history`, `sessions_send` e i controlli di stato usano
  lo stesso modello di sessione di proprietà del richiedente.
- Le installazioni con più Gateway non possono rimuovere reciprocamente i wrapper ACPX.
- I vecchi record delle sessioni ACPX continuano a funzionare durante la migrazione.
- Il runtime rimane di proprietà del plugin; il core non acquisisce dettagli sul pacchetto ACPX.

## Non obiettivi

- Sostituire ACPX o modificare la superficie pubblica del comando `/acp`.
- Spostare nel core il comportamento degli adapter ACP specifico del fornitore.
- Richiedere agli utenti di pulire manualmente lo stato prima dell'aggiornamento.
- Fare in modo che `cancel` chiuda le sessioni ACP riutilizzabili.

## Modello di destinazione

### Identità dell'istanza del Gateway

Ogni processo Gateway dovrebbe avere un ID stabile dell'istanza di runtime:

```ts
type GatewayInstanceId = string;
```

Può essere generato all'avvio del Gateway e mantenuto nello stato per la durata
di quell'installazione. Non è un segreto di sicurezza, ma un discriminatore di proprietà usato
per evitare di confondere i processi ACP di un Gateway con quelli di un altro Gateway.

### Proprietà delle sessioni ACP

Ogni sessione ACP avviata dovrebbe avere metadati di proprietà normalizzati:

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

Il Gateway dovrebbe restituire questi campi nelle righe delle sessioni in cui sono noti.
Il filtraggio della visibilità dovrebbe essere un controllo puro sui metadati della riga:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Ciò elimina le chiamate secondarie nascoste a `sessions.list({ spawnedBy })` dai
controlli di visibilità. Una sessione ACP figlia, avviata tra agenti diversi, appartiene al richiedente perché
lo indica la riga, non perché una seconda query riesce casualmente a trovarla.

### Lease dei processi ACPX

Ogni avvio di un wrapper generato dovrebbe creare un record di lease:

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

Il processo wrapper dovrebbe ricevere l'ID del lease e l'ID dell'istanza del Gateway nel proprio
ambiente:

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Quando la piattaforma lo consente, la verifica dovrebbe preferire metadati del processo attivo
che non possano essere confusi dalla presenza di virgolette nei comandi:

- il PID radice esiste ancora
- il percorso del wrapper attivo si trova sotto `wrapperRoot`
- il gruppo di processi corrisponde al lease, quando disponibile
- l'ambiente contiene l'ID del lease previsto, quando è leggibile
- l'hash del comando o il percorso dell'eseguibile corrisponde al lease

Se il processo attivo non può essere verificato, la pulizia si interrompe in modo sicuro.

## Controller del ciclo di vita

Introdurre un unico controller del ciclo di vita ACPX che possieda i lease dei processi e la politica
di pulizia:

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

`cancelTurn` richiede soltanto l'annullamento del turno. Non deve rimuovere i processi wrapper
o adapter riutilizzabili.

`closeSession` può eseguire la rimozione, ma solo dopo aver caricato il record della sessione,
caricato il lease e verificato che l'albero dei processi attivi appartenga ancora a quel
lease.

`reapStartupOrphans` parte dai lease aperti nello stato. Può usare la tabella dei processi
per trovare i discendenti, ma non dovrebbe prima cercare comandi arbitrari che sembrano ACP
e poi decidere che probabilmente appartengono a questa installazione.

## Contratto del wrapper

I wrapper generati dovrebbero rimanere piccoli. Dovrebbero:

- avviare l'adapter in un gruppo di processi, dove supportato
- inoltrare i normali segnali di terminazione al gruppo di processi
- rilevare la terminazione del processo padre
- alla terminazione del padre, inviare SIGTERM e quindi mantenere attivo il wrapper finché non viene eseguito
  il ripiego a SIGKILL
- comunicare il PID radice e l'ID del gruppo di processi al controller del ciclo di vita, quando
  disponibili

I wrapper non dovrebbero decidere la politica delle sessioni. Impongono soltanto la pulizia locale
dell'albero dei processi per il proprio gruppo di adapter.

## Contratto di visibilità delle sessioni

La visibilità dovrebbe usare la proprietà normalizzata delle righe:

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
- `tree`: la sessione del richiedente più le righe di proprietà del richiedente o avviate da esso.
- `all`: tutte le righe dello stesso agente, le righe tra agenti diversi consentite da a2a e le righe
  tra agenti diversi avviate e di proprietà del richiedente, anche quando a2a generale è disabilitato.
- `agent`: solo lo stesso agente, a meno che una relazione di proprietà esplicita non indichi che la riga
  appartiene al richiedente.

Ciò rende `tree` e `all` monotone: `all` non deve nascondere una sessione figlia di proprietà del richiedente
che `tree` mostrerebbe.

## Piano di migrazione

### Fase 1: aggiunta dell'identità e dei lease

- Aggiungere `gatewayInstanceId` allo stato del Gateway.
- Aggiungere un archivio dei lease ACPX nella directory di stato ACPX.
- Scrivere un lease prima di avviare un wrapper generato.
- Memorizzare `leaseId` nei nuovi record delle sessioni ACPX.
- Conservare i campi esistenti relativi a PID e comando per i vecchi record.

### Fase 2: pulizia basata prima di tutto sui lease

- Modificare la pulizia alla chiusura affinché carichi prima `leaseId`.
- Verificare la proprietà del processo attivo rispetto al lease prima di inviare segnali.
- Conservare l'attuale ripiego basato su PID radice e radice del wrapper solo per i record legacy.
- Contrassegnare i lease come `closed` dopo una pulizia verificata.
- Contrassegnare i lease come `lost` quando il processo è già terminato prima della pulizia.

### Fase 3: rimozione all'avvio basata prima di tutto sui lease

- La rimozione all'avvio analizza i lease aperti.
- Per ogni lease, verificare il processo radice e raccogliere i discendenti.
- Rimuovere gli alberi verificati partendo dai figli.
- Far scadere i vecchi lease `closed` e `lost` entro una finestra di conservazione limitata.
- Conservare l'analisi dei marcatori dei comandi solo come ripiego legacy temporaneo, protetto
  ove possibile dalla radice del wrapper e dall'istanza del Gateway.

### Fase 4: righe di proprietà delle sessioni

- Aggiungere i metadati di proprietà alle righe delle sessioni del Gateway.
- Fare in modo che ACPX, i subagenti, le attività in background e i componenti di scrittura dell'archivio delle sessioni valorizzino
  `ownerSessionKey` o `spawnedBy`.
- Convertire i controlli di visibilità delle sessioni affinché usino i metadati delle righe.
- Rimuovere le ricerche secondarie `sessions.list({ spawnedBy })` eseguite durante i controlli di visibilità.

### Fase 5: rimozione delle euristiche legacy

Dopo una finestra di rilascio:

- smettere di usare le stringhe dei comandi radice memorizzate per la pulizia ACPX non legacy
- rimuovere le analisi dei marcatori dei comandi all'avvio
- rimuovere le ricerche di elenco usate come ripiego per la visibilità
- conservare il comportamento difensivo con interruzione sicura per lease mancanti o non verificabili

## Test

Aggiungere due suite basate su tabelle.

Simulatore del ciclo di vita dei processi:

- PID riutilizzato da un processo non correlato
- PID riutilizzato dalla radice del wrapper di un altro Gateway
- il comando del wrapper memorizzato usa le virgolette della shell, quello attivo restituito da `ps` no
- il processo figlio dell'adapter termina, ma un processo nipote rimane nel gruppo di processi
- il ripiego da SIGTERM a SIGKILL alla terminazione del padre viene eseguito
- elenco dei processi non disponibile
- lease obsoleto con processo mancante
- processo orfano all'avvio con wrapper, processo figlio dell'adapter e processo nipote

Matrice di visibilità delle sessioni:

- `self`, `tree`, `agent`, `all`
- a2a abilitato e disabilitato
- riga dello stesso agente
- riga di un agente diverso
- riga ACP tra agenti diversi, avviata e di proprietà del richiedente
- richiedente in ambiente isolato limitato a `tree`
- azioni di elenco, cronologia, invio e stato

L'invariante importante: una sessione figlia avviata e di proprietà del richiedente è visibile ovunque
la visibilità configurata includa l'albero della sessione del richiedente e `all` non è
meno capace di `tree`.

## Note sulla compatibilità

I vecchi record delle sessioni potrebbero non avere `leaseId`. Dovrebbero usare il percorso di pulizia
legacy con interruzione sicura:

- richiedere un processo radice attivo
- richiedere la proprietà della radice del wrapper quando è previsto un wrapper generato
- richiedere la corrispondenza del comando per le radici senza wrapper
- non inviare mai segnali basandosi unicamente su metadati obsoleti del PID memorizzato

Se un record legacy non può essere verificato, lasciarlo invariato. La pulizia dei lease all'avvio e
la successiva finestra di rilascio dovrebbero infine consentire di eliminare il ripiego.

## Criteri di successo

- La chiusura di una sessione ACPX vecchia o obsoleta non può terminare il processo di un altro Gateway.
- La terminazione del padre non lascia in esecuzione processi nipoti persistenti dell'adapter.
- `cancel` interrompe il turno attivo senza chiudere le sessioni riutilizzabili.
- `sessions_list` può mostrare le sessioni figlie ACP tra agenti diversi di proprietà del richiedente sia con
  `tree` sia con `all`.
- La pulizia all'avvio è guidata dai lease, non da analisi generiche delle stringhe di comando.
- I test mirati delle matrici dei processi e della visibilità coprono ogni caso limite che
  in precedenza richiedeva correzioni specifiche durante la revisione.
