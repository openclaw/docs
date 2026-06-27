---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Come funziona il sandboxing di OpenClaw: modalità, ambiti, accesso al workspace e immagini'
title: Sandboxing
x-i18n:
    generated_at: "2026-06-27T17:34:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c9754fbfc71ee5fb48df72eece8ba3b155ce5e0d9c55aae75ce21801dceb07d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw può eseguire **strumenti all'interno di backend sandbox** per ridurre il raggio d'impatto. Questo è **opzionale** ed è controllato dalla configurazione (`agents.defaults.sandbox` o `agents.list[].sandbox`). Se il sandboxing è disattivato, gli strumenti vengono eseguiti sull'host. Il Gateway resta sull'host; l'esecuzione degli strumenti avviene in una sandbox isolata quando è abilitata.

<Note>
Questo non è un confine di sicurezza perfetto, ma limita in modo sostanziale l'accesso al filesystem e ai processi quando il modello fa qualcosa di stupido.
</Note>

## Cosa viene sandboxato

- Esecuzione degli strumenti (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, ecc.).
- Browser sandboxato opzionale (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Dettagli del browser sandboxato">
    - Per impostazione predefinita, il browser sandboxato si avvia automaticamente (assicura che CDP sia raggiungibile) quando lo strumento browser ne ha bisogno. Configura tramite `agents.defaults.sandbox.browser.autoStart` e `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Per impostazione predefinita, i container del browser sandboxato usano una rete Docker dedicata (`openclaw-sandbox-browser`) invece della rete globale `bridge`. Configura con `agents.defaults.sandbox.browser.network`.
    - L'opzione `agents.defaults.sandbox.browser.cdpSourceRange` limita l'ingresso CDP sul perimetro del container con un allowlist CIDR (per esempio `172.21.0.1/32`).
    - L'accesso dell'osservatore noVNC è protetto da password per impostazione predefinita; OpenClaw emette un URL con token di breve durata che serve una pagina di bootstrap locale e apre noVNC con la password nel frammento dell'URL (non nei log di query/header).
    - `agents.defaults.sandbox.browser.allowHostControl` consente alle sessioni sandboxate di puntare esplicitamente al browser dell'host.
    - Allowlist opzionali controllano `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Non sandboxato:

- Il processo Gateway stesso.
- Qualsiasi strumento esplicitamente autorizzato a essere eseguito fuori dalla sandbox (ad es. `tools.elevated`).
  - **Elevated exec aggira il sandboxing e usa il percorso di escape configurato (`gateway` per impostazione predefinita, oppure `node` quando il target exec è `node`).**
  - Se il sandboxing è disattivato, `tools.elevated` non modifica l'esecuzione (già sull'host). Vedi [Modalità elevata](/it/tools/elevated).

## Modalità

`agents.defaults.sandbox.mode` controlla **quando** viene usato il sandboxing:

<Tabs>
  <Tab title="off">
    Nessun sandboxing.
  </Tab>
  <Tab title="non-main">
    Sandbox solo per le sessioni **non-main** (predefinito se vuoi chat normali sull'host).

    `"non-main"` si basa su `session.mainKey` (predefinito `"main"`), non sull'id dell'agente. Le sessioni di gruppo/canale usano le proprie chiavi, quindi contano come non-main e verranno sandboxate.

  </Tab>
  <Tab title="all">
    Ogni sessione viene eseguita in una sandbox.
  </Tab>
</Tabs>

## Ambito

`agents.defaults.sandbox.scope` controlla **quanti container** vengono creati:

- `"agent"` (predefinito): un container per agente.
- `"session"`: un container per sessione.
- `"shared"`: un container condiviso da tutte le sessioni sandboxate.

## Backend

`agents.defaults.sandbox.backend` controlla **quale runtime** fornisce la sandbox:

- `"docker"` (predefinito quando il sandboxing è abilitato): runtime sandbox locale basato su Docker.
- `"ssh"`: runtime sandbox remoto generico basato su SSH.
- `"openshell"`: runtime sandbox basato su OpenShell.

La configurazione specifica per SSH si trova in `agents.defaults.sandbox.ssh`. La configurazione specifica per OpenShell si trova in `plugins.entries.openshell.config`.

### Scegliere un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Dove viene eseguito** | Container locale                  | Qualsiasi host accessibile via SSH | Sandbox gestita da OpenShell                        |
| **Configurazione**  | `scripts/sandbox-setup.sh`       | Chiave SSH + host di destinazione | Plugin OpenShell abilitato                          |
| **Modello workspace** | Bind mount o copia               | Canonico remoto (seed una volta) | `mirror` o `remote`                                 |
| **Controllo rete** | `docker.network` (predefinito: nessuno) | Dipende dall'host remoto        | Dipende da OpenShell                                |
| **Browser sandbox** | Supportato                        | Non supportato                 | Non ancora supportato                               |
| **Bind mount**     | `docker.binds`                   | N/D                            | N/D                                                 |
| **Ideale per**     | Sviluppo locale, isolamento completo | Offload su una macchina remota | Sandbox remote gestite con sincronizzazione bidirezionale opzionale |

### Backend Docker

Il sandboxing è disattivato per impostazione predefinita. Se abiliti il sandboxing e non scegli un backend, OpenClaw usa il backend Docker. Esegue strumenti e browser sandboxati localmente tramite il socket del daemon Docker (`/var/run/docker.sock`). L'isolamento del container sandbox è determinato dai namespace Docker.

Per esporre le GPU dell'host alle sandbox Docker, imposta `agents.defaults.sandbox.docker.gpus` o l'override per agente `agents.list[].sandbox.docker.gpus`. Il valore viene passato al flag `--gpus` di Docker come argomento separato, per esempio `"all"` o `"device=GPU-uuid"`, e richiede un runtime host compatibile come NVIDIA Container Toolkit.

<Warning>
**Vincoli Docker-out-of-Docker (DooD)**

Se distribuisci lo stesso OpenClaw Gateway come container Docker, orchestra container sandbox fratelli usando il socket Docker dell'host (DooD). Questo introduce un vincolo specifico di mappatura dei percorsi:

- **La configurazione richiede percorsi host**: la configurazione `workspace` di `openclaw.json` DEVE contenere il **percorso assoluto dell'host** (ad es. `/home/user/.openclaw/workspaces`), non il percorso interno del container Gateway. Quando OpenClaw chiede al daemon Docker di avviare una sandbox, il daemon valuta i percorsi rispetto al namespace del sistema operativo host, non al namespace del Gateway.
- **Parità del bridge FS (mappa dei volumi identica)**: anche il processo nativo OpenClaw Gateway scrive file heartbeat e bridge nella directory `workspace`. Poiché il Gateway valuta esattamente la stessa stringa (il percorso host) dall'interno del proprio ambiente containerizzato, la distribuzione del Gateway DEVE includere una mappa dei volumi identica che colleghi nativamente il namespace host (`-v /home/user/.openclaw:/home/user/.openclaw`).
- **Modalità codice Codex**: quando una sandbox OpenClaw è attiva, OpenClaw disabilita la modalità codice nativa del server app Codex, i server MCP utente e l'esecuzione di Plugin basati sull'app per quel turno, perché queste superfici native vengono eseguite dal processo server app sull'host Gateway invece che dal backend sandbox OpenClaw. L'accesso shell è esposto tramite strumenti basati sulla sandbox OpenClaw come `sandbox_exec` e `sandbox_process` quando i normali strumenti exec/process sono disponibili. Non montare il socket Docker dell'host nei container sandbox degli agenti o nelle sandbox Codex personalizzate.

Su host Ubuntu/AppArmor, Codex `workspace-write` può non riuscire prima dell'avvio della shell
quando esegui intenzionalmente Codex `workspace-write` nativo senza sandboxing
OpenClaw attivo e l'utente di servizio non è autorizzato a creare namespace utente
non privilegiati. Quando l'egress della sandbox Docker è disabilitato (`network: "none"`, il
valore predefinito), Codex richiede anche un namespace di rete non privilegiato. Sintomi comuni sono
`bwrap: setting up uid map: Permission denied` e
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Esegui
`openclaw doctor`; se segnala un errore della probe del namespace bwrap di Codex, preferisci
un profilo AppArmor che conceda i namespace richiesti al processo di servizio OpenClaw.
`kernel.apparmor_restrict_unprivileged_userns=0` è un fallback a livello host
con compromessi di sicurezza; usalo solo quando la postura di quell'host è
accettabile.

Se mappi percorsi internamente senza parità assoluta con l'host, OpenClaw genera nativamente un errore di permesso `EACCES` tentando di scrivere il suo heartbeat all'interno dell'ambiente container, perché la stringa del percorso pienamente qualificato non esiste nativamente.
</Warning>

### Backend SSH

