---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Come funziona il sandboxing di OpenClaw: modalità, ambiti, accesso all''area di lavoro e immagini'
title: Sandboxing
x-i18n:
    generated_at: "2026-07-12T07:05:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw può eseguire gli strumenti all'interno di un backend sandbox per ridurre il raggio d'impatto. L'uso della sandbox è disattivato per impostazione predefinita ed è controllato da `agents.defaults.sandbox` (globale) o `agents.list[].sandbox` (per agente). Il processo Gateway rimane sempre sull'host; quando la sandbox è abilitata, solo l'esecuzione degli strumenti viene spostata al suo interno.

<Note>
Non è un confine di sicurezza perfetto, ma limita concretamente l'accesso al file system e ai processi quando il modello compie operazioni errate.
</Note>

## Cosa viene eseguito nella sandbox

- Esecuzione degli strumenti: `exec`, `read`, `write`, `edit`, `apply_patch`, `process` e così via.
- Il browser opzionale eseguito nella sandbox (`agents.defaults.sandbox.browser`).

Non vengono eseguiti nella sandbox:

- Il processo Gateway stesso.
- Qualsiasi strumento esplicitamente autorizzato a essere eseguito all'esterno della sandbox tramite `tools.elevated`. L'esecuzione con privilegi elevati elude la sandbox e utilizza il percorso di uscita configurato (`gateway` per impostazione predefinita oppure `node` quando la destinazione di esecuzione è `node`). Se la sandbox è disattivata, `tools.elevated` non cambia nulla, poiché l'esecuzione avviene già sull'host. Consulta [Modalità con privilegi elevati](/it/tools/elevated).

## Modalità, ambito e backend

Tre impostazioni indipendenti controllano il comportamento della sandbox:

