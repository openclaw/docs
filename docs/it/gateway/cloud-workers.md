---
read_when: You want agent sessions to run on ephemeral cloud machines instead of the Gateway host, or you are configuring cloudWorkers profiles.
sidebarTitle: Cloud Workers
status: active
summary: 'Distribuzione delle sessioni su macchine cloud temporanee: provisioning, runtime dei worker, inferenza tramite proxy e risultati in streaming'
title: Worker cloud
x-i18n:
    generated_at: "2026-07-16T14:22:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c20b3b4f1408ed3ef0beb155a207f99476323cf67eba7b44931eec32c79e52be
    source_path: gateway/cloud-workers.md
    workflow: 16
---

I worker cloud consentono a una sessione di eseguire il proprio ciclo dell'agente su una macchina cloud temporanea, mentre tutto ciò che riguarda la sessione rimane dove si trova abitualmente: visibile nella barra laterale, trasmesso in tempo reale, con la trascrizione di proprietà del Gateway. Il Gateway prende in lease una macchina, vi installa una copia bloccata di OpenClaw, sincronizza lo spazio di lavoro della sessione e affida il ciclo del turno a un processo `openclaw worker` con restrizioni. Le chiamate al modello vengono inoltrate tramite proxy al Gateway, quindi le credenziali del provider non lasciano mai la macchina locale e la cache dei prompt continua a funzionare perché il provider vede un unico flusso continuo.

Al termine del lavoro (o in caso di arresto della macchina), la macchina viene eliminata. Lo stato persistente — trascrizione, commit dello spazio di lavoro, record di posizionamento — risiede presso il Gateway.

<Note>
I worker cloud sono facoltativi e invisibili finché non si configura un profilo. Le installazioni non configurate non mostrano nuovi RPC, configurazioni o elementi dell'interfaccia utente.
</Note>

## Cosa viene eseguito e dove

| Ambito                                                  | Posizione                                                                        |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Ciclo dell'agente + strumenti (`exec`, `read`, `write`, `edit`, …) | Macchina del worker cloud                                                        |
| Inferenza del modello e credenziali del provider        | Gateway (inoltrate tramite proxy mediante il riferimento `{provider, model}`)     |
| Trascrizione (persistente, archivio della sessione)     | Gateway                                                                          |
| Streaming in tempo reale nella barra laterale           | Distribuzione del Gateway, alimentata dal flusso di eventi riproducibile del worker |
| Cronologia Git dello spazio di lavoro                   | Creata sulla macchina senza credenziali; il Gateway acquisisce i commit e gestisce push/PR |

La macchina non richiede porte in ingresso, ad eccezione di `sshd`: il Gateway stabilisce una connessione in uscita tramite SSH con chiave bloccata e un tunnel inverso trasporta la WebSocket del worker. Il provider Crabbox incluso impone la route SSH pubblica e disabilita la registrazione gestita a Tailscale. L'accesso a Internet in uscita dipende dalla policy del provider; il profilo AWS predefinito può accedere a Internet, a meno che non se ne limiti la rete o il gruppo di sicurezza.

## Requisiti

