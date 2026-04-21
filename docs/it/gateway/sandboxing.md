---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Come funziona il sandboxing di OpenClaw: modalità, ambiti, accesso al workspace e immagini'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-21T08:23:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35405c103f37f7f7247462ed5bc54a4b0d2a19ca2a373cf10f7f231a62c2c7c4
    source_path: gateway/sandboxing.md
    workflow: 15
---

# Sandboxing

OpenClaw può eseguire gli **strumenti all'interno di backend sandbox** per ridurre il raggio d'azione di eventuali problemi.
Questa funzionalità è **opzionale** ed è controllata dalla configurazione (`agents.defaults.sandbox` o
`agents.list[].sandbox`). Se il sandboxing è disattivato, gli strumenti vengono eseguiti sull'host.
Il Gateway resta sull'host; l'esecuzione degli strumenti avviene in una sandbox isolata
quando è abilitata.

Non si tratta di un confine di sicurezza perfetto, ma limita in modo sostanziale l'accesso
al filesystem e ai processi quando il modello fa qualcosa di stupido.

## Cosa viene messo in sandbox

- Esecuzione degli strumenti (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, ecc.).
- Browser sandbox opzionale (`agents.defaults.sandbox.browser`).
  - Per impostazione predefinita, il browser sandbox si avvia automaticamente (garantisce che CDP sia raggiungibile) quando lo strumento browser ne ha bisogno.
    Configura tramite `agents.defaults.sandbox.browser.autoStart` e `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Per impostazione predefinita, i container del browser sandbox usano una rete Docker dedicata (`openclaw-sandbox-browser`) invece della rete globale `bridge`.
    Configura con `agents.defaults.sandbox.browser.network`.
  - `agents.defaults.sandbox.browser.cdpSourceRange` opzionale limita l'ingresso CDP al margine del container con una allowlist CIDR (ad esempio `172.21.0.1/32`).
  - L'accesso di osservazione noVNC è protetto da password per impostazione predefinita; OpenClaw emette un URL con token a breve durata che serve una pagina bootstrap locale e apre noVNC con la password nel fragment dell'URL (non nei log di query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` consente alle sessioni sandbox di puntare esplicitamente al browser host.
  - Allowlist opzionali controllano `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Non vengono messi in sandbox:

- Il processo Gateway stesso.
- Qualsiasi strumento esplicitamente autorizzato a essere eseguito fuori dalla sandbox (ad es. `tools.elevated`).
  - **Elevated exec aggira il sandboxing e usa il percorso di escape configurato (`gateway` per impostazione predefinita, oppure `node` quando il target di exec è `node`).**
  - Se il sandboxing è disattivato, `tools.elevated` non cambia l'esecuzione (già sull'host). Vedi [Modalità Elevated](/it/tools/elevated).

## Modalità

`agents.defaults.sandbox.mode` controlla **quando** viene usato il sandboxing:

- `"off"`: nessun sandboxing.
- `"non-main"`: sandbox solo per le sessioni **non main** (predefinito se vuoi le chat normali sull'host).
- `"all"`: ogni sessione viene eseguita in una sandbox.
  Nota: `"non-main"` è basato su `session.mainKey` (predefinito `"main"`), non sull'id dell'agente.
  Le sessioni di gruppo/canale usano le proprie chiavi, quindi sono considerate non-main e verranno messe in sandbox.

## Ambito

`agents.defaults.sandbox.scope` controlla **quanti container** vengono creati:

- `"agent"` (predefinito): un container per agente.
- `"session"`: un container per sessione.
- `"shared"`: un container condiviso da tutte le sessioni in sandbox.

## Backend

`agents.defaults.sandbox.backend` controlla **quale runtime** fornisce la sandbox:

- `"docker"` (predefinito quando il sandboxing è abilitato): runtime sandbox locale basato su Docker.
- `"ssh"`: runtime sandbox remoto generico basato su SSH.
- `"openshell"`: runtime sandbox basato su OpenShell.

La configurazione specifica SSH si trova sotto `agents.defaults.sandbox.ssh`.
La configurazione specifica OpenShell si trova sotto `plugins.entries.openshell.config`.

### Scegliere un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Dove viene eseguito** | Container locale              | Qualsiasi host accessibile via SSH | Sandbox gestita da OpenShell                    |
| **Configurazione**  | `scripts/sandbox-setup.sh`       | Chiave SSH + host di destinazione | Plugin OpenShell abilitato                      |
| **Modello del workspace** | Bind-mount o copia          | Canonico remoto (seed una volta) | `mirror` o `remote`                             |
| **Controllo di rete** | `docker.network` (predefinito: none) | Dipende dall'host remoto   | Dipende da OpenShell                                |
| **Browser sandbox** | Supportato                        | Non supportato                  | Non ancora supportato                               |
| **Bind mount**      | `docker.binds`                   | N/D                            | N/D                                                 |
| **Ideale per**      | Sviluppo locale, isolamento completo | Offload su una macchina remota | Sandbox remote gestite con sync bidirezionale opzionale |

### Backend Docker

Il sandboxing è disattivato per impostazione predefinita. Se abiliti il sandboxing e non scegli un
backend, OpenClaw usa il backend Docker. Esegue strumenti e browser sandbox
localmente tramite il socket del demone Docker (`/var/run/docker.sock`). L'isolamento del container sandbox
è determinato dai namespace Docker.

**Vincoli Docker-out-of-Docker (DooD)**:
Se distribuisci il Gateway OpenClaw stesso come container Docker, esso orchestra container sandbox fratelli usando il socket Docker dell'host (DooD). Questo introduce un vincolo specifico di mappatura dei percorsi:

- **La configurazione richiede percorsi host**: la configurazione `workspace` in `openclaw.json` DEVE contenere il **percorso assoluto dell'host** (ad es. `/home/user/.openclaw/workspaces`), non il percorso interno del container Gateway. Quando OpenClaw chiede al demone Docker di avviare una sandbox, il demone valuta i percorsi rispetto al namespace dell'OS host, non al namespace del Gateway.
- **Parità del bridge FS (mappa dei volumi identica)**: anche il processo nativo del Gateway OpenClaw scrive file heartbeat e bridge nella directory `workspace`. Poiché il Gateway valuta la stessa identica stringa (il percorso host) dal proprio ambiente containerizzato, il deployment del Gateway DEVE includere una mappa dei volumi identica che colleghi in modo nativo il namespace host (`-v /home/user/.openclaw:/home/user/.openclaw`).

Se mappi i percorsi internamente senza parità assoluta con l'host, OpenClaw genera nativamente un errore di permesso `EACCES` quando tenta di scrivere il proprio heartbeat all'interno dell'ambiente container, perché la stringa del percorso completamente qualificato non esiste nativamente.

### Backend SSH

Usa `backend: "ssh"` quando vuoi che OpenClaw metta in sandbox `exec`, gli strumenti sui file e le letture dei media su
una macchina arbitraria accessibile via SSH.

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
          // Oppure usa SecretRef / contenuti inline invece dei file locali:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Come funziona:

- OpenClaw crea una root remota per ambito sotto `sandbox.ssh.workspaceRoot`.
- Al primo utilizzo dopo la creazione o ricreazione, OpenClaw inizializza quel workspace remoto dal workspace locale una sola volta.
- Dopo di ciò, `exec`, `read`, `write`, `edit`, `apply_patch`, le letture dei media del prompt e lo staging dei media in entrata vengono eseguiti direttamente sul workspace remoto via SSH.
- OpenClaw non sincronizza automaticamente di nuovo le modifiche remote nel workspace locale.

Materiale di autenticazione:

- `identityFile`, `certificateFile`, `knownHostsFile`: usano file locali esistenti e li passano tramite la configurazione OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: usano stringhe inline o SecretRef. OpenClaw li risolve tramite il normale snapshot runtime dei secret, li scrive in file temporanei con `0600` e li elimina alla fine della sessione SSH.
- Se per lo stesso elemento sono impostati sia `*File` sia `*Data`, per quella sessione SSH ha la precedenza `*Data`.

Questo è un modello **remote-canonical**. Dopo il seed iniziale, il workspace SSH remoto diventa il vero stato della sandbox.

Conseguenze importanti:

- Le modifiche locali sull'host effettuate fuori da OpenClaw dopo il passaggio di seed non sono visibili da remoto finché non ricrei la sandbox.
- `openclaw sandbox recreate` elimina la root remota per ambito e fa di nuovo il seed dal locale al successivo utilizzo.
- Il browser sandbox non è supportato sul backend SSH.
- Le impostazioni `sandbox.docker.*` non si applicano al backend SSH.

### Backend OpenShell

Usa `backend: "openshell"` quando vuoi che OpenClaw metta in sandbox gli strumenti in un
ambiente remoto gestito da OpenShell. Per la guida completa alla configurazione, il
riferimento di configurazione e il confronto tra modalità workspace, vedi la pagina dedicata
a [OpenShell](/it/gateway/openshell).

OpenShell riusa lo stesso trasporto SSH di base e lo stesso bridge del filesystem remoto del
backend SSH generico, e aggiunge il lifecycle specifico di OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) più la modalità workspace `mirror`
opzionale.

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
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

Modalità OpenShell:

- `mirror` (predefinita): il workspace locale resta canonico. OpenClaw sincronizza i file locali in OpenShell prima di exec e sincronizza di nuovo il workspace remoto dopo exec.
- `remote`: il workspace OpenShell diventa canonico dopo la creazione della sandbox. OpenClaw inizializza una volta il workspace remoto da quello locale, poi gli strumenti sui file e exec vengono eseguiti direttamente sulla sandbox remota senza sincronizzare di nuovo le modifiche.

Dettagli del trasporto remoto:

- OpenClaw chiede a OpenShell la configurazione SSH specifica della sandbox tramite `openshell sandbox ssh-config <name>`.
- Il core scrive quella configurazione SSH in un file temporaneo, apre la sessione SSH e riusa lo stesso bridge del filesystem remoto usato da `backend: "ssh"`.
- Solo nella modalità `mirror` cambia il lifecycle: sincronizza da locale a remoto prima di exec, poi di nuovo da remoto a locale dopo exec.

Limitazioni attuali di OpenShell:

- il browser sandbox non è ancora supportato
- `sandbox.docker.binds` non è supportato sul backend OpenShell
- i controlli runtime specifici di Docker sotto `sandbox.docker.*` si applicano ancora solo al backend Docker

#### Modalità workspace

OpenShell ha due modelli di workspace. Questa è la parte che conta di più nella pratica.

##### `mirror`

Usa `plugins.entries.openshell.config.mode: "mirror"` quando vuoi che il **workspace locale resti canonico**.

Comportamento:

- Prima di `exec`, OpenClaw sincronizza il workspace locale nella sandbox OpenShell.
- Dopo `exec`, OpenClaw sincronizza il workspace remoto di nuovo nel workspace locale.
- Gli strumenti sui file operano comunque tramite il bridge sandbox, ma il workspace locale resta la fonte di verità tra i turni.

Usa questa modalità quando:

- modifichi file localmente fuori da OpenClaw e vuoi che tali modifiche appaiano automaticamente nella sandbox
- vuoi che la sandbox OpenShell si comporti il più possibile come il backend Docker
- vuoi che il workspace host rifletta le scritture della sandbox dopo ogni turno di exec

Contropartita:

- costo di sincronizzazione aggiuntivo prima e dopo exec

##### `remote`

Usa `plugins.entries.openshell.config.mode: "remote"` quando vuoi che il **workspace OpenShell diventi canonico**.

Comportamento:

- Quando la sandbox viene creata per la prima volta, OpenClaw inizializza il workspace remoto da quello locale una sola volta.
- Dopo di ciò, `exec`, `read`, `write`, `edit` e `apply_patch` operano direttamente sul workspace OpenShell remoto.
- OpenClaw **non** sincronizza di nuovo le modifiche remote nel workspace locale dopo `exec`.
- Le letture dei media al momento del prompt continuano a funzionare perché gli strumenti per file e media leggono tramite il bridge della sandbox invece di presumere un percorso host locale.
- Il trasporto è SSH nella sandbox OpenShell restituita da `openshell sandbox ssh-config`.

Conseguenze importanti:

- Se modifichi file sull'host fuori da OpenClaw dopo il passaggio di seed, la sandbox remota **non** vedrà automaticamente tali modifiche.
- Se la sandbox viene ricreata, il workspace remoto viene nuovamente inizializzato da quello locale.
- Con `scope: "agent"` o `scope: "shared"`, quel workspace remoto è condiviso nello stesso ambito.

Usa questa modalità quando:

- la sandbox deve vivere principalmente sul lato remoto di OpenShell
- vuoi un overhead di sincronizzazione inferiore per turno
- non vuoi che modifiche locali sull'host sovrascrivano silenziosamente lo stato remoto della sandbox

Scegli `mirror` se consideri la sandbox come un ambiente di esecuzione temporaneo.
Scegli `remote` se consideri la sandbox come il vero workspace.

#### Lifecycle di OpenShell

Le sandbox OpenShell sono comunque gestite tramite il normale lifecycle della sandbox:

- `openclaw sandbox list` mostra i runtime OpenShell oltre ai runtime Docker
- `openclaw sandbox recreate` elimina il runtime corrente e consente a OpenClaw di ricrearlo al successivo utilizzo
- anche la logica di prune è consapevole del backend

Per la modalità `remote`, recreate è particolarmente importante:

- recreate elimina il workspace remoto canonico per quell'ambito
- al successivo utilizzo viene inizializzato un nuovo workspace remoto a partire da quello locale

Per la modalità `mirror`, recreate principalmente reimposta l'ambiente di esecuzione remoto
perché il workspace locale resta comunque canonico.

## Accesso al workspace

`agents.defaults.sandbox.workspaceAccess` controlla **cosa può vedere** la sandbox:

- `"none"` (predefinito): gli strumenti vedono un workspace sandbox sotto `~/.openclaw/sandboxes`.
- `"ro"`: monta il workspace dell'agente in sola lettura su `/agent` (disabilita `write`/`edit`/`apply_patch`).
- `"rw"`: monta il workspace dell'agente in lettura/scrittura su `/workspace`.

Con il backend OpenShell:

- la modalità `mirror` usa comunque il workspace locale come sorgente canonica tra i turni di exec
- la modalità `remote` usa il workspace OpenShell remoto come sorgente canonica dopo il seed iniziale
- `workspaceAccess: "ro"` e `"none"` continuano comunque a limitare il comportamento di scrittura allo stesso modo

I media in entrata vengono copiati nel workspace sandbox attivo (`media/inbound/*`).
Nota sulle Skills: lo strumento `read` è radicato nella sandbox. Con `workspaceAccess: "none"`,
OpenClaw rispecchia le Skills idonee nel workspace sandbox (`.../skills`) in modo
che possano essere lette. Con `"rw"`, le Skills del workspace sono leggibili da
`/workspace/skills`.

## Bind mount personalizzati

`agents.defaults.sandbox.docker.binds` monta directory host aggiuntive nel container.
Formato: `host:container:mode` (ad es. `"/home/user/source:/source:rw"`).

I bind globali e per agente vengono **uniti** (non sostituiti). Con `scope: "shared"`, i bind per agente vengono ignorati.

`agents.defaults.sandbox.browser.binds` monta directory host aggiuntive solo nel container del **browser sandbox**.

- Quando è impostato (incluso `[]`), sostituisce `agents.defaults.sandbox.docker.binds` per il container browser.
- Quando è omesso, il container browser usa come fallback `agents.defaults.sandbox.docker.binds` (retrocompatibile).

Esempio (sorgente in sola lettura + una directory dati aggiuntiva):

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

Note di sicurezza:

- I bind aggirano il filesystem della sandbox: espongono percorsi host con la modalità che imposti (`:ro` o `:rw`).
- OpenClaw blocca sorgenti di bind pericolose (ad esempio: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` e mount superiori che le esporrebbero).
- OpenClaw blocca anche le comuni root di credenziali nella home directory come `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` e `~/.ssh`.
- La validazione dei bind non si limita al semplice confronto di stringhe. OpenClaw normalizza il percorso sorgente, poi lo risolve di nuovo attraverso l'antenato esistente più profondo prima di ricontrollare percorsi bloccati e root consentite.
- Questo significa che anche le fughe tramite symlink-parent continuano a fallire in modo chiuso anche quando il leaf finale non esiste ancora. Esempio: `/workspace/run-link/new-file` si risolve comunque come `/var/run/...` se `run-link` punta lì.
- Le root sorgente consentite vengono canonizzate nello stesso modo, quindi un percorso che solo in apparenza rientra nella allowlist prima della risoluzione dei symlink viene comunque rifiutato come `outside allowed roots`.
- I mount sensibili (secret, chiavi SSH, credenziali di servizio) dovrebbero essere `:ro` a meno che non sia assolutamente necessario.
- Combina con `workspaceAccess: "ro"` se hai bisogno solo di accesso in lettura al workspace; le modalità di bind restano indipendenti.
- Vedi [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) per come i bind interagiscono con la tool policy e con elevated exec.

## Immagini + configurazione

Immagine Docker predefinita: `openclaw-sandbox:bookworm-slim`

Compilala una volta:

```bash
scripts/sandbox-setup.sh
```

Nota: l'immagine predefinita **non** include Node. Se una skill ha bisogno di Node (o
di altri runtime), crea un'immagine personalizzata oppure installala tramite
`sandbox.docker.setupCommand` (richiede uscita di rete + root scrivibile +
utente root).

Se vuoi un'immagine sandbox più funzionale con strumenti comuni (ad esempio
`curl`, `jq`, `nodejs`, `python3`, `git`), compila:

```bash
scripts/sandbox-common-setup.sh
```

Poi imposta `agents.defaults.sandbox.docker.image` su
`openclaw-sandbox-common:bookworm-slim`.

Immagine del browser sandbox:

```bash
scripts/sandbox-browser-setup.sh
```

Per impostazione predefinita, i container sandbox Docker vengono eseguiti **senza rete**.
Puoi sovrascrivere con `agents.defaults.sandbox.docker.network`.

L'immagine del browser sandbox inclusa applica anche impostazioni di avvio conservative di Chromium
per workload containerizzati. Le impostazioni predefinite correnti del container includono:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `--no-sandbox` e `--disable-setuid-sandbox` quando `noSandbox` è abilitato.
- I tre flag di hardening grafico (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) sono opzionali e sono utili
  quando i container non dispongono di supporto GPU. Imposta `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  se il tuo workload richiede WebGL o altre funzionalità 3D/browser.
- `--disable-extensions` è abilitato per impostazione predefinita e può essere disabilitato con
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` per flussi che dipendono dalle estensioni.
- `--renderer-process-limit=2` è controllato da
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, dove `0` mantiene il valore predefinito di Chromium.

Se hai bisogno di un profilo runtime diverso, usa un'immagine browser personalizzata e fornisci
il tuo entrypoint. Per profili Chromium locali (non containerizzati), usa
`browser.extraArgs` per aggiungere flag di avvio supplementari.

Impostazioni di sicurezza predefinite:

- `network: "host"` è bloccato.
- `network: "container:<id>"` è bloccato per impostazione predefinita (rischio di bypass tramite namespace join).
- Override break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Le installazioni Docker e il gateway containerizzato si trovano qui:
[Docker](/it/install/docker)

Per i deployment del gateway Docker, `scripts/docker/setup.sh` può inizializzare la configurazione della sandbox.
Imposta `OPENCLAW_SANDBOX=1` (o `true`/`yes`/`on`) per abilitare questo percorso. Puoi
sovrascrivere la posizione del socket con `OPENCLAW_DOCKER_SOCKET`. Configurazione completa e riferimento
delle variabili d'ambiente: [Docker](/it/install/docker#agent-sandbox).

## setupCommand (configurazione del container una tantum)

`setupCommand` viene eseguito **una sola volta** dopo la creazione del container sandbox (non a ogni esecuzione).
Viene eseguito all'interno del container tramite `sh -lc`.

Percorsi:

- Globale: `agents.defaults.sandbox.docker.setupCommand`
- Per agente: `agents.list[].sandbox.docker.setupCommand`

Problemi comuni:

- Il valore predefinito di `docker.network` è `"none"` (nessun egress), quindi le installazioni di pacchetti falliranno.
- `docker.network: "container:<id>"` richiede `dangerouslyAllowContainerNamespaceJoin: true` ed è solo break-glass.
- `readOnlyRoot: true` impedisce le scritture; imposta `readOnlyRoot: false` o crea un'immagine personalizzata.
- `user` deve essere root per installare pacchetti (ometti `user` o imposta `user: "0:0"`).
- Sandbox exec **non** eredita `process.env` dell'host. Usa
  `agents.defaults.sandbox.docker.env` (o un'immagine personalizzata) per le chiavi API delle skill.

## Tool policy + escape hatch

Le policy di allow/deny degli strumenti continuano ad applicarsi prima delle regole della sandbox. Se uno strumento è negato
globalmente o per agente, il sandboxing non lo ripristina.

`tools.elevated` è un'escape hatch esplicita che esegue `exec` fuori dalla sandbox (`gateway` per impostazione predefinita, oppure `node` quando il target di exec è `node`).
Le direttive `/exec` si applicano solo ai mittenti autorizzati e persistono per sessione; per disabilitare rigidamente
`exec`, usa il deny della tool policy (vedi [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debug:

- Usa `openclaw sandbox explain` per ispezionare la modalità sandbox effettiva, la tool policy e le chiavi di configurazione fix-it.
- Vedi [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) per il modello mentale del tipo “perché questo è bloccato?”.
  Mantienilo ben chiuso.

## Override multi-agent

Ogni agente può sovrascrivere sandbox + strumenti:
`agents.list[].sandbox` e `agents.list[].tools` (più `agents.list[].tools.sandbox.tools` per la tool policy della sandbox).
Vedi [Sandbox & Tools multi-agent](/it/tools/multi-agent-sandbox-tools) per la precedenza.

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

## Documenti correlati

- [OpenShell](/it/gateway/openshell) -- configurazione del backend sandbox gestito, modalità workspace e riferimento di configurazione
- [Configurazione Sandbox](/it/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) -- debug di “perché questo è bloccato?”
- [Sandbox & Tools multi-agent](/it/tools/multi-agent-sandbox-tools) -- override per agente e precedenza
- [Sicurezza](/it/gateway/security)