| Impostazione | Chiave                            | Valori                       | Predefinito |
| ------------- | --------------------------------- | ---------------------------- | ----------- |
| Modalità      | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`       |
| Ambito        | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`     |
| Backend       | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker`    |

La **modalità** controlla quando viene applicata la sandbox:

- `off`: nessuna sandbox.
- `non-main`: esegue nella sandbox ogni sessione tranne la sessione principale dell'agente. La chiave della sessione principale è sempre `agent:<agentId>:main` (oppure `global` quando `session.scope` è `"global"`); non è configurabile. Le sessioni di gruppo/canale utilizzano chiavi proprie, quindi sono sempre considerate non principali e vengono eseguite nella sandbox.
- `all`: ogni sessione viene eseguita in una sandbox.

L'**ambito** controlla quanti contenitori/ambienti vengono creati:

- `agent`: un contenitore per agente.
- `session`: un contenitore per sessione.
- `shared`: un contenitore condiviso da tutte le sessioni eseguite nella sandbox (con questo ambito, le sostituzioni `docker`/`ssh`/`browser` per agente vengono ignorate).

Il **backend** controlla quale runtime esegue gli strumenti nella sandbox. La configurazione specifica per SSH si trova in `agents.defaults.sandbox.ssh`; quella specifica per OpenShell si trova in `plugins.entries.openshell.config`.

|                          | Docker                            | SSH                                      | OpenShell                                                    |
| ------------------------ | --------------------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| **Dove viene eseguito**  | Contenitore locale                | Qualsiasi host accessibile tramite SSH   | Sandbox gestita da OpenShell                                  |
| **Configurazione**       | `scripts/sandbox-setup.sh`        | Chiave SSH + host di destinazione        | Plugin OpenShell abilitato                                    |
| **Modello dello spazio di lavoro** | Montaggio associato o copia | Remoto canonico (inizializzazione unica) | `mirror` o `remote`                                           |
| **Controllo della rete** | `docker.network` (predefinito: nessuno) | Dipende dall'host remoto             | Dipende da OpenShell                                          |
| **Sandbox del browser**  | Supportata                        | Non supportata                           | Non ancora supportata                                         |
| **Montaggi associati**   | `docker.binds`                    | N/D                                      | N/D                                                          |
| **Ideale per**           | Sviluppo locale, isolamento completo | Delega a una macchina remota         | Sandbox remote gestite con sincronizzazione bidirezionale opzionale |

## Backend Docker

Docker è il backend predefinito quando viene abilitata la sandbox. Esegue localmente gli strumenti e i browser nella sandbox tramite il socket del daemon Docker (`/var/run/docker.sock`); l'isolamento è fornito dagli spazi dei nomi Docker.

Valori predefiniti: `network: "none"` (nessun traffico in uscita), `readOnlyRoot: true`, `capDrop: ["ALL"]`, immagine `openclaw-sandbox:bookworm-slim`.

Per rendere disponibili le GPU dell'host, imposta `agents.defaults.sandbox.docker.gpus` (o la sostituzione per agente) su un valore come `"all"` o `"device=GPU-uuid"`. Il valore viene passato al flag `--gpus` di Docker e richiede un runtime host compatibile, come NVIDIA Container Toolkit.

<Warning>
**Vincoli di Docker-out-of-Docker (DooD)**

Se distribuisci il Gateway OpenClaw stesso come contenitore Docker, questo orchestra contenitori sandbox affiancati usando il socket Docker dell'host (DooD). Ciò introduce un vincolo di mappatura dei percorsi:

- **La configurazione richiede percorsi dell'host**: il valore `workspace` in `openclaw.json` deve contenere il **percorso assoluto dell'host** (ad esempio `/home/user/.openclaw/workspaces`), non il percorso interno del contenitore Gateway. Il daemon Docker valuta i percorsi rispetto allo spazio dei nomi del sistema operativo host, non rispetto allo spazio dei nomi del Gateway.
- **È richiesta una mappatura dei volumi corrispondente**: il processo Gateway scrive anche i file di Heartbeat e del bridge in quel percorso `workspace`. Assegna al contenitore Gateway una mappatura del volume identica (`-v /home/user/.openclaw:/home/user/.openclaw`), affinché lo stesso percorso dell'host venga risolto correttamente anche dall'interno del contenitore Gateway. Mappature non corrispondenti generano `EACCES` quando il Gateway tenta di scrivere il proprio Heartbeat.
- **Modalità codice di Codex**: quando una sandbox OpenClaw è attiva, per quel turno OpenClaw disabilita la Modalità codice nativa dell'app-server Codex, i server MCP dell'utente e l'esecuzione dei Plugin supportati da app, poiché vengono eseguiti dal processo app-server sull'host del Gateway e non dal backend sandbox di OpenClaw, a meno che i criteri degli strumenti della sandbox non espongano gli strumenti necessari e tu non scelga esplicitamente il percorso sperimentale del server di esecuzione nella sandbox. L'accesso alla shell viene quindi instradato tramite strumenti supportati dalla sandbox OpenClaw, come `sandbox_exec` e `sandbox_process`. Non montare il socket Docker dell'host nei contenitori sandbox degli agenti o nelle sandbox Codex personalizzate. Consulta [Harness Codex](/it/plugins/codex-harness) per il comportamento completo.

Sugli host Ubuntu/AppArmor con la modalità sandbox Docker abilitata, l'esecuzione della shell `workspace-write` dell'app-server Codex richiede spazi dei nomi utente senza privilegi all'interno del contenitore sandbox e può non riuscire prima dell'avvio della shell se l'utente del servizio non è in grado di crearli. Quando il traffico in uscita dalla sandbox Docker è disabilitato (`network: "none"`, l'impostazione predefinita), è necessario anche uno spazio dei nomi di rete senza privilegi. Sintomi comuni: `bwrap: setting up uid map: Permission denied` e `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Esegui `openclaw doctor`; se segnala un errore del controllo degli spazi dei nomi bwrap di Codex, preferisci un profilo AppArmor che conceda gli spazi dei nomi necessari al processo del servizio OpenClaw. `kernel.apparmor_restrict_unprivileged_userns=0` è una soluzione alternativa estesa all'intero host con compromessi in termini di sicurezza; usala solo quando il livello di sicurezza di quell'host lo consente.
</Warning>

### Browser nella sandbox

