---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Come funziona il sandboxing di OpenClaw: modalità, ambiti, accesso all''area di lavoro e immagini'
title: Isolamento in sandbox
x-i18n:
    generated_at: "2026-05-11T20:29:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a90a68fdab1fdaef462bc6be589cb510d89c01138a0d43927e29d55bbb6e3ea
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw può eseguire **strumenti all'interno di backend sandbox** per ridurre il raggio d'impatto. È **opzionale** ed è controllato dalla configurazione (`agents.defaults.sandbox` o `agents.list[].sandbox`). Se il sandboxing è disattivato, gli strumenti vengono eseguiti sull'host. Il Gateway rimane sull'host; l'esecuzione degli strumenti avviene in una sandbox isolata quando abilitata.

<Note>
Questo non è un confine di sicurezza perfetto, ma limita concretamente l'accesso al filesystem e ai processi quando il modello fa qualcosa di stupido.
</Note>

## Cosa viene isolato in sandbox

- Esecuzione degli strumenti (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, ecc.).
- Browser opzionale in sandbox (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Dettagli del browser in sandbox">
    - Per impostazione predefinita, il browser in sandbox si avvia automaticamente (assicurando che CDP sia raggiungibile) quando lo strumento browser ne ha bisogno. Configura tramite `agents.defaults.sandbox.browser.autoStart` e `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Per impostazione predefinita, i container del browser in sandbox usano una rete Docker dedicata (`openclaw-sandbox-browser`) invece della rete globale `bridge`. Configura con `agents.defaults.sandbox.browser.network`.
    - `agents.defaults.sandbox.browser.cdpSourceRange` opzionale limita l'ingresso CDP al bordo del container con una allowlist CIDR (ad esempio `172.21.0.1/32`).
    - L'accesso osservatore noVNC è protetto da password per impostazione predefinita; OpenClaw emette un URL con token di breve durata che serve una pagina bootstrap locale e apre noVNC con la password nel frammento dell'URL (non nei log di query/header).
    - `agents.defaults.sandbox.browser.allowHostControl` consente alle sessioni in sandbox di puntare esplicitamente al browser dell'host.
    - Allowlist opzionali regolano `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Non isolato in sandbox:

- Il processo Gateway stesso.
- Qualsiasi strumento autorizzato esplicitamente a essere eseguito fuori dalla sandbox (ad es. `tools.elevated`).
  - **Elevated exec bypassa il sandboxing e usa il percorso di escape configurato (`gateway` per impostazione predefinita, oppure `node` quando la destinazione exec è `node`).**
  - Se il sandboxing è disattivato, `tools.elevated` non modifica l'esecuzione (già sull'host). Vedi [Modalità elevata](/it/tools/elevated).

## Modalità

`agents.defaults.sandbox.mode` controlla **quando** viene usato il sandboxing:

<Tabs>
  <Tab title="off">
    Nessun sandboxing.
  </Tab>
  <Tab title="non-main">
    Isola in sandbox solo le sessioni **non-main** (predefinito se vuoi chat normali sull'host).

    `"non-main"` si basa su `session.mainKey` (predefinito `"main"`), non sull'id dell'agente. Le sessioni di gruppo/canale usano le proprie chiavi, quindi contano come non-main e verranno isolate in sandbox.

  </Tab>
  <Tab title="all">
    Ogni sessione viene eseguita in una sandbox.
  </Tab>
</Tabs>

## Ambito

`agents.defaults.sandbox.scope` controlla **quanti container** vengono creati:

- `"agent"` (predefinito): un container per agente.
- `"session"`: un container per sessione.
- `"shared"`: un container condiviso da tutte le sessioni isolate in sandbox.

## Backend

`agents.defaults.sandbox.backend` controlla **quale runtime** fornisce la sandbox:

- `"docker"` (predefinito quando il sandboxing è abilitato): runtime sandbox locale basato su Docker.
- `"ssh"`: runtime sandbox remoto generico basato su SSH.
- `"openshell"`: runtime sandbox basato su OpenShell.

La configurazione specifica per SSH si trova sotto `agents.defaults.sandbox.ssh`. La configurazione specifica per OpenShell si trova sotto `plugins.entries.openshell.config`.

### Scelta di un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Dove viene eseguito** | Container locale              | Qualsiasi host accessibile via SSH | Sandbox gestita da OpenShell                    |
| **Configurazione**  | `scripts/sandbox-setup.sh`       | Chiave SSH + host di destinazione | Plugin OpenShell abilitato                       |
| **Modello workspace** | Bind-mount o copia             | Remoto canonico (seed una volta) | `mirror` o `remote`                              |
| **Controllo rete**  | `docker.network` (predefinito: none) | Dipende dall'host remoto    | Dipende da OpenShell                              |
| **Browser sandbox** | Supportato                       | Non supportato                 | Non ancora supportato                              |
| **Bind mount**      | `docker.binds`                   | N/A                            | N/A                                                 |
| **Ideale per**      | Sviluppo locale, isolamento completo | Offload su una macchina remota | Sandbox remote gestite con sincronizzazione bidirezionale opzionale |

### Backend Docker

Il sandboxing è disattivato per impostazione predefinita. Se abiliti il sandboxing e non scegli un backend, OpenClaw usa il backend Docker. Esegue strumenti e browser in sandbox localmente tramite il socket del demone Docker (`/var/run/docker.sock`). L'isolamento dei container sandbox è determinato dai namespace Docker.

Per esporre le GPU dell'host alle sandbox Docker, imposta `agents.defaults.sandbox.docker.gpus` o l'override per agente `agents.list[].sandbox.docker.gpus`. Il valore viene passato al flag `--gpus` di Docker come argomento separato, ad esempio `"all"` o `"device=GPU-uuid"`, e richiede un runtime host compatibile come NVIDIA Container Toolkit.

<Warning>
**Vincoli Docker-out-of-Docker (DooD)**

Se distribuisci lo stesso OpenClaw Gateway come container Docker, orchestra container sandbox fratelli usando il socket Docker dell'host (DooD). Questo introduce un vincolo specifico di mappatura dei percorsi:

- **La configurazione richiede percorsi host**: la configurazione `workspace` di `openclaw.json` DEVE contenere il **percorso assoluto dell'host** (ad es. `/home/user/.openclaw/workspaces`), non il percorso interno del container Gateway. Quando OpenClaw chiede al demone Docker di generare una sandbox, il demone valuta i percorsi rispetto al namespace del sistema operativo host, non al namespace del Gateway.
- **Parità bridge FS (mappa volumi identica)**: anche il processo nativo OpenClaw Gateway scrive file heartbeat e bridge nella directory `workspace`. Poiché il Gateway valuta esattamente la stessa stringa (il percorso host) dall'interno del proprio ambiente containerizzato, la distribuzione del Gateway DEVE includere una mappa volumi identica che colleghi nativamente il namespace host (`-v /home/user/.openclaw:/home/user/.openclaw`).
- **Modalità codice Codex**: quando una sandbox OpenClaw è attiva, OpenClaw vincola i turni dell'app-server Codex al sandboxing Codex `workspace-write` anche se il valore predefinito del Plugin Codex è `danger-full-access`. Non montare il socket Docker dell'host nei container sandbox degli agenti o nelle sandbox Codex personalizzate.

Se mappi i percorsi internamente senza parità assoluta con l'host, OpenClaw genera nativamente un errore di permesso `EACCES` tentando di scrivere il proprio heartbeat all'interno dell'ambiente container, perché la stringa di percorso pienamente qualificata non esiste nativamente.
</Warning>

### Backend SSH

Usa `backend: "ssh"` quando vuoi che OpenClaw isoli in sandbox `exec`, strumenti file e letture media su una macchina arbitraria accessibile via SSH.

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
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Come funziona">
    - OpenClaw crea una root remota per ambito sotto `sandbox.ssh.workspaceRoot`.
    - Al primo uso dopo creazione o ricreazione, OpenClaw esegue una sola volta il seed di quel workspace remoto dal workspace locale.
    - Dopo di ciò, `exec`, `read`, `write`, `edit`, `apply_patch`, letture media dei prompt e staging dei media in ingresso vengono eseguiti direttamente sul workspace remoto tramite SSH.
    - OpenClaw non sincronizza automaticamente le modifiche remote nel workspace locale.

  </Accordion>
  <Accordion title="Materiale di autenticazione">
    - `identityFile`, `certificateFile`, `knownHostsFile`: usano file locali esistenti e li passano attraverso la configurazione OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: usano stringhe inline o SecretRefs. OpenClaw li risolve tramite il normale snapshot runtime dei segreti, li scrive in file temporanei con `0600` e li elimina quando la sessione SSH termina.
    - Se sia `*File` sia `*Data` sono impostati per lo stesso elemento, `*Data` prevale per quella sessione SSH.

  </Accordion>
  <Accordion title="Conseguenze del remoto canonico">
    Questo è un modello **remoto canonico**. Il workspace SSH remoto diventa il vero stato della sandbox dopo il seed iniziale.

    - Le modifiche locali sull'host effettuate fuori da OpenClaw dopo il passaggio di seed non sono visibili da remoto finché non ricrei la sandbox.
    - `openclaw sandbox recreate` elimina la root remota per ambito ed esegue di nuovo il seed dal locale al successivo utilizzo.
    - Il sandboxing del browser non è supportato sul backend SSH.
    - Le impostazioni `sandbox.docker.*` non si applicano al backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Usa `backend: "openshell"` quando vuoi che OpenClaw isoli gli strumenti in sandbox in un ambiente remoto gestito da OpenShell. Per la guida completa alla configurazione, il riferimento di configurazione e il confronto delle modalità workspace, vedi la [pagina OpenShell](/it/gateway/openshell) dedicata.

OpenShell riusa lo stesso trasporto SSH principale e lo stesso bridge del filesystem remoto del backend SSH generico, e aggiunge il ciclo di vita specifico di OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) più la modalità workspace opzionale `mirror`.

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