Usa `backend: "ssh"` quando vuoi che OpenClaw sandboxi `exec`, gli strumenti file e le letture multimediali su una macchina arbitraria accessibile via SSH.

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
    - Al primo utilizzo dopo la creazione o ricreazione, OpenClaw inizializza quel workspace remoto dal workspace locale una volta.
    - Dopodiché, `exec`, `read`, `write`, `edit`, `apply_patch`, le letture multimediali dei prompt e lo staging dei media in ingresso vengono eseguiti direttamente sul workspace remoto tramite SSH.
    - OpenClaw non sincronizza automaticamente le modifiche remote nel workspace locale.

  </Accordion>
  <Accordion title="Materiale di autenticazione">
    - `identityFile`, `certificateFile`, `knownHostsFile`: usa file locali esistenti e passali attraverso la configurazione OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: usa stringhe inline o SecretRefs. OpenClaw li risolve tramite il normale snapshot runtime dei segreti, li scrive in file temporanei con `0600` e li elimina al termine della sessione SSH.
    - Se per lo stesso elemento sono impostati sia `*File` sia `*Data`, `*Data` prevale per quella sessione SSH.

  </Accordion>
  <Accordion title="Conseguenze canoniche remote">
    Questo è un modello **canonico remoto**. Il workspace SSH remoto diventa lo stato reale della sandbox dopo il seed iniziale.

    - Le modifiche host-locali effettuate fuori da OpenClaw dopo il passo di seed non sono visibili da remoto finché non ricrei la sandbox.
    - `openclaw sandbox recreate` elimina la root remota per ambito ed esegue di nuovo il seed dal locale al prossimo utilizzo.
    - Il sandboxing del browser non è supportato sul backend SSH.
    - Le impostazioni `sandbox.docker.*` non si applicano al backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Usa `backend: "openshell"` quando vuoi che OpenClaw sandboxi gli strumenti in un ambiente remoto gestito da OpenShell. Per la guida completa alla configurazione, il riferimento di configurazione e il confronto tra modalità workspace, vedi la [pagina OpenShell dedicata](/it/gateway/openshell).

OpenShell riusa lo stesso trasporto SSH core e lo stesso bridge del filesystem remoto del backend SSH generico, e aggiunge il ciclo di vita specifico di OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) più la modalità workspace opzionale `mirror`.

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

- `mirror` (predefinita): il workspace locale resta canonico. OpenClaw sincronizza i file locali in OpenShell prima di exec e sincronizza il workspace remoto dopo exec.
- `remote`: il workspace OpenShell è canonico dopo la creazione della sandbox. OpenClaw inizializza il workspace remoto una volta dal workspace locale, poi gli strumenti file ed exec vengono eseguiti direttamente sulla sandbox remota senza sincronizzare le modifiche indietro.

<AccordionGroup>
  <Accordion title="Dettagli del trasporto remoto">
    - OpenClaw richiede a OpenShell la configurazione SSH specifica della sandbox tramite `openshell sandbox ssh-config <name>`.
    - Il core scrive quella configurazione SSH in un file temporaneo, apre la sessione SSH e riutilizza lo stesso bridge del filesystem remoto usato da `backend: "ssh"`.
    - In modalità `mirror` cambia solo il ciclo di vita: sincronizzazione da locale a remoto prima di exec, poi sincronizzazione inversa dopo exec.

  </Accordion>
  <Accordion title="Limitazioni attuali di OpenShell">
    - il browser della sandbox non è ancora supportato
    - `sandbox.docker.binds` non è supportato sul backend OpenShell
    - le impostazioni di runtime specifiche di Docker sotto `sandbox.docker.*` continuano ad applicarsi solo al backend Docker

  </Accordion>
</AccordionGroup>

#### Modalità workspace

OpenShell ha due modelli di workspace. Questa è la parte che conta di più nella pratica.