- Il browser nella sandbox si avvia automaticamente (assicurando che CDP sia raggiungibile) quando lo strumento browser ne ha bisogno. Configuralo tramite `agents.defaults.sandbox.browser.autoStart` (valore predefinito `true`) e `autoStartTimeoutMs` (valore predefinito 12 s).
- I contenitori del browser nella sandbox utilizzano una rete Docker dedicata (`openclaw-sandbox-browser`) invece della rete globale `bridge`. Configurala con `agents.defaults.sandbox.browser.network`.
- `agents.defaults.sandbox.browser.cdpSourceRange` limita l'ingresso CDP al confine del contenitore tramite un elenco CIDR consentito (ad esempio `172.21.0.1/32`).
- Per impostazione predefinita, l'accesso dell'osservatore noVNC è protetto da password; OpenClaw genera un URL con token di breve durata che fornisce una pagina di avvio locale e apre noVNC con la password nel frammento dell'URL, non nella stringa di query o nei log delle intestazioni.
- `agents.defaults.sandbox.browser.allowHostControl` (valore predefinito `false`) consente alle sessioni nella sandbox di selezionare esplicitamente il browser dell'host come destinazione.
- Elenchi consentiti opzionali controllano `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

## Backend SSH

Usa `backend: "ssh"` per eseguire nella sandbox `exec`, gli strumenti per i file e le letture multimediali su una macchina arbitraria accessibile tramite SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // In alternativa, usa SecretRefs o contenuti inline invece dei file locali:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Valori predefiniti: `command: "ssh"`, `workspaceRoot: "/tmp/openclaw-sandboxes"`, `strictHostKeyChecking: true`, `updateHostKeys: true`.

- **Ciclo di vita**: OpenClaw crea una radice remota per ambito in `sandbox.ssh.workspaceRoot`. Al primo utilizzo dopo la creazione o la ricreazione, inizializza una sola volta lo spazio di lavoro remoto a partire da quello locale. Successivamente, `exec`, `read`, `write`, `edit`, `apply_patch`, le letture dei contenuti multimediali dei prompt e la predisposizione dei contenuti multimediali in ingresso operano direttamente sullo spazio di lavoro remoto tramite SSH. OpenClaw non sincronizza automaticamente le modifiche remote con lo spazio di lavoro locale.
- **Materiale di autenticazione**: `identityFile`/`certificateFile`/`knownHostsFile` fanno riferimento a file locali esistenti. `identityData`/`certificateData`/`knownHostsData` accettano stringhe inline o SecretRefs, risolti tramite la normale istantanea del runtime dei segreti, scritti in file temporanei con modalità `0600` ed eliminati al termine della sessione SSH. Se per lo stesso elemento sono impostate sia una variante `*File` sia una variante `*Data`, per quella sessione prevale `*Data`.
- **Conseguenze del modello remoto canonico**: dopo l'inizializzazione iniziale, lo spazio di lavoro SSH remoto diventa lo stato effettivo della sandbox. Le modifiche locali sull'host apportate all'esterno di OpenClaw dopo la fase di inizializzazione non sono visibili in remoto finché non ricrei la sandbox. `openclaw sandbox recreate` elimina la radice remota per ambito ed esegue nuovamente l'inizializzazione dal contenuto locale al successivo utilizzo. La sandbox del browser non è supportata su questo backend e le impostazioni `sandbox.docker.*` non si applicano.

## Backend OpenShell

Usa `backend: "openshell"` per eseguire gli strumenti in una sandbox all'interno di un ambiente remoto gestito da OpenShell. OpenShell riutilizza lo stesso trasporto SSH e lo stesso bridge del file system remoto del backend SSH generico, aggiungendo il ciclo di vita di OpenShell (`sandbox create/get/delete/ssh-config`) e una modalità opzionale di sincronizzazione dello spazio di lavoro `mirror`.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
        },
      },
    },
  },
}
```

`mode: "mirror"` (valore predefinito) mantiene canonico lo spazio di lavoro locale: OpenClaw sincronizza il contenuto locale nella sandbox prima di `exec` e lo sincronizza nuovamente in locale al termine. `mode: "remote"` inizializza una sola volta lo spazio di lavoro remoto dal contenuto locale, quindi esegue `exec`/`read`/`write`/`edit`/`apply_patch` direttamente sullo spazio di lavoro remoto senza sincronizzare le modifiche in locale; le modifiche locali successive all'inizializzazione non sono visibili finché non esegui `openclaw sandbox recreate`. Con `scope: "agent"` o `scope: "shared"`, lo spazio di lavoro remoto viene condiviso nello stesso ambito. Limitazioni attuali: la sandbox del browser non è ancora supportata e `sandbox.docker.binds` non si applica a questo backend.

`openclaw sandbox list`/`recreate`/prune trattano tutti i runtime OpenShell allo stesso modo dei runtime Docker; la logica di eliminazione è consapevole del backend.