- `mirror` (predefinita): il workspace locale rimane canonico. OpenClaw sincronizza i file locali in OpenShell prima di exec e sincronizza il workspace remoto dopo exec.
- `remote`: il workspace OpenShell è canonico dopo la creazione della sandbox. OpenClaw esegue una sola volta il seed del workspace remoto dal workspace locale, poi gli strumenti file ed exec vengono eseguiti direttamente sulla sandbox remota senza sincronizzare le modifiche indietro.

<AccordionGroup>
  <Accordion title="Dettagli del trasporto remoto">
    - OpenClaw chiede a OpenShell la configurazione SSH specifica della sandbox tramite `openshell sandbox ssh-config <name>`.
    - Core scrive quella configurazione SSH in un file temporaneo, apre la sessione SSH e riusa lo stesso bridge del filesystem remoto usato da `backend: "ssh"`.
    - In modalità `mirror` differisce solo il ciclo di vita: sincronizzazione dal locale al remoto prima di exec, poi sincronizzazione indietro dopo exec.

  </Accordion>
  <Accordion title="Limitazioni attuali di OpenShell">
    - il browser in sandbox non è ancora supportato
    - `sandbox.docker.binds` non è supportato sul backend OpenShell
    - le manopole runtime specifiche di Docker sotto `sandbox.docker.*` continuano ad applicarsi solo al backend Docker

  </Accordion>
</AccordionGroup>

#### Modalità workspace

OpenShell ha due modelli di workspace. Questa è la parte che conta di più nella pratica.

<Tabs>
  <Tab title="mirror (canonico locale)">
    Usa `plugins.entries.openshell.config.mode: "mirror"` quando vuoi che il **workspace locale rimanga canonico**.

    Comportamento:

    - Prima di `exec`, OpenClaw sincronizza lo spazio di lavoro locale nell'ambiente isolato OpenShell.
    - Dopo `exec`, OpenClaw sincronizza lo spazio di lavoro remoto di nuovo nello spazio di lavoro locale.
    - Gli strumenti per i file continuano a operare tramite il ponte dell'ambiente isolato, ma lo spazio di lavoro locale rimane la fonte di verità tra i turni.

    Usalo quando:

    - modifichi file localmente fuori da OpenClaw e vuoi che tali modifiche compaiano automaticamente nell'ambiente isolato
    - vuoi che l'ambiente isolato OpenShell si comporti il più possibile come il backend Docker
    - vuoi che lo spazio di lavoro host rifletta le scritture dell'ambiente isolato dopo ogni turno exec

    Compromesso: costo di sincronizzazione aggiuntivo prima e dopo exec.

  </Tab>
  <Tab title="remoto (OpenShell canonico)">
    Usa `plugins.entries.openshell.config.mode: "remote"` quando vuoi che lo **spazio di lavoro OpenShell diventi canonico**.

    Comportamento:

    - Quando l'ambiente isolato viene creato per la prima volta, OpenClaw inizializza una sola volta lo spazio di lavoro remoto dallo spazio di lavoro locale.
    - Dopo di ciò, `exec`, `read`, `write`, `edit` e `apply_patch` operano direttamente sullo spazio di lavoro OpenShell remoto.
    - OpenClaw **non** sincronizza le modifiche remote di nuovo nello spazio di lavoro locale dopo exec.
    - Le letture dei media al momento del prompt continuano a funzionare perché gli strumenti per file e media leggono tramite il ponte dell'ambiente isolato invece di assumere un percorso host locale.
    - Il trasporto è SSH nell'ambiente isolato OpenShell restituito da `openshell sandbox ssh-config`.

    Conseguenze importanti:

    - Se modifichi file sull'host fuori da OpenClaw dopo il passaggio di inizializzazione, l'ambiente isolato remoto **non** vedrà automaticamente tali modifiche.
    - Se l'ambiente isolato viene ricreato, lo spazio di lavoro remoto viene inizializzato di nuovo dallo spazio di lavoro locale.
    - Con `scope: "agent"` o `scope: "shared"`, quello spazio di lavoro remoto è condiviso allo stesso ambito.

    Usalo quando:

    - l'ambiente isolato dovrebbe vivere principalmente sul lato OpenShell remoto
    - vuoi ridurre il costo di sincronizzazione per turno
    - non vuoi che modifiche locali dell'host sovrascrivano silenziosamente lo stato dell'ambiente isolato remoto

  </Tab>