<Tabs>
  <Tab title="mirror (locale canonico)">
    Usa `plugins.entries.openshell.config.mode: "mirror"` quando vuoi che il **workspace locale rimanga canonico**.

    Comportamento:

    - Prima di `exec`, OpenClaw sincronizza il workspace locale nella sandbox OpenShell.
    - Dopo `exec`, OpenClaw sincronizza il workspace remoto di nuovo nel workspace locale.
    - Gli strumenti sui file continuano a operare attraverso il bridge della sandbox, ma il workspace locale resta la fonte di verità tra un turno e l'altro.

    Usalo quando:

    - modifichi file localmente fuori da OpenClaw e vuoi che tali modifiche compaiano automaticamente nella sandbox
    - vuoi che la sandbox OpenShell si comporti il più possibile come il backend Docker
    - vuoi che il workspace host rifletta le scritture della sandbox dopo ogni turno exec

    Compromesso: costo di sincronizzazione aggiuntivo prima e dopo exec.

  </Tab>
  <Tab title="remote (OpenShell canonico)">
    Usa `plugins.entries.openshell.config.mode: "remote"` quando vuoi che il **workspace OpenShell diventi canonico**.

    Comportamento:

    - Quando la sandbox viene creata per la prima volta, OpenClaw inizializza una sola volta il workspace remoto dal workspace locale.
    - Dopo di che, `exec`, `read`, `write`, `edit` e `apply_patch` operano direttamente sul workspace OpenShell remoto.
    - OpenClaw **non** sincronizza le modifiche remote nel workspace locale dopo exec.
    - Le letture dei media al momento del prompt continuano a funzionare perché gli strumenti per file e media leggono attraverso il bridge della sandbox invece di presupporre un percorso host locale.
    - Il trasporto è SSH nella sandbox OpenShell restituita da `openshell sandbox ssh-config`.

    Conseguenze importanti:

    - Se modifichi file sull'host fuori da OpenClaw dopo il passaggio di inizializzazione, la sandbox remota **non** vedrà automaticamente tali modifiche.
    - Se la sandbox viene ricreata, il workspace remoto viene inizializzato di nuovo dal workspace locale.
    - Con `scope: "agent"` o `scope: "shared"`, quel workspace remoto è condiviso nello stesso ambito.

    Usalo quando:

    - la sandbox deve vivere principalmente sul lato OpenShell remoto
    - vuoi ridurre l'overhead di sincronizzazione per turno
    - non vuoi che le modifiche locali sull'host sovrascrivano silenziosamente lo stato della sandbox remota

  </Tab>
</Tabs>

Scegli `mirror` se consideri la sandbox un ambiente di esecuzione temporaneo. Scegli `remote` se consideri la sandbox il workspace reale.

#### Ciclo di vita OpenShell

Le sandbox OpenShell sono comunque gestite tramite il normale ciclo di vita della sandbox:

- `openclaw sandbox list` mostra i runtime OpenShell oltre ai runtime Docker
- `openclaw sandbox recreate` elimina il runtime corrente e consente a OpenClaw di ricrearlo al prossimo utilizzo
- anche la logica di prune è consapevole del backend

Per la modalità `remote`, recreate è particolarmente importante:

- recreate elimina il workspace remoto canonico per quell'ambito
- l'utilizzo successivo inizializza un nuovo workspace remoto dal workspace locale

Per la modalità `mirror`, recreate reimposta principalmente l'ambiente di esecuzione remoto perché il workspace locale rimane comunque canonico.

## Accesso al workspace

`agents.defaults.sandbox.workspaceAccess` controlla **cosa può vedere la sandbox**:

<Tabs>
  <Tab title="none (predefinito)">
    Gli strumenti vedono un workspace sandbox sotto `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Monta il workspace dell'agente in sola lettura in `/agent` (disabilita `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Monta il workspace dell'agente in lettura/scrittura in `/workspace`.
  </Tab>
</Tabs>

Con il backend OpenShell:

- la modalità `mirror` usa ancora il workspace locale come fonte canonica tra i turni exec
- la modalità `remote` usa il workspace OpenShell remoto come fonte canonica dopo l'inizializzazione iniziale
- `workspaceAccess: "ro"` e `"none"` continuano a limitare il comportamento di scrittura nello stesso modo

I media in ingresso vengono copiati nel workspace della sandbox attiva (`media/inbound/*`).