Per i prerequisiti completi, il riferimento alla configurazione, il confronto tra le modalità dello spazio di lavoro e i dettagli sul ciclo di vita, consulta [OpenShell](/it/gateway/openshell).

## Accesso allo spazio di lavoro

`agents.defaults.sandbox.workspaceAccess` controlla ciò che la sandbox può vedere:

| Valore           | Comportamento                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| `none` (predefinito) | Gli strumenti vedono uno spazio di lavoro sandbox isolato in `~/.openclaw/sandboxes`.                        |
| `ro`             | Monta lo spazio di lavoro dell'agente in sola lettura in `/agent` (disabilita `write`/`edit`/`apply_patch`).       |
| `rw`             | Monta lo spazio di lavoro dell'agente in lettura/scrittura in `/workspace`.                                       |

Con il backend OpenShell, la modalità `mirror` continua a usare lo spazio di lavoro locale come fonte canonica tra le esecuzioni di `exec`, la modalità `remote` usa lo spazio di lavoro OpenShell remoto come fonte canonica dopo il popolamento iniziale e `workspaceAccess: "ro"`/`"none"` continua a limitare allo stesso modo le operazioni di scrittura.

I contenuti multimediali in ingresso vengono copiati nello spazio di lavoro sandbox attivo (`media/inbound/*`).

<Note>
**Skills**: lo strumento `read` è vincolato alla radice della sandbox. Con `workspaceAccess: "none"`, OpenClaw replica le Skills idonee nello spazio di lavoro sandbox (`.../skills`) affinché possano essere lette. Con `"rw"`, le Skills dello spazio di lavoro sono leggibili da `/workspace/skills`, mentre le Skills idonee gestite, incluse nel pacchetto o fornite da Plugin vengono materializzate nel percorso generato di sola lettura `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Montaggi bind personalizzati

`agents.defaults.sandbox.docker.binds` monta nel contenitore directory aggiuntive dell'host. Formato: `host:container:mode` (ad esempio, `"/home/user/source:/source:rw"`).

I bind globali e quelli per agente vengono uniti, non sostituiti. Con `scope: "shared"`, i bind per agente vengono ignorati.

`agents.defaults.sandbox.browser.binds` monta directory aggiuntive dell'host solo nel contenitore del **browser sandbox**. Quando è impostato (anche su `[]`), sostituisce `docker.binds` per il contenitore del browser; quando è omesso, il contenitore del browser usa `docker.binds` come ripiego.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

<Warning>
**Sicurezza dei bind**

- I bind aggirano il file system della sandbox: espongono percorsi dell'host con la modalità impostata (`:ro` o `:rw`).
- Per impostazione predefinita, OpenClaw blocca le origini bind pericolose: percorsi di sistema (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), directory dei socket Docker (`/run`, `/var/run` e le relative varianti `docker.sock`) e comuni directory radice delle credenziali nella home (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`).
- La convalida normalizza il percorso di origine, quindi lo risolve nuovamente attraverso l'antenato esistente più profondo prima di ricontrollare i percorsi bloccati e le radici consentite; in questo modo, i tentativi di evasione tramite un collegamento simbolico in un percorso padre vengono bloccati in modo sicuro anche quando l'elemento finale non esiste ancora (ad esempio, `/workspace/run-link/new-file` viene comunque risolto come `/var/run/...` se `run-link` punta a tale percorso).
- Anche le destinazioni bind che oscurano i punti di montaggio riservati del contenitore (`/workspace`, `/agent`) vengono bloccate per impostazione predefinita; per ignorare il blocco, impostare `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`.
- Le origini bind esterne alle radici consentite dello spazio di lavoro o dello spazio di lavoro dell'agente vengono bloccate per impostazione predefinita; per ignorare il blocco, impostare `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true`. Le radici consentite vengono canonicalizzate nello stesso modo, quindi un percorso che sembra rientrare nell'elenco consentito solo prima della risoluzione dei collegamenti simbolici viene comunque rifiutato perché esterno alle radici consentite.
- I montaggi sensibili (segreti, chiavi SSH, credenziali di servizio) devono essere `:ro`, a meno che la scrittura non sia assolutamente necessaria.
- Abbinare a `workspaceAccess: "ro"` se è necessario solo l'accesso in lettura allo spazio di lavoro; le modalità dei bind restano indipendenti.
- Consultare [Sandbox, criteri degli strumenti ed esecuzione con privilegi elevati](/it/gateway/sandbox-vs-tool-policy-vs-elevated) per informazioni sull'interazione dei bind con i criteri degli strumenti e l'esecuzione con privilegi elevati.

