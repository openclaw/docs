---
read_when:
    - Si ospitano più domini di attendibilità tenant su un unico computer
    - È necessario creare, ispezionare, aggiornare o rimuovere le celle della flotta
summary: Riferimento CLI per il provisioning e la gestione di celle OpenClaw isolate per tenant
title: Flotta
x-i18n:
    generated_at: "2026-07-16T14:13:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: be589500e4715541f175caf0d5135a96baee4874e64c60c8b6f188ff1f70bc9f
    source_path: cli/fleet.md
    workflow: 16
---

# `openclaw fleet`

`openclaw fleet` gestisce istanze OpenClaw complete denominate **celle**. Ogni cella dispone di un proprio Gateway, stato, credenziali, account dei canali, container e porta host accessibile solo tramite loopback. Utilizzare una cella per ogni confine di attendibilità tra tenant; non utilizzare un unico Gateway condiviso come confine multi-tenant in presenza di soggetti ostili.

Fleet è **sperimentale**. I nomi dei comandi, i flag, i formati di output e il profilo del container possono cambiare tra una versione e l'altra senza un periodo di deprecazione.

Fleet supporta Docker e Podman. L'immagine predefinita è `ghcr.io/openclaw/openclaw:latest`.

Fleet è testato su host Linux e macOS. Gli host Windows non sono attualmente testati.

## Avvio rapido

```bash
openclaw fleet create acme
openclaw fleet status acme
openclaw fleet list
```

`fleet create` stampa una sola volta il token Gateway generato insieme all'URL della cella. Archiviare immediatamente il token, quindi configurare gli account dei canali di ciascun tenant all'interno della relativa cella.

## ID tenant

Gli ID tenant devono corrispondere a:

```text
^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$
```

Sono consentiti da 1 a 40 lettere minuscole, cifre e trattini interni. Un ID deve iniziare e terminare con una lettera o una cifra. Lettere maiuscole, trattini bassi, barre, punti, spazi e stringhe di attraversamento come `../acme` vengono rifiutati.

L'ID diventa parte del nome del container: `openclaw-cell-<tenant>`.

## `fleet create`

Creare una cella e avviarla:

```bash
openclaw fleet create acme
```

Creare una cella Podman su una porta fissa senza avviarla:

```bash
openclaw fleet create acme \
  --runtime podman \
  --port 19125 \
  --no-start
```

Passare variabili di ambiente specifiche del tenant ripetendo `--env`:

```bash
openclaw fleet create acme \
  --env TZ=America/Los_Angeles \
  --env OPENCLAW_DISABLE_BONJOUR=1
```