- Un Plugin provider per worker. Il Plugin `crabbox` incluso gestisce la CLI [Crabbox](https://github.com/openclaw/crabbox), che intermedia i lease tra backend cloud (AWS, Hetzner e altri). Il binario `crabbox` deve trovarsi in `PATH` (oppure impostare `settings.binary`) e le credenziali del provider devono essere già configurate. L'ammissione AWS richiede Crabbox 0.38.1 o versione successiva.
- Per i worker AWS di Crabbox, il valore effettivo di `aws.instanceProfile` deve essere vuoto. Il provider controlla `crabbox config show --json` prima dell'allocazione, quindi richiede che `crabbox inspect --json` segnali `providerMetadata.instanceProfileAttached: false` dai `DescribeInstances` EC2. I lease con un ruolo di istanza o privi di metadati autorevoli vengono arrestati e rifiutati.
- Node.js sulla macchina presa in lease. Le immagini cloud essenziali in genere non lo includono: installarlo nel comando `setup` del profilo.
- Una sessione con un worktree gestito di proprietà della sessione (crearne uno con `worktree: true`). L'invio trasferisce il contenuto di tale worktree; le directory normali vengono sincronizzate come copia speculare del manifest.

## Configurazione

Aggiungere un profilo in `cloudWorkers.profiles` all'interno di `openclaw.json`:

```json
{
  "cloudWorkers": {
    "profiles": {
      "aws": {
        "provider": "crabbox",
        "install": "bundle",
        "settings": {
          "provider": "aws",
          "class": "standard",
          "ttl": "8h",
          "idleTimeout": "45m",
          "setup": "test -x /usr/bin/node || (curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs)"
        }
      }
    }
  }
}
```

Campi del profilo:

| Chiave     | Significato                                                                                                                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | ID del provider per worker registrato da un Plugin (`crabbox` per il Plugin incluso).                                                                                                                                                          |
| `install`  | `bundle` (predefinito) distribuisce la build del Gateway in esecuzione; `npm` installa la versione esatta del Gateway rilasciata con integrità bloccata. `npm` richiede che il Gateway venga eseguito da una release pacchettizzata. |
| `settings` | JSON di proprietà del provider. Per crabbox: `provider` (backend), `class` (classe della macchina), `ttl`, `idleTimeout` (durate Go), `setup` facoltativo e percorso assoluto `binary`. OpenClaw impone SSH pubblico e disabilita Tailscale gestito per questi lease. |
| `lifetime` | Policy memorizzata facoltativa (`idleTimeoutMinutes`, `maxLifetimeMinutes`).                                                                                                                                                                  |

### Il comando di configurazione

`settings.setup` viene eseguito sulla macchina presa in lease dopo che è pronta per SSH e prima dell'installazione di OpenClaw. Viene eseguito a **ogni** tentativo di provisioning (incluse le ripetizioni dopo un invio interrotto), quindi deve essere idempotente: proteggere le installazioni con un controllo `command -v`/`test -x` come nell'esempio. Se la configurazione non riesce, il provider arresta il lease e l'invio termina in sicurezza; nessuna macchina configurata solo parzialmente rimane in esecuzione.

### Canali di installazione

- **`bundle`** impacchetta `dist` del Gateway in esecuzione, un `package.json` ridotto e tutti i pacchetti dello spazio di lavoro a cui fa riferimento la build, tutti protetti da un hash del contenuto. La macchina verifica il bundle integro rispetto a tale hash, quindi installa le dipendenze npm di produzione (con gli script disabilitati). In questo modo è possibile eseguire una build di sviluppo su un worker.
- **`npm`** verifica che la release esista nel registro pubblico, ne blocca l'integrità SHA-512 e installa `openclaw@<version>` corrispondente esattamente al Gateway.

## Invio di una sessione

Nell'interfaccia di controllo, aprire **Nuova sessione**, scegliere un agente il cui runtime configurato sia OpenClaw, selezionare una destinazione **Cloud · profilo** configurata dal menu **Dove** e avviare l'attività. La selezione del cloud abilita automaticamente il worktree gestito richiesto; il Gateway crea la sessione, completa l'invio e solo successivamente invia il primo turno. Il badge del server nella barra laterale della sessione mostra lo stato persistente del posizionamento. Le destinazioni cloud non vengono proposte per i cataloghi di sessioni CLI esterne.

Il flusso RPC equivalente è:

Creare una sessione con un worktree gestito, quindi inviarla (l'RPC richiede `operator.admin` ed esiste solo quando sono configurati dei profili):

I worker cloud eseguono il runtime dell'agente OpenClaw. Scegliere un `openai/*` o un altro modello che venga risolto in tale runtime; le sessioni configurate per un runtime CLI esterno come `claude-cli` non possono essere inviate.

```bash
openclaw gateway call sessions.create \
  --params '{"key":"agent:main:big-refactor","worktree":true,"cwd":"/path/to/repo","worktreeName":"big-refactor"}'

openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

`sessions.dispatch` chiude l'ammissione locale dei turni, attende il completamento del lavoro attivo, esegue il provisioning del lease, avvia la configurazione, inizializza OpenClaw, sincronizza lo spazio di lavoro e restituisce il controllo quando il posizionamento raggiunge la proprietà del worker `active`. Prevedere diversi minuti per il primo invio; i lease e le installazioni vengono memorizzati nella cache quando il provider lo supporta. Successivamente, interagire con la sessione come di consueto: i turni vengono instradati automaticamente al worker.

Al termine dei turni del worker, i file idonei dello spazio di lavoro, entro i limiti dimensionali, vengono riconciliati nel worktree gestito della sessione prima del rilascio della titolarità del turno. L'evento terminale del worker crea una barriera persistente per il risultato in sospeso prima di essere confermato, in modo che il ripristino dopo un riavvio del Gateway recuperi lo spazio di lavoro remoto prima che la pulizia dei turni obsoleti possa eliminarne il proprietario. La riconciliazione autentica il manifest del worker e si interrompe in caso di divergenza locale anziché sovrascrivere uno dei due lati. Prima di modificare i file, il Gateway memorizza un registro di rollback con dimensione limitata nel proprio database di stato SQLite; un nuovo tentativo recupera tale registro dopo l'interruzione di un processo del Gateway. I risultati dello spazio di lavoro usano la semantica dei file Git: vengono mantenuti file normali, bit eseguibili, collegamenti simbolici, aggiunte, modifiche ed eliminazioni, mentre le directory vuote e le altre modalità delle directory non vengono mantenute. Gli oggetti commit remoti non vengono conservati; le modifiche risultanti ai file rimangono nel worktree gestito per la normale revisione e il commit.

Quando il lavoro è completo e non è in esecuzione alcun turno, aprire il menu della sessione e scegliere **Arresta worker cloud…**. Il Gateway esegue un'ultima riconciliazione dello spazio di lavoro prima di eliminare l'ambiente. Un posizionamento già in `draining` o `reconciling` sta completando lo smantellamento; attendere che il relativo badge diventi `reclaimed` prima di eliminare la sessione.

Per un worker collegato guasto o fuori controllo, un operatore può chiamare `environments.destroy` con `{ "force": true }` come ultima risorsa. Lo smantellamento forzato contrassegna in modo persistente il posizionamento come non riuscito e abbandona qualsiasi risultato remoto non riconciliato prima di eliminare l'ambiente.

L'RPC amministrativo equivalente è:

```bash
openclaw gateway call sessions.reclaim \
  --timeout 600000 \
  --params '{"key":"agent:main:big-refactor"}'
```

Il posizionamento attraversa una macchina a stati persistente (`local → requested → provisioning → syncing → starting → active`), quindi un riavvio del Gateway durante l'invio esegue la riconciliazione anziché lasciare macchine inutilizzate. Un turno del modello non riuscito mantiene disponibile il posizionamento attivo per un nuovo tentativo. Se la riconciliazione in ingresso dello spazio di lavoro non riesce, anche il worker rimane attivo, così l'operatore può risolvere il conflitto locale e riprovare senza perdere il risultato remoto; gli errori del ciclo di vita spostano invece il posizionamento in uno stato di errore o recuperato e ne conservano la parte finale della diagnostica.

## Modello di sicurezza

- **Ingresso del worker chiuso.** I worker comunicano tramite un protocollo dedicato sul socket nel tunnel con un elenco chiuso dei metodi consentiti: un worker non può chiamare gli RPC dell'operatore.
- **Credenziali generate, sottoposte ad hash quando archiviate.** Ogni invio genera una credenziale per il worker; il Gateway ne memorizza solo l'hash. La rotazione delle credenziali e la barriera basata sull'epoca del proprietario garantiscono al massimo un proprietario attivo per sessione: un worker obsoleto che si riconnette viene escluso, mai unito.
- **Blocco della chiave host.** Il provider deve fornire la chiave host SSH della macchina al momento del provisioning; l'inizializzazione si connette con un blocco rigoroso e termina in sicurezza in sua assenza.
- **Nessuna credenziale permanente del modello, del servizio Git o del cloud sulla macchina.** L'autenticazione del modello rimane sul Gateway (l'inferenza viaggia tramite il riferimento `{provider, model}`), i commit Git dello spazio di lavoro vengono creati senza credenziali del servizio Git e i metadati del lease AWS di Crabbox vengono verificati in modo autorevole per individuare un ruolo di istanza prima della configurazione. Anche i comandi di configurazione devono essere privi di credenziali.
- **Traffico in uscita di proprietà del provider.** Il tunnel inverso elimina qualsiasi necessità per OpenClaw di accedere direttamente al modello, ma OpenClaw non modifica i firewall del provider. Limitare il traffico in uscita nel provider del worker quando l'attività lo richiede.
- **Trascrizioni persistenti, esattamente una volta.** Il worker registra i batch della trascrizione tramite un protocollo compare-and-swap rispetto alla foglia della sessione; una base obsoleta arresta immediatamente l'esecuzione anziché duplicare o applicare un rebase all'output a pagamento.

## Risoluzione dei problemi

- **`sessions.dispatch` è un metodo sconosciuto** — non è configurato alcun `cloudWorkers.profiles`, oppure il chiamante non dispone di `operator.admin`.
- **"I turn dei worker cloud richiedono il runtime OpenClaw"** — scegliere un modello il cui runtime configurato sia OpenClaw. I runtime CLI esterni come `claude-cli` non supportano l'inferenza dei worker.
- **"Il bootstrap del worker richiede Node.js sull'host in leasing"** — aggiungere un'installazione di Node a `settings.setup` (vedere sopra).
- **L'attestazione del ruolo dell'istanza AWS non riesce** — cancellare `aws.instanceProfile` (e `CRABBOX_AWS_INSTANCE_PROFILE`, se impostato). Installare Crabbox 0.38.1 o versione successiva; i binari meno recenti non espongono il contratto autorevole `providerMetadata.instanceProfileAttached` richiesto per l'ammissione AWS.
- **L'invio non riesce con un errore del provider** — il record di posizionamento e `environments.list` conservano l'ultimo errore, inclusa la parte finale di stderr della configurazione o del bootstrap. I box vengono eliminati in caso di errore, quindi tale parte finale è la principale fonte per l'analisi forense.
- **Timeout del client durante l'invio** — `openclaw gateway call` usa per impostazione predefinita un timeout di 10s; specificare un valore generoso per `--timeout` (l'invio continua comunque sul lato server e un nuovo tentativo durante il provisioning viene rifiutato con `session cannot dispatch from placement provisioning`).
- **Gestione ordinaria dei leasing** — `crabbox list --provider <backend>` mostra i leasing attivi; `crabbox stop --provider <backend> --id <lease>` ne rilascia uno manualmente. I leasing inattivi scadono in base al valore `idleTimeout` del profilo.

## Contenuti correlati

- [Sandboxing](/it/gateway/sandboxing) — riduzione del raggio d'impatto per l'esecuzione locale degli strumenti
- [CLI delle sessioni](/it/cli/sessions) — ispezione delle sessioni archiviate
- [Riferimento per la configurazione](/it/gateway/configuration-reference)