<Note>
**Nota Skills:** lo strumento `read` ha come radice la sandbox. Con `workspaceAccess: "none"`, OpenClaw replica le skill idonee nel workspace della sandbox (`.../skills`) così possono essere lette. Con `"rw"`, le skill del workspace sono leggibili da `/workspace/skills`, e le skill idonee gestite, in bundle o dei plugin vengono materializzate nel percorso di sola lettura generato `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Mount bind personalizzati

`agents.defaults.sandbox.docker.binds` monta directory host aggiuntive nel container. Formato: `host:container:mode` (ad esempio, `"/home/user/source:/source:rw"`).

I bind globali e per agente vengono **uniti** (non sostituiti). Con `scope: "shared"`, i bind per agente vengono ignorati.

`agents.defaults.sandbox.browser.binds` monta directory host aggiuntive solo nel container del **browser della sandbox**.

- Quando impostato (incluso `[]`), sostituisce `agents.defaults.sandbox.docker.binds` per il container del browser.
- Quando omesso, il container del browser ripiega su `agents.defaults.sandbox.docker.binds` (compatibile con le versioni precedenti).

Esempio (sorgente in sola lettura + una directory dati extra):

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

- I bind aggirano il filesystem della sandbox: espongono percorsi host con la modalità che imposti (`:ro` o `:rw`).
- OpenClaw blocca sorgenti bind pericolose (ad esempio: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` e mount padre che le esporrebbero).
- OpenClaw blocca anche le comuni radici di credenziali nelle home directory, come `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` e `~/.ssh`.
- La convalida dei bind non è semplice confronto di stringhe. OpenClaw normalizza il percorso sorgente, poi lo risolve di nuovo attraverso l'antenato esistente più profondo prima di ricontrollare percorsi bloccati e radici consentite.
- Questo significa che le fughe tramite genitore symlink continuano a fallire in modo chiuso anche quando la foglia finale non esiste ancora. Esempio: `/workspace/run-link/new-file` continua a risolversi come `/var/run/...` se `run-link` punta lì.
- Le radici sorgente consentite vengono canonicalizzate nello stesso modo, quindi un percorso che sembra dentro la allowlist solo prima della risoluzione dei symlink viene comunque rifiutato come `outside allowed roots`.
- I mount sensibili (segreti, chiavi SSH, credenziali di servizio) dovrebbero essere `:ro` salvo assoluta necessità.
- Combina con `workspaceAccess: "ro"` se ti serve solo accesso in lettura al workspace; le modalità dei bind restano indipendenti.
- Vedi [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) per come i bind interagiscono con la policy degli strumenti e l'exec elevato.

</Warning>

## Immagini e configurazione

Immagine Docker predefinita: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout sorgente vs installazione npm**