Le chiavi di ambiente utilizzano lettere, cifre e trattini bassi e non possono iniziare con una cifra. I valori devono occupare una sola riga perché Fleet li passa tramite un file di ambiente del runtime protetto. Fleet rifiuta i tentativi di sovrascrivere le variabili gestite relative ai percorsi del container e al token Gateway elencate in [Archiviazione e struttura del container](#storage-and-container-layout).

### Opzioni di creazione

| Opzione                    | Valore predefinito                               | Descrizione                                                                                    |
| ------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `--image <ref>`           | `ghcr.io/openclaw/openclaw:latest`    | Immagine del container per la cella.                                                                  |
| `--runtime <runtime>`     | `docker`                              | CLI del container: `docker` o `podman`.                                                           |
| `--port <number>`         | Allocata automaticamente a partire da `19100`  | Porta host di loopback. Una porta selezionata esplicitamente non deve appartenere a un'altra cella registrata.    |
| `--memory <value>`        | `2g`                                  | Limite di memoria del container nella sintassi Docker/Podman.                                                |
| `--cpus <value>`          | `2`                                   | Limite CPU del container.                                                                           |
| `--disk <size>`           | Nessuno                                  | Limita il livello scrivibile del container quando il backend di archiviazione supporta le quote.                     |
| `--network <mode>`        | `bridge`                              | Modalità di rete in uscita: `bridge` o `internal`.                                                 |
| `--pids-limit <number>`   | `512`                                 | Numero massimo di processi nel container.                                                  |
| `--env <KEY=VALUE>`       | Nessuno                                  | Passa una variabile di ambiente alla cella. Ripetere per più valori.                          |
| `--gateway-token <value>` | Token esadecimale casuale di 32 caratteri | Utilizza un token Gateway fornito anziché generarne uno. Consultare [Gestione dei token](#token-handling). |
| `--no-start`              | La cella viene avviata                           | Crea il container senza avviarlo.                                                      |
| `--json`                  | Output leggibile                           | Stampa un output leggibile dalla macchina.                                                                 |

L'allocazione automatica seleziona la prima porta del registro inutilizzata pari o superiore a `19100`. Fleet rifiuta gli ID tenant duplicati e le porte esplicite già assegnate a un'altra cella.

I riferimenti alle immagini vengono passati come un singolo argomento al runtime del container. I riferimenti vuoti e i valori che iniziano con `-` vengono rifiutati per impedire che un'immagine venga interpretata come un'opzione Docker o Podman.

L'endpoint Docker o Podman selezionato deve essere locale. Fleet rifiuta i contesti Docker remoti, gli endpoint `DOCKER_HOST` e i servizi Podman remoti prima di riservare una porta o creare lo stato locale. Gli host remoti per le celle non sono supportati.

Quando Fleet avvia una nuova cella, il comando di creazione attende fino a circa un minuto che il relativo Gateway risponda a `/healthz`. Se la cella non raggiunge uno stato integro, Fleet mantiene intatti il container e la riga del registro per `fleet status`, `fleet logs` o la rimozione esplicita. `--no-start` ignora questo controllo di integrità. Il token Gateway generato per una nuova cella non integra non viene perso: rimane nell'ambiente del container (`docker|podman inspect`) e, poiché la cella non ha ancora gestito traffico, `fleet rm --force` seguito da una nuova creazione è sempre un'alternativa sicura.

### Blocco tramite digest

I comandi di creazione e aggiornamento accettano riferimenti a immagini bloccati tramite digest, come `--image ghcr.io/openclaw/openclaw@sha256:<digest>`. Fleet passa il riferimento all'immagine senza modificarlo a Docker o Podman, consentendo all'operatore di mantenere una cella su byte di immagine immutabili anziché su un tag variabile.

Il risultato della creazione include l'ID tenant, il nome del container, la porta host, il token Gateway e l'URL locale. Anche nell'output JSON, trattare il risultato come contenente informazioni riservate perché include il token.

### Limiti del disco

`--disk` limita esclusivamente il livello scrivibile del container. Le directory di stato e autenticazione per tenant montate tramite bind rimangono nello spazio di archiviazione dell'host; utilizzare le quote di progetto del file system host quando anche tali directory richiedono un limite rigido.

| Backend runtime/archiviazione | Supporto di `--disk`                                                             |
| ----------------------- | ---------------------------------------------------------------------------- |
| Docker overlay2 su XFS  | Richiede l'opzione di montaggio XFS `pquota`.                                      |
| Docker btrfs o zfs     | Supportato dal driver di archiviazione.                                             |
| Podman overlay          | Richiede un'archiviazione sottostante XFS.                                                |
| Altri backend          | La creazione del container non riesce e restituisce l'errore del daemon e le indicazioni di Fleet relative al backend. |

### Criteri per il traffico in uscita

| Modalità       | Docker                                                                                                | Podman                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `bridge`   | Supportata; il traffico in uscita non è limitato per impostazione predefinita.                                                | Supportata; il traffico in uscita non è limitato per impostazione predefinita.                              |
| `internal` | Rifiutata perché Docker non mantiene la porta Gateway di loopback pubblicata su una rete interna. | Supportata; il Gateway di loopback rimane pubblicato mentre il traffico in uscita è bloccato. |

Per Docker, mantenere la modalità bridge e applicare i criteri per il traffico in uscita mediante regole del firewall host, come la catena `DOCKER-USER`.

## `fleet list`

Elencare le celle in ordine di ID tenant:

```bash
openclaw fleet list
openclaw fleet ls
openclaw fleet list --json
```

La tabella contiene:

| Colonna    | Significato                                                                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant`  | ID tenant.                                                                                                                                                                                                                                                                            |
| `state`   | Stato attuale del container ottenuto dall'ispezione Docker o Podman. `unknown` indica che il runtime non era disponibile oppure che esiste un container con il nome della cella, ma le relative etichette di proprietà Fleet non corrispondono al record del registro (segnale di collisione o manomissione — ispezionarlo manualmente prima di intervenire). |
| `port`    | Porta host di loopback associata al Gateway della cella.                                                                                                                                                                                                                                        |
| `image`   | Immagine del container registrata.                                                                                                                                                                                                                                                             |
| `created` | Ora di creazione della cella.                                                                                                                                                                                                                                                                   |

Le righe del registro rimangono visibili quando Docker o Podman non è disponibile; solo lo stato attuale diventa `unknown`.

## `fleet status`

Esaminare una cella:

```bash
openclaw fleet status acme
openclaw fleet status acme --json
```

Lo stato combina la riga del registro Fleet, l'ispezione attuale del container e una breve richiesta con il massimo impegno possibile a:

```text
http://127.0.0.1:<host-port>/healthz
```

Il risultato del controllo di integrità è `ok`, `failed` o `skipped`. `/healthz` dimostra che il Gateway è attivo, non che ogni canale o Plugin configurato sia completamente pronto. Il probe viene ignorato quando non è disponibile un endpoint locale utilizzabile da controllare.

## `fleet logs`

Trasmettere i log del container di una cella direttamente al terminale:

```bash
openclaw fleet logs acme
openclaw fleet logs acme --follow
openclaw fleet logs acme --tail 200
openclaw fleet logs acme --since 10m
```

Fleet verifica le etichette di proprietà del container registrato prima di leggere qualsiasi log, pertanto rifiuta un container estraneo che utilizza il nome previsto della cella. Il flusso è vincolato all'ID del container ispezionato, quindi una sostituzione simultanea non può reindirizzarlo a una generazione più recente. Premere Ctrl-C per terminare `--follow` senza considerare l'interruzione da parte dell'operatore come un errore del comando. L'output dei log viene inoltrato attraverso un filtro di oscuramento che sostituisce il token Gateway corrente della cella con `<redacted>` prima che qualsiasi contenuto raggiunga il terminale.

`fleet logs` non dispone di una modalità `--json` perché i log del container sono un flusso stdout/stderr non elaborato. Per gli script, limitare l'output con `--tail` e utilizzare il normale reindirizzamento della shell o le pipeline.

## `fleet start`, `fleet stop` e `fleet restart`

Controllare una cella esistente con il runtime registrato:

```bash
openclaw fleet start acme
openclaw fleet stop acme
openclaw fleet restart acme
```

Questi comandi operano sul nome del container registrato. Non riescono se il tenant è sconosciuto o se il runtime registrato non può eseguire l'operazione.

## `fleet upgrade`

Scaricare nuovamente l'immagine registrata e sostituire il container della cella:

```bash
openclaw fleet upgrade acme
```

Spostare la cella su un'altra immagine:

```bash
openclaw fleet upgrade acme --image ghcr.io/openclaw/openclaw:<version>
```

L'aggiornamento scarica l'immagine di destinazione, ispeziona il container esistente e la rete per cella, arresta e rimuove il container, quindi lo ricrea e lo avvia. La sostituzione mantiene la stessa porta host, le directory dei dati, la rete bridge per cella, il profilo del runtime, i limiti delle risorse, la politica di riavvio, l'ambiente gestito da Fleet e i valori forniti originariamente con `--env`. Lo stato montato sopravvive alla sostituzione del container; l'ambiente predefinito dell'immagine può cambiare con l'immagine di destinazione.

La sostituzione viene confermata solo dopo che il relativo Gateway risponde a `/healthz` sulla porta di loopback della cella, in conformità al contratto di integrità usato dal file Compose ufficiale. Una sostituzione che termina, entra in un ciclo di arresti anomali o non diventa integra entro circa un minuto viene rimossa e il container precedente viene ripristinato, così un'immagine non funzionante non rende indisponibile una cella operativa.

Il token del Gateway non viene intenzionalmente memorizzato nel registro di Fleet. Prima di rimuovere il vecchio container, Fleet ne legge l'ambiente e trasferisce `OPENCLAW_GATEWAY_TOKEN` nel container sostitutivo. Non rimuovere manualmente il vecchio container prima di un aggiornamento se il token non è disponibile altrove sotto il proprio controllo.

## `fleet backup` e `fleet restore`

Eseguire il backup di una cella arrestata:

```bash
openclaw fleet stop acme
openclaw fleet backup acme --out ./acme.tgz
```

Ripristinare l'archivio nella cella registrata:

```bash
openclaw fleet restore acme --from ./acme.tgz
```

Questi sono comandi che richiedono privilegi da operatore dell'host. Gli archivi contengono lo stato del tenant e segreti di autenticazione, vengono creati con la modalità `0600` e devono essere conservati come credenziali. Il backup rifiuta una cella in esecuzione affinché lo stato SQLite venga acquisito in modo coerente. Il ripristino rifiuta una cella in esecuzione a meno che non venga specificato `--force`, sostituisce solo lo stato di quel tenant, ruota il token del Gateway e stampa una sola volta il nuovo token. Fleet esegue il backup di un tenant alla volta; il backup di tutti i tenant è un'operazione separata dell'operatore.

Il ripristino richiede un container esistente e arrestato, poiché il profilo del runtime ottenuto dalla relativa ispezione fornisce i limiti, la mappatura dell'utente, la provenienza dell'ambiente e l'immagine per la sostituzione. Se il container registrato è stato rimosso esternamente, eseguire prima `fleet rm <tenant> --force` senza `--purge-data`, ricreare la cella con l'immagine prevista e `--no-start`, quindi riprovare il ripristino. La prima rimozione mantiene intatte entrambe le directory dei dati del tenant.

Entrambi i comandi accettano `--max-bytes <bytes>` per limitare i dati dei file archiviati o estratti ed entrambi applicano lo stesso limite fisso di un milione di segmenti di percorso dell'archivio, affinché gli archivi malevoli composti solo da metadati non possano esaurire gli inode dell'host e ogni backup accettato rimanga ripristinabile. Il backup accetta `--out <path>` ed entrambi i comandi supportano `--json`.

Gli archivi contengono esclusivamente file normali e directory. Il backup non segue né memorizza mai collegamenti simbolici, collegamenti fisici, socket o nodi di dispositivo; il numero di elementi ignorati viene riportato nel risultato. Il ripristino rifiuta gli archivi contenenti qualsiasi altro tipo di voce. Gli alberi di collegamenti simbolici ricreabili, come `node_modules` dell'area di lavoro, devono essere reinstallati all'interno della cella dopo un ripristino.

## `fleet doctor`

Verificare tutte le celle o un singolo tenant senza modificare lo stato del runtime o del file system:

```bash
openclaw fleet doctor
openclaw fleet doctor acme --json
```

Doctor verifica la località del runtime, le etichette di proprietà, l'integrità, la protezione avanzata, i limiti delle risorse, l'associazione della porta di loopback, la presenza del token, la proprietà della rete e la modalità di uscita, nonché le autorizzazioni delle directory di stato private. Gli avvisi descrivono le celle arrestate o le differenze di proprietà; qualsiasi verifica non riuscita imposta un codice di uscita del processo diverso da zero.

## `fleet rm`

Rimuovere una cella arrestata dal runtime e dal registro mantenendo i dati del tenant:

```bash
openclaw fleet rm acme
```

Un container in esecuzione richiede `--force`:

```bash
openclaw fleet rm acme --force
```

Rimuovere definitivamente anche i dati della cella:

```bash
openclaw fleet rm acme --purge-data --force
```

Fleet rimuove il container della cella prima di rimuoverne la rete bridge dedicata. `--purge-data` richiede `--force`. Prima dell'eliminazione ricorsiva, Fleet risolve entrambe le radici di proprietà di Fleet ed entrambe le directory per tenant. Ogni destinazione deve essere esattamente la directory terminale prevista per il tenant, trovarsi rigorosamente all'interno della propria radice e non essere un collegamento simbolico. Questi controlli di contenimento impediscono che un percorso del registro danneggiato o un collegamento simbolico tra tenant reindirizzi l'eliminazione altrove.

L'eliminazione definitiva può essere ritentata quando una directory del tenant nel percorso esatto previsto è già assente. Ciò consente a un'esecuzione successiva di completare la pulizia dopo un errore parziale del file system senza rendere meno rigorosi i controlli sui percorsi per le directory ancora esistenti.

## Archiviazione e struttura dei container

Lo stato della cella e le chiavi di crittografia dei profili di autenticazione utilizzano percorsi host distinti per ciascun tenant nella directory di stato attiva di OpenClaw:

```text
<state-dir>/fleet/cells/<tenant>/
<state-dir>/fleet/auth-profile-secrets/<tenant>/
```

La prima directory viene montata in `/home/node/.openclaw`. La seconda viene montata in `/home/node/.config/openclaw`, in conformità al montaggio della chiave di crittografia della configurazione Docker ufficiale. La chiave di crittografia non viene quindi esposta sotto il normale montaggio dello stato né inclusa quando viene eseguito il backup o condivisa solo la directory dello stato della cella. Entrambe le directory sopravvivono alla normale rimozione e all'aggiornamento; `fleet rm --purge-data --force` elimina entrambe dopo controlli di contenimento separati.

Prima del primo avvio, Fleet inizializza la configurazione della cella con `gateway.mode=local`, l'autenticazione tramite token, l'associazione LAN del container e le origini della Control UI per la porta host allocata. Il valore del token non viene scritto in tale configurazione, ma rimane nell'ambiente del container.

Fleet fissa i percorsi del container dell'immagine ufficiale con questi valori di ambiente:

| Variabile                 | Valore del container                      |
| ------------------------ | ------------------------------------ |
| `HOME`                   | `/home/node`                         |
| `OPENCLAW_HOME`          | `/home/node`                         |
| `OPENCLAW_STATE_DIR`     | `/home/node/.openclaw`               |
| `OPENCLAW_CONFIG_PATH`   | `/home/node/.openclaw/openclaw.json` |
| `OPENCLAW_WORKSPACE_DIR` | `/home/node/.openclaw/workspace`     |
| `OPENCLAW_GATEWAY_TOKEN` | Token della cella generato o fornito     |

L'immagine ufficiale usa per impostazione predefinita l'utente non root `node` con UID 1000. Fleet mantiene scrivibili i montaggi bind privati `0700` senza renderli accessibili a tutti. Docker rootful esegue la cella con UID e GID dell'utente non root che lo invoca; Docker rootless usa l'UID 0 del container, che viene mappato all'utente host non privilegiato che effettua l'invocazione nello spazio dei nomi utente del daemon. Podman usa `keep-id` con l'UID e il GID di chi effettua l'invocazione. Quando Fleet viene eseguito come root con un runtime rootful, mantiene l'utente dell'immagine e assegna i file iniziali dei montaggi all'UID/GID 1000.

Sugli host SELinux, i montaggi Docker e Podman ricevono una rietichettatura privata `:Z`. Se si ripristinano o si spostano i dati della cella, mantenere i percorsi montati tramite bind scrivibili dall'utente effettivo del container. Il profilo è compatibile con la modalità rootless, ma Docker o Podman devono essere già configurati per il funzionamento rootless sull'host; Fleet non converte un daemon rootful in uno rootless.

## Profilo di sicurezza

Fleet applica il seguente profilo a ogni cella:

| Controllo              | Profilo applicato                                      | Motivo                                                                                    |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Funzionalità Linux   | `--cap-drop=ALL`                                     | Il Gateway è un processo Node.js e non richiede funzionalità Linux aggiuntive.                |
| Escalation dei privilegi | `--security-opt no-new-privileges`                   | Impedisce ai processi di ottenere privilegi tramite file binari setuid o setgid.          |
| Processo init         | `--init`                                             | Recupera i processi discendenti e inoltra i segnali del ciclo di vita del container.                   |
| Limite dei processi        | `--pids-limit 512` per impostazione predefinita                        | Limita la creazione di processi tramite fork e l'esaurimento dei processi.                                                    |
| Limite di memoria         | `--memory 2g` per impostazione predefinita                             | Limita l'uso della memoria della cella.                                                                |
| Limite CPU            | `--cpus 2` per impostazione predefinita                                | Limita l'uso della CPU della cella.                                                                   |
| Disco del livello scrivibile  | `--disk` facoltativo                                    | Limita il livello del container quando il backend di archiviazione del runtime supporta le quote.           |
| Politica di riavvio       | `--restart unless-stopped`                           | Riavvia una cella non riuscita senza ignorare un arresto intenzionale.                         |
| Pubblicazione sull'host      | Solo `127.0.0.1:<host-port>:18789`                   | Mantiene il Gateway lontano dalle interfacce host con caratteri jolly.                                        |
| Rete della cella         | Un bridge o una rete interna Podman per cella       | Separa il traffico IP dei container e, facoltativamente, blocca il traffico in uscita di Podman.           |
| Identità del container   | Mappatura utente corrispondente all'host                            | Mantiene scrivibili i montaggi bind privati senza concedere l'accesso a tutti.                      |
| Stato persistente     | Montaggi per cella; nessun montaggio dello stato condiviso               | Mantiene configurazione, credenziali, sessioni e aree di lavoro del tenant nell'albero dei dati di quel tenant. |
| Comando del container    | `node dist/index.js gateway --bind lan --port 18789` | Resta in ascolto sulla rete del container affinché la mappatura della porta host limitata al loopback possa raggiungerlo.  |

Fleet non monta mai `/var/run/docker.sock`, non usa `--privileged` né la rete host e non aggiunge funzionalità. Il bridge per cella costituisce un confine di separazione tra celle, non un firewall in uscita: le celle mantengono l'accesso alla rete in uscita necessario per provider e canali. Anteporre alla porta di loopback un proxy, un tunnel SSH o una configurazione tailnet adeguata alla distribuzione. `http://127.0.0.1:<port>` è direttamente raggiungibile solo dall'host di Fleet.

Questo profilo separa i container dei tenant, ma non protegge i tenant dall'operatore di Fleet, dall'amministratore del runtime dei container o da un host compromesso. Consultare [Hosting multi-tenant](/gateway/multi-tenant-hosting) per il modello di attendibilità completo e opzioni di isolamento più efficaci.

## Gestione dei token

Per impostazione predefinita, `fleet create` genera un token del Gateway esadecimale di 32 caratteri crittograficamente casuale e lo stampa una sola volta nel risultato della creazione. Conservarlo nel gestore di segreti approvato ed evitare di acquisire nei log l'output della creazione.

`--gateway-token` inserisce un token personalizzato negli argomenti del processo locale, che potrebbero essere conservati nella cronologia della shell o visibili negli elenchi dei processi. Preferire il token generato, a meno che un flusso di lavoro esistente per la gestione dei segreti non richieda un valore fornito.

Il token e ogni valore passato con `--env` risiedono nell'ambiente del container. Fleet li scrive in un file di ambiente temporaneo con modalità `0600`, passa a Docker o Podman solo il percorso di tale file e lo rimuove al termine del comando del runtime. I valori digitati esplicitamente in `openclaw fleet create --gateway-token ...` o `--env KEY=VALUE` possono comunque essere visibili negli argomenti del processo esterno `openclaw` e nella cronologia della shell.

I valori dell'ambiente del container non sono nascosti all'operatore host attendibile: gli amministratori di Docker o Podman possono leggerli tramite l'ispezione del container. La nota «mostrato una sola volta» di Fleet descrive il normale output della CLI, non la protezione da un amministratore dell'host.

## Correlati

- [Hosting multi-tenant](/gateway/multi-tenant-hosting)
- [Docker](/it/install/docker)
- [Podman](/it/install/podman)
- [Sicurezza del Gateway](/it/gateway/security)