</Warning>

## Immagini e configurazione

Immagine Docker predefinita: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout del sorgente e installazione npm**

Gli script di supporto `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` e `scripts/sandbox-browser-setup.sh` sono disponibili solo durante l'esecuzione da un [checkout del sorgente](https://github.com/openclaw/openclaw). Non sono inclusi nel pacchetto npm.

Se OpenClaw è stato installato tramite `npm install -g openclaw`, usare invece i comandi `docker build` incorporati mostrati di seguito.
</Note>

<Steps>
  <Step title="Compilare l'immagine predefinita">
    Da un checkout del sorgente:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Da un'installazione npm (non è necessario un checkout del sorgente):

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    L'immagine predefinita **non** include Node. Se una Skill richiede Node o altri ambienti di esecuzione, creare un'immagine personalizzata che li includa oppure installarli tramite `sandbox.docker.setupCommand` (richiede accesso di rete in uscita, una radice scrivibile e l'utente root).

    OpenClaw non sostituisce automaticamente `openclaw-sandbox:bookworm-slim` con la semplice immagine `debian:bookworm-slim` quando la prima non è disponibile. Le esecuzioni sandbox che usano l'immagine predefinita terminano immediatamente mostrando le istruzioni di compilazione finché l'immagine non viene creata, perché l'immagine fornita include `python3` per gli strumenti di scrittura e modifica della sandbox.

  </Step>
  <Step title="Facoltativo: compilare l'immagine comune">
    Per un'immagine sandbox più funzionale con strumenti comuni, ad esempio `curl`, `jq`, Node 24, pnpm, `python3` e `git`:

    Da un checkout del sorgente:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Da un'installazione npm, compilare prima l'immagine predefinita (vedere sopra), quindi compilare l'immagine comune sovrapponendola tramite [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) dal repository.

    Impostare quindi `agents.defaults.sandbox.docker.image` su `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Facoltativo: compilare l'immagine del browser sandbox">
    Da un checkout del sorgente:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Da un'installazione npm, compilare usando [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) dal repository.

  </Step>
</Steps>

Per impostazione predefinita, i contenitori della sandbox Docker vengono eseguiti **senza rete**. Per modificare questa impostazione, usare `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Impostazioni predefinite di Chromium nel browser sandbox">
    L'immagine fornita del browser sandbox applica opzioni di avvio conservative di Chromium per i carichi di lavoro in contenitori:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--password-store=basic`
    - `--use-mock-keychain`
    - `--headless=new` quando `browser.headless` è abilitato.
    - `--no-sandbox --disable-setuid-sandbox` quando `browser.noSandbox` è abilitato.
    - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer` per impostazione predefinita; queste opzioni di rafforzamento della sicurezza grafica sono utili per i contenitori senza supporto GPU. Impostare `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se il carico di lavoro richiede WebGL o altre funzionalità 3D.
    - `--disable-extensions` per impostazione predefinita; impostare `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` per i flussi che dipendono dalle estensioni.
    - `--renderer-process-limit=2` per impostazione predefinita; controllato da `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, dove `0` mantiene il valore predefinito di Chromium.

    Se è necessario un profilo di esecuzione diverso, usare un'immagine del browser personalizzata e fornire un entrypoint proprio. Per i profili Chromium locali, non eseguiti in contenitori, usare `browser.extraArgs` per aggiungere ulteriori opzioni di avvio.

  </Accordion>
  <Accordion title="Impostazioni predefinite per la sicurezza della rete">
    - `network: "host"` è bloccato.
    - `network: "container:<id>"` è bloccato per impostazione predefinita a causa del rischio di aggiramento tramite l'unione dello spazio dei nomi.
    - Opzione di emergenza: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Le installazioni Docker e il Gateway in contenitore sono descritti qui: [Docker](/it/install/docker)

Per le distribuzioni del Gateway Docker, `scripts/docker/setup.sh` può inizializzare la configurazione della sandbox. Impostare `OPENCLAW_SANDBOX=1` (oppure `true`/`yes`/`on`) per abilitare questo percorso. Per modificare la posizione del socket, usare `OPENCLAW_DOCKER_SOCKET`. Configurazione completa e riferimento delle variabili di ambiente: [Docker](/it/install/docker#agent-sandbox).

## setupCommand (configurazione una tantum del contenitore)

`setupCommand` viene eseguito **una sola volta** dopo la creazione del contenitore sandbox, non a ogni esecuzione. Viene eseguito all'interno del contenitore tramite `sh -lc`.

Percorsi:

- Globale: `agents.defaults.sandbox.docker.setupCommand`
- Per agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Problemi comuni">
    - Il valore predefinito di `docker.network` è `"none"` (nessun accesso in uscita), quindi le installazioni dei pacchetti non riusciranno.
    - `docker.network: "container:<id>"` richiede `dangerouslyAllowContainerNamespaceJoin: true` ed è esclusivamente un'opzione di emergenza.
    - `readOnlyRoot: true` impedisce le scritture; impostare `readOnlyRoot: false` oppure creare un'immagine personalizzata.
    - Per installare pacchetti, `user` deve essere root: omettere `user` oppure impostare `user: "0:0"`.
    - L'esecuzione nella sandbox **non** eredita il `process.env` dell'host. Usare `agents.defaults.sandbox.docker.env` o un'immagine personalizzata per le chiavi API delle Skills.
    - I valori in `agents.defaults.sandbox.docker.env` vengono passati come variabili di ambiente esplicite del contenitore Docker. Chiunque disponga dell'accesso al daemon Docker può esaminarli con comandi per i metadati Docker come `docker inspect`. Se questa esposizione nei metadati non è accettabile, usare un'immagine personalizzata, un file di segreti montato o un altro metodo di distribuzione dei segreti.

  </Accordion>
</AccordionGroup>

## Criteri degli strumenti e vie di fuga

I criteri di autorizzazione e negazione degli strumenti vengono comunque applicati prima delle regole della sandbox. Se uno strumento è negato a livello globale o per agente, la sandbox non lo rende nuovamente disponibile.

`tools.elevated` è una via di fuga esplicita che esegue `exec` all'esterno della sandbox, nel `gateway` per impostazione predefinita oppure nel `node` quando la destinazione di esecuzione è `node`. Le direttive `/exec` si applicano solo ai mittenti autorizzati e persistono per la sessione; per disabilitare completamente `exec`, usare il criterio di negazione degli strumenti (consultare [Sandbox, criteri degli strumenti ed esecuzione con privilegi elevati](/it/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debug:

- `openclaw sandbox list` mostra i contenitori sandbox, lo stato, la corrispondenza dell'immagine, l'età, il tempo di inattività e la sessione o l'agente associato.
- `openclaw sandbox explain [--session <key>] [--agent <id>]` esamina la modalità sandbox effettiva, lo spazio di lavoro dell'host, la directory di lavoro dell'ambiente di esecuzione, i montaggi Docker, i criteri degli strumenti e le chiavi di configurazione per la correzione. Il campo `workspaceRoot` resta la radice sandbox configurata; `effectiveHostWorkspaceRoot` indica dove risiede effettivamente lo spazio di lavoro attivo.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` rimuove contenitori e ambienti affinché vengano ricreati con la configurazione corrente al successivo utilizzo.
- Consultare [Sandbox, criteri degli strumenti ed esecuzione con privilegi elevati](/it/gateway/sandbox-vs-tool-policy-vs-elevated) per il modello mentale che spiega perché un'operazione viene bloccata.

## Sostituzioni per più agenti

Ogni agente può sostituire le impostazioni della sandbox e degli strumenti: `agents.list[].sandbox` e `agents.list[].tools`, oltre a `agents.list[].tools.sandbox.tools` per i criteri degli strumenti della sandbox. Consultare [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) per l'ordine di precedenza.

## Esempio minimo di abilitazione

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Pagine correlate

- [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) -- sostituzioni specifiche per agente e precedenza
- [OpenShell](/it/gateway/openshell) -- configurazione del backend sandbox gestito, modalità dell'area di lavoro e riferimento della configurazione
- [Configurazione della sandbox](/it/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox, criteri degli strumenti e modalità con privilegi elevati a confronto](/it/gateway/sandbox-vs-tool-policy-vs-elevated) -- risoluzione del problema "perché è bloccato?"
- [Sicurezza](/it/gateway/security)