</Tabs>

Scegli `mirror` se consideri l'ambiente isolato come un ambiente di esecuzione temporaneo. Scegli `remote` se consideri l'ambiente isolato come il vero spazio di lavoro.

#### Ciclo di vita OpenShell

Gli ambienti isolati OpenShell sono comunque gestiti tramite il normale ciclo di vita degli ambienti isolati:

- `openclaw sandbox list` mostra sia i runtime OpenShell sia i runtime Docker
- `openclaw sandbox recreate` elimina il runtime corrente e consente a OpenClaw di ricrearlo al prossimo utilizzo
- anche la logica di pulizia è consapevole del backend

Per la modalità `remote`, la ricreazione è particolarmente importante:

- la ricreazione elimina lo spazio di lavoro remoto canonico per quell'ambito
- l'utilizzo successivo inizializza un nuovo spazio di lavoro remoto dallo spazio di lavoro locale

Per la modalità `mirror`, la ricreazione reimposta principalmente l'ambiente di esecuzione remoto perché lo spazio di lavoro locale rimane comunque canonico.

## Accesso allo spazio di lavoro

`agents.defaults.sandbox.workspaceAccess` controlla **cosa può vedere l'ambiente isolato**:

<Tabs>
  <Tab title="nessuno (predefinito)">
    Gli strumenti vedono uno spazio di lavoro dell'ambiente isolato sotto `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Monta lo spazio di lavoro dell'agente in sola lettura in `/agent` (disabilita `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Monta lo spazio di lavoro dell'agente in lettura/scrittura in `/workspace`.
  </Tab>
</Tabs>

Con il backend OpenShell:

- la modalità `mirror` usa ancora lo spazio di lavoro locale come fonte canonica tra i turni exec
- la modalità `remote` usa lo spazio di lavoro OpenShell remoto come fonte canonica dopo l'inizializzazione iniziale
- `workspaceAccess: "ro"` e `"none"` continuano a limitare il comportamento di scrittura nello stesso modo

I media in ingresso vengono copiati nello spazio di lavoro dell'ambiente isolato attivo (`media/inbound/*`).

<Note>
**Nota su Skills:** lo strumento `read` è radicato nell'ambiente isolato. Con `workspaceAccess: "none"`, OpenClaw rispecchia le Skills idonee nello spazio di lavoro dell'ambiente isolato (`.../skills`) così che possano essere lette. Con `"rw"`, le Skills dello spazio di lavoro sono leggibili da `/workspace/skills`.
</Note>

## Montaggi bind personalizzati

`agents.defaults.sandbox.docker.binds` monta directory host aggiuntive nel contenitore. Formato: `host:container:mode` (ad esempio, `"/home/user/source:/source:rw"`).

I bind globali e per agente vengono **uniti** (non sostituiti). Con `scope: "shared"`, i bind per agente vengono ignorati.

`agents.defaults.sandbox.browser.binds` monta directory host aggiuntive solo nel contenitore del **browser dell'ambiente isolato**.

- Quando è impostato (incluso `[]`), sostituisce `agents.defaults.sandbox.docker.binds` per il contenitore del browser.
- Quando è omesso, il contenitore del browser ripiega su `agents.defaults.sandbox.docker.binds` (compatibile con le versioni precedenti).

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

<Warning>
**Sicurezza dei bind**

- I bind aggirano il filesystem dell'ambiente isolato: espongono percorsi host con la modalità che imposti (`:ro` o `:rw`).
- OpenClaw blocca origini di bind pericolose (ad esempio: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` e montaggi padre che le esporrebbero).
- OpenClaw blocca anche le comuni radici di credenziali della home directory, come `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` e `~/.ssh`.
- La convalida dei bind non è solo corrispondenza di stringhe. OpenClaw normalizza il percorso di origine, quindi lo risolve di nuovo tramite l'antenato esistente più profondo prima di ricontrollare percorsi bloccati e radici consentite.
- Ciò significa che le fughe tramite padre symlink falliscono comunque in modo chiuso anche quando la foglia finale non esiste ancora. Esempio: `/workspace/run-link/new-file` si risolve comunque come `/var/run/...` se `run-link` punta lì.
- Le radici di origine consentite sono canonicalizzate nello stesso modo, quindi un percorso che sembra stare dentro la lista consentita solo prima della risoluzione dei symlink viene comunque rifiutato come `outside allowed roots`.
- I montaggi sensibili (segreti, chiavi SSH, credenziali di servizio) dovrebbero essere `:ro` salvo assoluta necessità.
- Combina con `workspaceAccess: "ro"` se ti serve solo accesso in lettura allo spazio di lavoro; le modalità dei bind restano indipendenti.
- Consulta [Ambiente isolato vs Policy degli strumenti vs Elevato](/it/gateway/sandbox-vs-tool-policy-vs-elevated) per sapere come i bind interagiscono con la policy degli strumenti e l'esecuzione elevata.

</Warning>

## Immagini e configurazione

Immagine Docker predefinita: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout del sorgente vs installazione npm**

Gli script helper `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` e `scripts/sandbox-browser-setup.sh` sono disponibili solo quando si esegue da un [checkout del sorgente](https://github.com/openclaw/openclaw). Non sono inclusi nel pacchetto npm.

Se hai installato OpenClaw tramite `npm install -g openclaw`, usa invece i comandi inline `docker build` mostrati sotto.
</Note>

<Steps>
  <Step title="Crea l'immagine predefinita">
    Da un checkout del sorgente:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Da un'installazione npm (nessun checkout del sorgente necessario):

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

    L'immagine predefinita **non** include Node. Se una skill richiede Node (o altri runtime), crea un'immagine personalizzata oppure installa tramite `sandbox.docker.setupCommand` (richiede egress di rete + root scrivibile + utente root).

    OpenClaw non sostituisce silenziosamente con il semplice `debian:bookworm-slim` quando manca `openclaw-sandbox:bookworm-slim`. Le esecuzioni dell'ambiente isolato che puntano all'immagine predefinita falliscono subito con un'istruzione di build finché non la crei, perché l'immagine inclusa contiene `python3` per gli helper di scrittura/modifica dell'ambiente isolato.

  </Step>
  <Step title="Opzionale: crea l'immagine comune">
    Per un'immagine dell'ambiente isolato più funzionale con strumenti comuni (ad esempio `curl`, `jq`, `nodejs`, `python3`, `git`):

    Da un checkout del sorgente:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Da un'installazione npm, crea prima l'immagine predefinita (vedi sopra), quindi crea l'immagine comune sopra di essa usando [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) dal repository.

    Quindi imposta `agents.defaults.sandbox.docker.image` su `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opzionale: crea l'immagine del browser dell'ambiente isolato">
    Da un checkout del sorgente:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Da un'installazione npm, crea usando [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) dal repository.

  </Step>
</Steps>

Per impostazione predefinita, i contenitori dell'ambiente isolato Docker vengono eseguiti **senza rete**. Sovrascrivi con `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Impostazioni predefinite di Chromium per il browser dell'ambiente isolato">
    L'immagine inclusa del browser dell'ambiente isolato applica anche impostazioni di avvio Chromium conservative per carichi di lavoro containerizzati. Le impostazioni predefinite correnti del contenitore includono:

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
    - `--no-sandbox` quando `noSandbox` è abilitato.
    - I tre flag di rafforzamento grafico (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) sono opzionali e sono utili quando i contenitori non dispongono di supporto GPU. Imposta `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se il tuo carico di lavoro richiede WebGL o altre funzionalità 3D/del browser.
    - `--disable-extensions` è abilitato per impostazione predefinita e può essere disabilitato con `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` per flussi che dipendono dalle estensioni.
    - `--renderer-process-limit=2` è controllato da `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, dove `0` mantiene il valore predefinito di Chromium.

    Se hai bisogno di un profilo runtime diverso, usa un'immagine browser personalizzata e fornisci il tuo entrypoint. Per profili Chromium locali (non in contenitore), usa `browser.extraArgs` per aggiungere flag di avvio aggiuntivi.

  </Accordion>
  <Accordion title="Impostazioni predefinite di sicurezza di rete">
    - `network: "host"` è bloccato.
    - `network: "container:<id>"` è bloccato per impostazione predefinita (rischio di aggiramento tramite unione dello spazio dei nomi).
    - Override di emergenza: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Le installazioni Docker e il gateway containerizzato si trovano qui: [Docker](/it/install/docker)

Per le distribuzioni del Gateway Docker, `scripts/docker/setup.sh` può inizializzare la configurazione dell'ambiente isolato. Imposta `OPENCLAW_SANDBOX=1` (o `true`/`yes`/`on`) per abilitare quel percorso. Puoi sovrascrivere la posizione del socket con `OPENCLAW_DOCKER_SOCKET`. Configurazione completa e riferimento delle variabili d'ambiente: [Docker](/it/install/docker#agent-sandbox).

## setupCommand (configurazione una tantum del contenitore)

`setupCommand` viene eseguito **una volta** dopo la creazione del contenitore dell'ambiente isolato (non a ogni esecuzione). Viene eseguito dentro il contenitore tramite `sh -lc`.

Percorsi:

- Globale: `agents.defaults.sandbox.docker.setupCommand`
- Per agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Errori comuni">
    - Il valore predefinito di `docker.network` è `"none"` (nessuna uscita), quindi le installazioni dei pacchetti falliranno.
    - `docker.network: "container:<id>"` richiede `dangerouslyAllowContainerNamespaceJoin: true` ed è solo per situazioni di emergenza.
    - `readOnlyRoot: true` impedisce le scritture; imposta `readOnlyRoot: false` oppure crea un'immagine personalizzata.
    - `user` deve essere root per le installazioni dei pacchetti (ometti `user` o imposta `user: "0:0"`).
    - L'esecuzione nella sandbox **non** eredita `process.env` dell'host. Usa `agents.defaults.sandbox.docker.env` (o un'immagine personalizzata) per le chiavi API delle skill.

  </Accordion>
</AccordionGroup>

## Criteri degli strumenti e vie di fuga

I criteri di autorizzazione/negazione degli strumenti continuano ad applicarsi prima delle regole della sandbox. Se uno strumento viene negato globalmente o per agente, la sandbox non lo rende di nuovo disponibile.

`tools.elevated` è una via di fuga esplicita che esegue `exec` fuori dalla sandbox (`gateway` per impostazione predefinita, oppure `node` quando la destinazione di esecuzione è `node`). Le direttive `/exec` si applicano solo ai mittenti autorizzati e persistono per sessione; per disabilitare completamente `exec`, usa la negazione nei criteri degli strumenti (vedi [Sandbox vs criteri degli strumenti vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debug:

- Usa `openclaw sandbox explain` per ispezionare la modalità sandbox effettiva, i criteri degli strumenti e le chiavi di configurazione per la correzione.
- Consulta [Sandbox vs criteri degli strumenti vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) per il modello mentale di "perché è bloccato?".

Mantieni tutto bloccato.

## Override multi-agente

Ogni agente può sovrascrivere sandbox e strumenti: `agents.list[].sandbox` e `agents.list[].tools` (più `agents.list[].tools.sandbox.tools` per i criteri degli strumenti della sandbox). Consulta [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) per la precedenza.

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

## Correlati

- [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) — override per agente e precedenza
- [OpenShell](/it/gateway/openshell) — configurazione del backend sandbox gestito, modalità workspace e riferimento di configurazione
- [Configurazione della sandbox](/it/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs criteri degli strumenti vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) — debug di "perché è bloccato?"
- [Sicurezza](/it/gateway/security)
