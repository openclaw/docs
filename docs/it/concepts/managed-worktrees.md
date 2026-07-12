---
read_when:
    - Vuoi un branch e un checkout isolati per un'attività dell'agente
    - Stai configurando le schede di Workboard con spazi di lavoro worktree
    - Devi ripristinare o ripulire un worktree gestito da OpenClaw
summary: Esegui le attività dell'agente in checkout Git isolati con snapshot e pulizia automatici
title: Worktree gestiti
x-i18n:
    generated_at: "2026-07-12T07:00:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 12a33dc2d9f1ff30060ddead200196b09cfe9498462f58a7aa8a73fa2273f31f
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

I worktree gestiti assegnano a un'attività dell'agente un proprio branch git e un proprio checkout senza collocare directory temporanee nel repository sorgente. OpenClaw li crea nella propria directory di stato, li registra nel database di stato condiviso e acquisisce uno snapshot dei contenuti tracciati e non tracciati non ignorati prima della rimozione.

## Struttura e nomi

Ogni worktree si trova in:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

L'impronta del repository è costituita dai primi 16 caratteri esadecimali di un hash SHA-256 calcolato sulla directory git comune canonica e sull'URL di origine. Un nome specificato deve corrispondere a `[a-z0-9][a-z0-9-]{0,63}`. Se non viene specificato un nome, OpenClaw genera `wt-` seguito da otto caratteri esadecimali casuali.

OpenClaw crea il branch `openclaw/<name>` in corrispondenza del riferimento di base richiesto. Se non viene specificato un riferimento di base, recupera `origin`, usa il branch predefinito remoto quando disponibile e ripiega sul `HEAD` locale quando il repository è offline o non dispone di un remoto utilizzabile.

## Provisioning dei file ignorati

Aggiungi `.worktreeinclude` nella radice del repository sorgente per copiare in un nuovo worktree determinati file ignorati e non tracciati. Il file utilizza la sintassi dei pattern gitignore, un pattern per riga, con commenti `#`:

```gitignore
.env.local
fixtures/generated/**
```

Sono idonei solo i file segnalati da git sia come ignorati sia come non tracciati. I file tracciati sono già presenti tramite git e non vengono mai copiati in questo passaggio. OpenClaw non sovrascrive i file di destinazione né segue le directory collegate simbolicamente e mantiene le modalità dei file copiati.

## Esecuzione della configurazione del repository

Se `.openclaw/worktree-setup.sh` esiste nel repository sorgente ed è eseguibile, OpenClaw lo esegue usando il nuovo worktree come directory corrente. Lo script riceve:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Un codice di uscita diverso da zero interrompe la creazione e rimuove il nuovo worktree e il branch. Questo è un contratto locale del repository; non esiste alcuna chiave di configurazione di OpenClaw corrispondente.

## Worktree delle sessioni

Avvia una chat isolata dallo spazio di lavoro git dell'agente attivo con una sessione basata su worktree: abilita **Worktree** nella pagina New session della Control UI, che offre anche un selettore del branch di base e un nome facoltativo per il worktree, oppure usa il menu Chat actions su iOS o l'azione nel menu di overflow accanto a New Chat su Android. L'opzione è disponibile solo per un agente basato su git quando il client dispone di tale funzionalità; i client che non possono eseguire il controllo preliminare mostrano invece l'errore del Gateway.

Gli agenti di programmazione possono anche chiamare `spawn_task` quando individuano attività successive confermate al di fuori dell'attività corrente. La Control UI mostra un chip di suggerimento senza avviare nulla, mentre una TUI basata sul Gateway mostra una richiesta interattiva con le stesse azioni. Selezionando **Start in worktree** viene creata una nuova sessione con un worktree dedicato a partire dal progetto suggerito e il prompt autosufficiente viene inviato come primo turno; ignorando il suggerimento, il repository rimane invariato. I suggerimenti e i relativi ID sono temporanei e non persistono dopo il riavvio del Gateway.

OpenClaw espone questi strumenti solo alle sessioni dell'operatore con un'interfaccia Gateway utilizzabile. Le sessioni dei canali e le sessioni TUI locali o incorporate non li ricevono finché tali superfici non disporranno di un contratto portabile e tipizzato per le azioni delle attività.

Il worktree gestito risultante appartiene alla sessione e ogni esecuzione dell'agente in tale sessione utilizza il relativo checkout. Quando lo spazio di lavoro è una sottodirectory del repository, il worktree viene ancorato alla radice del repository e la sessione viene eseguita dalla sottodirectory corrispondente al suo interno. La creazione del worktree della sessione utilizza l'ambito `operator.write` del metodo, ma il passaggio `.openclaw/worktree-setup.sh` viene eseguito solo per i chiamanti `operator.admin` perché esegue codice del repository; il provisioning tramite `.worktreeinclude` continua ad applicarsi a tutti i chiamanti. L'eliminazione della sessione rimuove il worktree solo quando può avvenire senza perdita di dati. I worktree con modifiche o i branch con commit non inviati rimangono disponibili; la pulizia oraria acquisisce snapshot dei worktree delle sessioni dopo 7 giorni di inattività, considerando l'attività recente della sessione come attività del worktree. I worktree rimossi rimangono ripristinabili dai rispettivi snapshot come descritto di seguito.