Gli script helper `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` e `scripts/sandbox-browser-setup.sh` sono disponibili solo quando si esegue da un [checkout sorgente](https://github.com/openclaw/openclaw). Non sono inclusi nel pacchetto npm.

Se hai installato OpenClaw tramite `npm install -g openclaw`, usa invece i comandi `docker build` inline mostrati sotto.
</Note>

<Steps>
  <Step title="Crea l'immagine predefinita">
    Da un checkout sorgente:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Da un'installazione npm (nessun checkout sorgente necessario):

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

    L'immagine predefinita **non** include Node. Se una skill richiede Node (o altri runtime), puoi creare un'immagine personalizzata oppure installare tramite `sandbox.docker.setupCommand` (richiede uscita di rete + root scrivibile + utente root).

    OpenClaw non sostituisce silenziosamente con un semplice `debian:bookworm-slim` quando manca `openclaw-sandbox:bookworm-slim`. Le esecuzioni della sandbox che puntano all'immagine predefinita falliscono subito con un'istruzione di build finché non la crei, perché l'immagine in bundle include `python3` per gli helper di scrittura/modifica della sandbox.

  </Step>
  <Step title="Opzionale: crea l'immagine comune">
    Per un'immagine sandbox più funzionale con strumenti comuni (ad esempio `curl`, `jq`, Node 24, pnpm, `python3` e `git`):

    Da un checkout sorgente:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Da un'installazione npm, crea prima l'immagine predefinita (vedi sopra), poi crea l'immagine comune sopra di essa usando [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) dal repository.

    Poi imposta `agents.defaults.sandbox.docker.image` su `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opzionale: crea l'immagine del browser della sandbox">
    Da un checkout sorgente:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Da un'installazione npm, crea usando [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) dal repository.

  </Step>
</Steps>

Per impostazione predefinita, i container sandbox Docker vengono eseguiti **senza rete**. Sovrascrivi con `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Impostazioni predefinite di Chromium per il browser della sandbox">
    L'immagine del browser della sandbox in bundle applica anche impostazioni conservative di avvio di Chromium per carichi di lavoro containerizzati. Le impostazioni predefinite correnti del container includono:

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
    - I tre flag di rafforzamento grafico (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) sono opzionali e utili quando i container non hanno supporto GPU. Imposta `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se il tuo carico di lavoro richiede WebGL o altre funzionalità 3D/browser.
    - `--disable-extensions` è abilitato per impostazione predefinita e può essere disabilitato con `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` per flussi che dipendono dalle estensioni.
    - `--renderer-process-limit=2` è controllato da `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, dove `0` mantiene il valore predefinito di Chromium.

    Se ti serve un profilo di runtime diverso, usa un'immagine browser personalizzata e fornisci il tuo entrypoint. Per profili Chromium locali (non container), usa `browser.extraArgs` per aggiungere flag di avvio supplementari.

  </Accordion>
  <Accordion title="Impostazioni predefinite di sicurezza della rete">
    - `network: "host"` è bloccato.
    - `network: "container:<id>"` è bloccato per impostazione predefinita (rischio di bypass tramite join del namespace).
    - Override di emergenza: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Le installazioni Docker e il Gateway containerizzato si trovano qui: [Docker](/it/install/docker)

Per i deployment del Gateway Docker, `scripts/docker/setup.sh` può inizializzare la configurazione della sandbox. Imposta `OPENCLAW_SANDBOX=1` (oppure `true`/`yes`/`on`) per abilitare quel percorso. Puoi sovrascrivere la posizione del socket con `OPENCLAW_DOCKER_SOCKET`. Configurazione completa e riferimento delle variabili di ambiente: [Docker](/it/install/docker#agent-sandbox).

## setupCommand (configurazione una tantum del container)

`setupCommand` viene eseguito **una volta** dopo la creazione del container sandbox (non a ogni esecuzione). Viene eseguito dentro il container tramite `sh -lc`.

Percorsi:

- Globale: `agents.defaults.sandbox.docker.setupCommand`
- Per agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Problemi comuni">
    - Il valore predefinito di `docker.network` è `"none"` (nessuna uscita), quindi le installazioni dei pacchetti non riusciranno.
    - `docker.network: "container:<id>"` richiede `dangerouslyAllowContainerNamespaceJoin: true` ed è solo per casi di emergenza.
    - `readOnlyRoot: true` impedisce le scritture; imposta `readOnlyRoot: false` oppure prepara un'immagine personalizzata.
    - `user` deve essere root per le installazioni dei pacchetti (ometti `user` oppure imposta `user: "0:0"`).
    - L'esecuzione nella sandbox **non** eredita `process.env` dell'host. Usa `agents.defaults.sandbox.docker.env` (oppure un'immagine personalizzata) per le chiavi API delle Skills.
    - I valori in `agents.defaults.sandbox.docker.env` vengono passati come variabili di ambiente esplicite del container Docker. Chiunque abbia accesso al daemon Docker può ispezionarle con comandi sui metadati Docker come `docker inspect`. Usa un'immagine personalizzata, un file di segreti montato o un altro percorso di consegna dei segreti se questa esposizione dei metadati non è accettabile.

  </Accordion>
</AccordionGroup>

## Criteri degli strumenti e vie di fuga

I criteri allow/deny degli strumenti si applicano comunque prima delle regole della sandbox. Se uno strumento viene negato globalmente o per agente, la sandbox non lo ripristina.

`tools.elevated` è una via di fuga esplicita che esegue `exec` fuori dalla sandbox (`gateway` per impostazione predefinita, oppure `node` quando la destinazione di exec è `node`). Le direttive `/exec` si applicano solo ai mittenti autorizzati e persistono per sessione; per disabilitare rigidamente `exec`, usa il deny dei criteri degli strumenti (vedi [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debug:

- Usa `openclaw sandbox explain` per ispezionare la modalità sandbox effettiva, i criteri degli strumenti e le chiavi di configurazione per la correzione.
- Consulta [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) per il modello mentale di "perché è bloccato?".

Mantieni la configurazione restrittiva.

## Override multi-agente

Ogni agente può sovrascrivere sandbox + strumenti: `agents.list[].sandbox` e `agents.list[].tools` (più `agents.list[].tools.sandbox.tools` per i criteri degli strumenti della sandbox). Consulta [Multi-Agent Sandbox & Tools](/it/tools/multi-agent-sandbox-tools) per la precedenza.

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

- [Multi-Agent Sandbox & Tools](/it/tools/multi-agent-sandbox-tools) — override per agente e precedenza
- [OpenShell](/it/gateway/openshell) — configurazione del backend sandbox gestito, modalità workspace e riferimento della configurazione
- [Configurazione della sandbox](/it/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) — debug di "perché è bloccato?"
- [Sicurezza](/it/gateway/security)