`sessions.create` può includere un `cwd` assoluto insieme a `worktree: true` quando un'attività è destinata a un progetto diverso dallo spazio di lavoro configurato dell'agente. Questo percorso host esplicito richiede `operator.admin`; la normale creazione di chat con worktree rimane nell'ambito `operator.write` e resta ancorata allo spazio di lavoro configurato.

`sessions.create` accetta inoltre `worktreeBaseRef` e `worktreeName` insieme a `worktree: true` per scegliere il riferimento di base e il nome del worktree; il branch diventa `openclaw/<name>`. Entrambi rimangono nell'ambito `operator.write`. Il worktree creato viene restituito nel risultato della creazione e salvato nella riga della sessione come `worktree: { id, branch, repoRoot }`, in modo che gli elenchi delle sessioni possano mostrare il checkout e il branch. Quando si elimina una sessione, un checkout con modifiche che viene mantenuto è segnalato come `worktreePreserved` anziché essere lasciato indietro senza alcuna indicazione.

## Snapshot, pulizia e ripristino

La rimozione crea innanzitutto un commit sintetico contenente i file tracciati e i file non tracciati non ignorati e lo fissa in `refs/openclaw/snapshots/<id>`. I file ignorati da git vengono esclusi dal database degli oggetti del repository; i file selezionati tramite `.worktreeinclude` vengono copiati nuovamente durante il ripristino. Se la creazione dello snapshot non riesce, la rimozione si interrompe. Un'eliminazione forzata esplicita può continuare senza uno snapshot.

OpenClaw applica le seguenti regole di pulizia:

- Al termine dell'esecuzione, rimuove un worktree solo quando `git status --porcelain` è vuoto e `git log HEAD --not --remotes --oneline` non trova commit non inviati. In caso contrario, rilascia soltanto il blocco di attività.
- La pulizia oraria acquisisce snapshot e rimuove i worktree sbloccati appartenenti a Workboard e alle sessioni che sono inattivi da più di 7 giorni, anche in presenza di modifiche. I worktree manuali non vengono mai rimossi automaticamente.
- I record degli snapshot rimangono ripristinabili per 30 giorni. Successivamente, la pulizia elimina il riferimento dello snapshot e la riga del registro.
- Il blocco di un processo OpenClaw attivo e qualsiasi blocco git di worktree estraneo o non riconosciuto proteggono un worktree dalla garbage collection.

Il ripristino ricrea `openclaw/<name>` in corrispondenza del commit originale precedente allo snapshot, quindi ricostruisce le differenze dello snapshot come modifiche non preparate e file non tracciati. In questo modo il commit sintetico dello snapshot non entra nella cronologia del branch. Il riferimento dello snapshot rimane registrato come provenienza.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

La pagina **Worktrees** della Control UI in Settings offre le stesse azioni, oltre alla creazione con un selettore del branch di base, mostra il proprietario di ogni worktree (manuale, Workboard o la sessione proprietaria con un collegamento alla relativa chat) e consente di forzare un nuovo tentativo quando una rimozione segnala uno snapshot non riuscito.

## Metodi del Gateway

| Metodo               | Scopo                                                                   |
| -------------------- | ----------------------------------------------------------------------- |
| `worktrees.list`     | Elenca i record dei worktree attivi e ripristinabili.                   |
| `worktrees.branches` | Elenca i branch locali e remoti di un repository per i selettori del riferimento di base. |
| `worktrees.create`   | Crea o riutilizza un worktree gestito con nome.                          |
| `worktrees.remove`   | Acquisisce uno snapshot e rimuove un worktree. Le rimozioni forzate segnalano `snapshotError`. |
| `worktrees.restore`  | Ripristina un worktree rimosso dal relativo snapshot.                    |
| `worktrees.gc`       | Esegue immediatamente la pulizia per inattività, elementi orfani e criteri di conservazione. |

`worktrees.list` richiede `operator.read`, mentre i metodi che apportano modifiche richiedono `operator.admin`. `worktrees.branches` richiede `operator.write` per gli spazi di lavoro configurati degli agenti, mentre qualsiasi altro percorso host richiede `operator.admin`, in linea con il requisito relativo a `cwd` di `sessions.create`. Legge soltanto i riferimenti esistenti e non esegue mai il recupero; inoltre, i branch presenti solo sul remoto vengono restituiti con la qualificazione remota (`origin/feature-a`), così ogni nome restituito può essere risolto come riferimento di base.

## Spazi di lavoro di Workboard

Il [Plugin Workboard](/it/plugins/workboard) incluso può materializzare lo spazio di lavoro di una scheda come worktree gestito:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` identifica il checkout git sorgente. `branch` è facoltativo e diventa il riferimento di base. Quando l'assegnazione avvia il worker della scheda, Workboard crea o riutilizza `wb-<card-id>`, esegue il sottoagente usando il checkout gestito come directory di lavoro e scrive nuovamente nella scheda il percorso e il branch risolti. La materializzazione attivata dal Gateway richiede `operator.admin`. Al termine dell'esecuzione, Workboard rimuove il checkout solo quando è dimostrabile che l'operazione non comporta perdita di dati; le modifiche locali o i commit non inviati rimangono disponibili.

Attualmente, gli agenti incorporati con sandbox rifiutano una directory di lavoro dell'attività esterna allo spazio di lavoro configurato dell'agente. Usa un agente di destinazione senza sandbox per le schede di Workboard con worktree gestito finché il runtime della sandbox non supporterà un montaggio aggiuntivo del checkout.
