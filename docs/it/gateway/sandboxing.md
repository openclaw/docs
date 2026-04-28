---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Come funziona il sandboxing di OpenClaw: modalità, ambiti, accesso al workspace e immagini'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-26T11:30:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83930d5533832f2ece5fd069c15670f8a73c5801c829ca85c249a4582d36ff29
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw può eseguire **strumenti all'interno di backend sandbox** per ridurre il raggio d'azione. È **facoltativo** ed è controllato dalla configurazione (`agents.defaults.sandbox` o `agents.list[].sandbox`). Se il sandboxing è disattivato, gli strumenti vengono eseguiti sull'host. Il Gateway resta sull'host; l'esecuzione degli strumenti avviene in una sandbox isolata quando è abilitata.

<Note>
Questo non è un confine di sicurezza perfetto, ma limita in modo sostanziale l'accesso al filesystem e ai processi quando il modello fa qualcosa di stupido.
</Note>

## Cosa viene messo in sandbox

- Esecuzione degli strumenti (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, ecc.).
- Browser in sandbox facoltativo (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Dettagli del browser in sandbox">
    - Per impostazione predefinita, il browser in sandbox si avvia automaticamente (garantisce che CDP sia raggiungibile) quando lo strumento browser ne ha bisogno. Configura tramite `agents.defaults.sandbox.browser.autoStart` e `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Per impostazione predefinita, i container del browser in sandbox usano una rete Docker dedicata (`openclaw-sandbox-browser`) invece della rete globale `bridge`. Configura con `agents.defaults.sandbox.browser.network`.
    - `agents.defaults.sandbox.browser.cdpSourceRange` facoltativo limita l'ingresso CDP al bordo del container con una allowlist CIDR (ad esempio `172.21.0.1/32`).
    - L'accesso osservatore noVNC è protetto da password per impostazione predefinita; OpenClaw emette un URL token a breve durata che serve una pagina bootstrap locale e apre noVNC con la password nel fragment dell'URL (non nei log di query/header).
    - `agents.defaults.sandbox.browser.allowHostControl` consente alle sessioni in sandbox di puntare esplicitamente al browser host.
    - Allowlist facoltative regolano `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Non vengono messi in sandbox:

- Il processo Gateway stesso.
- Qualsiasi strumento esplicitamente autorizzato a essere eseguito fuori dalla sandbox (ad esempio `tools.elevated`).
  - **L'exec elevato aggira il sandboxing e usa il percorso di escape configurato (`gateway` per impostazione predefinita, oppure `node` quando il target exec è `node`).**
  - Se il sandboxing è disattivato, `tools.elevated` non cambia l'esecuzione (già sull'host). Vedi [Modalità elevata](/it/tools/elevated).

## Modalità

`agents.defaults.sandbox.mode` controlla **quando** viene usato il sandboxing:

<Tabs>
  <Tab title="off">
    Nessun sandboxing.
  </Tab>
  <Tab title="non-main">
    Metti in sandbox solo le sessioni **non-main** (predefinito se vuoi le normali chat sull'host).

    `"non-main"` si basa su `session.mainKey` (predefinito `"main"`), non sull'id dell'agente. Le sessioni di gruppo/canale usano chiavi proprie, quindi vengono considerate non-main e saranno messe in sandbox.

  </Tab>
  <Tab title="all">
    Ogni sessione viene eseguita in una sandbox.
  </Tab>
</Tabs>

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

La configurazione specifica SSH si trova sotto `agents.defaults.sandbox.ssh`. La configurazione specifica OpenShell si trova in `plugins.entries.openshell.config`.

### Scegliere un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Dove viene eseguito** | Container locale              | Qualsiasi host accessibile via SSH | Sandbox gestita da OpenShell                    |
| **Setup**           | `scripts/sandbox-setup.sh`       | Chiave SSH + host target       | Plugin OpenShell abilitato                          |
| **Modello workspace** | Bind-mount o copia             | Canonico remoto (seed una volta) | `mirror` o `remote`                               |
| **Controllo rete**  | `docker.network` (predefinito: none) | Dipende dall'host remoto    | Dipende da OpenShell                                |
| **Browser sandbox** | Supportato                       | Non supportato                 | Non ancora supportato                               |
| **Bind mount**      | `docker.binds`                   | N/D                            | N/D                                                 |
| **Ideale per**      | Sviluppo locale, isolamento completo | Offload su una macchina remota | Sandbox remote gestite con sync bidirezionale facoltativa |

### Backend Docker

Il sandboxing è disattivato per impostazione predefinita. Se abiliti il sandboxing e non scegli un backend, OpenClaw usa il backend Docker. Esegue strumenti e browser in sandbox localmente tramite il socket del daemon Docker (`/var/run/docker.sock`). L'isolamento dei container sandbox è determinato dai namespace Docker.

<Warning>
**Vincoli Docker-out-of-Docker (DooD)**

Se distribuisci il Gateway OpenClaw stesso come container Docker, esso orchestra container sandbox fratelli usando il socket Docker dell'host (DooD). Questo introduce un vincolo specifico di mappatura dei percorsi:

- **La configurazione richiede percorsi host**: la configurazione `workspace` in `openclaw.json` DEVE contenere il **percorso assoluto dell'host** (ad esempio `/home/user/.openclaw/workspaces`), non il percorso interno del container Gateway. Quando OpenClaw chiede al daemon Docker di avviare una sandbox, il daemon valuta i percorsi rispetto al namespace dell'OS host, non al namespace del Gateway.
- **Parità del bridge FS (mappa volumi identica)**: il processo nativo Gateway OpenClaw scrive anche file di Heartbeat e bridge nella directory `workspace`. Poiché il Gateway valuta la stessa stringa esatta (il percorso host) dall'interno del proprio ambiente containerizzato, la distribuzione del Gateway DEVE includere una mappa volumi identica che colleghi nativamente il namespace host (`-v /home/user/.openclaw:/home/user/.openclaw`).

Se mappi i percorsi internamente senza parità assoluta con l'host, OpenClaw genera nativamente un errore di permesso `EACCES` quando tenta di scrivere il proprio Heartbeat nell'ambiente containerizzato perché la stringa di percorso completamente qualificata non esiste nativamente.
</Warning>

### Backend SSH

Usa `backend: "ssh"` quando vuoi che OpenClaw metta in sandbox `exec`, strumenti file e letture media su una macchina arbitraria accessibile via SSH.

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
          // Oppure usa SecretRef / contenuti inline invece di file locali:
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
    - Al primo utilizzo dopo create o recreate, OpenClaw inizializza quel workspace remoto dal workspace locale una sola volta.
    - Dopo di ciò, `exec`, `read`, `write`, `edit`, `apply_patch`, letture media del prompt e staging dei media in ingresso vengono eseguiti direttamente sul workspace remoto via SSH.
    - OpenClaw non sincronizza automaticamente le modifiche remote di ritorno al workspace locale.

  </Accordion>
  <Accordion title="Materiale di autenticazione">
    - `identityFile`, `certificateFile`, `knownHostsFile`: usano file locali esistenti e li passano tramite la configurazione OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: usano stringhe inline o SecretRef. OpenClaw li risolve tramite il normale snapshot runtime dei segreti, li scrive in file temporanei con `0600` e li elimina quando termina la sessione SSH.
    - Se sia `*File` sia `*Data` sono impostati per lo stesso elemento, `*Data` ha la precedenza per quella sessione SSH.

  </Accordion>
  <Accordion title="Conseguenze del modello canonico remoto">
    Questo è un modello **canonico remoto**. Il workspace remoto SSH diventa il vero stato della sandbox dopo il seed iniziale.

    - Le modifiche locali all'host fatte fuori da OpenClaw dopo il seed non sono visibili in remoto finché non ricrei la sandbox.
    - `openclaw sandbox recreate` elimina la root remota per ambito e la reinizializza dal locale al successivo utilizzo.
    - Il browser in sandbox non è supportato nel backend SSH.
    - Le impostazioni `sandbox.docker.*` non si applicano al backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Usa `backend: "openshell"` quando vuoi che OpenClaw esegua strumenti in sandbox in un ambiente remoto gestito da OpenShell. Per la guida completa al setup, il riferimento della configurazione e il confronto tra modalità workspace, vedi la pagina dedicata [OpenShell](/it/gateway/openshell).

OpenShell riusa lo stesso trasporto SSH di base e lo stesso bridge del filesystem remoto del backend SSH generico, e aggiunge il ciclo di vita specifico di OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) più la modalità workspace facoltativa `mirror`.

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

- `mirror` (predefinita): il workspace locale resta canonico. OpenClaw sincronizza i file locali in OpenShell prima di exec e sincronizza il workspace remoto di ritorno dopo exec.
- `remote`: il workspace OpenShell è canonico dopo la creazione della sandbox. OpenClaw inizializza il workspace remoto una sola volta dal workspace locale, poi strumenti file ed exec vengono eseguiti direttamente sulla sandbox remota senza sincronizzare indietro le modifiche.

<AccordionGroup>
  <Accordion title="Dettagli del trasporto remoto">
    - OpenClaw chiede a OpenShell la configurazione SSH specifica della sandbox tramite `openshell sandbox ssh-config <name>`.
    - Il core scrive quella configurazione SSH in un file temporaneo, apre la sessione SSH e riusa lo stesso bridge del filesystem remoto usato da `backend: "ssh"`.
    - In modalità `mirror` cambia solo il ciclo di vita: sincronizza da locale a remoto prima di exec, poi sincronizza indietro dopo exec.

  </Accordion>
  <Accordion title="Limitazioni attuali di OpenShell">
    - il browser in sandbox non è ancora supportato
    - `sandbox.docker.binds` non è supportato nel backend OpenShell
    - i parametri runtime specifici Docker sotto `sandbox.docker.*` continuano ad applicarsi solo al backend Docker

  </Accordion>
</AccordionGroup>

#### Modalità workspace

OpenShell ha due modelli di workspace. Questa è la parte che conta di più nella pratica.

<Tabs>
  <Tab title="mirror (canonico locale)">
    Usa `plugins.entries.openshell.config.mode: "mirror"` quando vuoi che il **workspace locale resti canonico**.

    Comportamento:

    - Prima di `exec`, OpenClaw sincronizza il workspace locale nella sandbox OpenShell.
    - Dopo `exec`, OpenClaw sincronizza il workspace remoto di ritorno nel workspace locale.
    - Gli strumenti file continuano a operare tramite il bridge sandbox, ma il workspace locale resta la fonte di verità tra un turno e l'altro.

    Usalo quando:

    - modifichi file localmente fuori da OpenClaw e vuoi che queste modifiche compaiano automaticamente nella sandbox
    - vuoi che la sandbox OpenShell si comporti il più possibile come il backend Docker
    - vuoi che il workspace host rifletta le scritture della sandbox dopo ogni turno exec

    Compromesso: costo di sincronizzazione aggiuntivo prima e dopo exec.

  </Tab>
  <Tab title="remote (canonico OpenShell)">
    Usa `plugins.entries.openshell.config.mode: "remote"` quando vuoi che il **workspace OpenShell diventi canonico**.

    Comportamento:

    - Quando la sandbox viene creata per la prima volta, OpenClaw inizializza il workspace remoto dal workspace locale una sola volta.
    - Dopo di ciò, `exec`, `read`, `write`, `edit` e `apply_patch` operano direttamente sul workspace OpenShell remoto.
    - OpenClaw **non** sincronizza le modifiche remote di ritorno nel workspace locale dopo exec.
    - Le letture media al momento del prompt continuano a funzionare perché gli strumenti file e media leggono tramite il bridge sandbox invece di presumere un percorso host locale.
    - Il trasporto avviene via SSH nella sandbox OpenShell restituita da `openshell sandbox ssh-config`.

    Conseguenze importanti:

    - Se modifichi file sull'host fuori da OpenClaw dopo il passaggio di seed, la sandbox remota **non** vedrà automaticamente quelle modifiche.
    - Se la sandbox viene ricreata, il workspace remoto viene nuovamente inizializzato dal workspace locale.
    - Con `scope: "agent"` o `scope: "shared"`, quel workspace remoto viene condiviso allo stesso ambito.

    Usalo quando:

    - la sandbox deve vivere principalmente sul lato remoto OpenShell
    - vuoi un overhead di sincronizzazione minore per turno
    - non vuoi che modifiche locali sull'host sovrascrivano silenziosamente lo stato remoto della sandbox

  </Tab>
</Tabs>

Scegli `mirror` se pensi alla sandbox come a un ambiente di esecuzione temporaneo. Scegli `remote` se pensi alla sandbox come al vero workspace.

#### Ciclo di vita OpenShell

Le sandbox OpenShell sono comunque gestite tramite il normale ciclo di vita della sandbox:

- `openclaw sandbox list` mostra runtime OpenShell oltre ai runtime Docker
- `openclaw sandbox recreate` elimina il runtime corrente e lascia che OpenClaw lo ricrei al successivo utilizzo
- anche la logica di prune tiene conto del backend

Per la modalità `remote`, recreate è particolarmente importante:

- recreate elimina il workspace remoto canonico per quell'ambito
- l'utilizzo successivo inizializza un nuovo workspace remoto dal workspace locale

Per la modalità `mirror`, recreate reimposta principalmente l'ambiente di esecuzione remoto perché il workspace locale resta comunque canonico.

## Accesso al workspace

`agents.defaults.sandbox.workspaceAccess` controlla **cosa può vedere la sandbox**:

<Tabs>
  <Tab title="none (predefinito)">
    Gli strumenti vedono un workspace sandbox sotto `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Monta il workspace dell'agente in sola lettura su `/agent` (disabilita `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Monta il workspace dell'agente in lettura/scrittura su `/workspace`.
  </Tab>
</Tabs>

Con il backend OpenShell:

- la modalità `mirror` continua a usare il workspace locale come sorgente canonica tra i turni exec
- la modalità `remote` usa il workspace remoto OpenShell come sorgente canonica dopo il seed iniziale
- `workspaceAccess: "ro"` e `"none"` continuano a limitare il comportamento di scrittura allo stesso modo

I media in ingresso vengono copiati nel workspace sandbox attivo (`media/inbound/*`).

<Note>
**Nota sulle Skills:** lo strumento `read` è radicato nella sandbox. Con `workspaceAccess: "none"`, OpenClaw rispecchia le Skills idonee nel workspace sandbox (`.../skills`) così che possano essere lette. Con `"rw"`, le Skills del workspace sono leggibili da `/workspace/skills`.
</Note>

## Bind mount personalizzati

`agents.defaults.sandbox.docker.binds` monta directory host aggiuntive nel container. Formato: `host:container:mode` (ad esempio `"/home/user/source:/source:rw"`).

I bind globali e per agente vengono **uniti** (non sostituiti). Con `scope: "shared"`, i bind per agente vengono ignorati.

`agents.defaults.sandbox.browser.binds` monta directory host aggiuntive solo nel container del **browser sandbox**.

- Quando è impostato (incluso `[]`), sostituisce `agents.defaults.sandbox.docker.binds` per il container browser.
- Quando è omesso, il container browser torna a usare `agents.defaults.sandbox.docker.binds` (retrocompatibile).

Esempio (sorgente in sola lettura + directory dati aggiuntiva):

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
- OpenClaw blocca anche comuni root di credenziali nella home directory come `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` e `~/.ssh`.
- La validazione dei bind non è solo string matching. OpenClaw normalizza il percorso sorgente, poi lo risolve di nuovo tramite l'antenato esistente più profondo prima di ricontrollare percorsi bloccati e root consentite.
- Questo significa che le fughe tramite symlink parent falliscono comunque in modo chiuso anche quando il leaf finale non esiste ancora. Esempio: `/workspace/run-link/new-file` si risolve comunque come `/var/run/...` se `run-link` punta lì.
- Le root sorgente consentite vengono canonicalizzate allo stesso modo, quindi un percorso che sembra trovarsi dentro la allowlist prima della risoluzione dei symlink viene comunque rifiutato come `outside allowed roots`.
- I mount sensibili (segreti, chiavi SSH, credenziali di servizio) dovrebbero essere `:ro` salvo necessità assoluta.
- Combina con `workspaceAccess: "ro"` se ti serve solo accesso in lettura al workspace; le modalità dei bind restano indipendenti.
- Vedi [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) per capire come i bind interagiscono con la tool policy e l'exec elevato.

</Warning>

## Immagini e setup

Immagine Docker predefinita: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Build dell'immagine predefinita">
    ```bash
    scripts/sandbox-setup.sh
    ```

    L'immagine predefinita **non** include Node. Se una Skill ha bisogno di Node (o di altri runtime), crea un'immagine personalizzata oppure installa tramite `sandbox.docker.setupCommand` (richiede egress di rete + root scrivibile + utente root).

  </Step>
  <Step title="Facoltativo: build dell'immagine comune">
    Per un'immagine sandbox più funzionale con strumenti comuni (ad esempio `curl`, `jq`, `nodejs`, `python3`, `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Poi imposta `agents.defaults.sandbox.docker.image` su `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Facoltativo: build dell'immagine del browser sandbox">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

Per impostazione predefinita, i container Docker sandbox vengono eseguiti **senza rete**. Esegui l'override con `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Valori predefiniti Chromium del browser sandbox">
    L'immagine del browser sandbox inclusa nel bundle applica anche valori predefiniti conservativi di avvio Chromium per carichi di lavoro containerizzati. I valori predefiniti correnti del container includono:

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
    - I tre flag di hardening grafico (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) sono facoltativi e sono utili quando i container non hanno supporto GPU. Imposta `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se il tuo carico di lavoro richiede WebGL o altre funzionalità 3D/browser.
    - `--disable-extensions` è abilitato per impostazione predefinita e può essere disabilitato con `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` per flussi che dipendono dalle estensioni.
    - `--renderer-process-limit=2` è controllato da `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, dove `0` mantiene il valore predefinito di Chromium.

    Se hai bisogno di un profilo runtime diverso, usa un'immagine browser personalizzata e fornisci il tuo entrypoint. Per profili Chromium locali (non container), usa `browser.extraArgs` per aggiungere flag di avvio supplementari.

  </Accordion>
  <Accordion title="Valori predefiniti di sicurezza della rete">
    - `network: "host"` è bloccato.
    - `network: "container:<id>"` è bloccato per impostazione predefinita (rischio di bypass del namespace join).
    - Override break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Le installazioni Docker e il gateway containerizzato si trovano qui: [Docker](/it/install/docker)

Per i deployment del gateway Docker, `scripts/docker/setup.sh` può inizializzare la configurazione della sandbox. Imposta `OPENCLAW_SANDBOX=1` (o `true`/`yes`/`on`) per abilitare quel percorso. Puoi sovrascrivere la posizione del socket con `OPENCLAW_DOCKER_SOCKET`. Setup completo e riferimento env: [Docker](/it/install/docker#agent-sandbox).

## setupCommand (configurazione una tantum del container)

`setupCommand` viene eseguito **una sola volta** dopo la creazione del container sandbox (non a ogni esecuzione). Viene eseguito all'interno del container tramite `sh -lc`.

Percorsi:

- Globale: `agents.defaults.sandbox.docker.setupCommand`
- Per agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Errori comuni">
    - Il valore predefinito di `docker.network` è `"none"` (nessun egress), quindi le installazioni di pacchetti falliranno.
    - `docker.network: "container:<id>"` richiede `dangerouslyAllowContainerNamespaceJoin: true` ed è solo break-glass.
    - `readOnlyRoot: true` impedisce le scritture; imposta `readOnlyRoot: false` oppure crea un'immagine personalizzata.
    - `user` deve essere root per le installazioni di pacchetti (ometti `user` oppure imposta `user: "0:0"`).
    - L'exec sandbox non eredita `process.env` dell'host. Usa `agents.defaults.sandbox.docker.env` (oppure un'immagine personalizzata) per le chiavi API delle Skills.

  </Accordion>
</AccordionGroup>

## Tool policy e vie di fuga

Le policy allow/deny degli strumenti continuano ad applicarsi prima delle regole di sandbox. Se uno strumento è negato globalmente o per agente, il sandboxing non lo ripristina.

`tools.elevated` è una via di fuga esplicita che esegue `exec` fuori dalla sandbox (`gateway` per impostazione predefinita, oppure `node` quando il target exec è `node`). Le direttive `/exec` si applicano solo ai mittenti autorizzati e persistono per sessione; per disabilitare completamente `exec`, usa il deny nella tool policy (vedi [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debug:

- Usa `openclaw sandbox explain` per ispezionare modalità sandbox effettiva, tool policy e chiavi di configurazione fix-it.
- Vedi [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) per il modello mentale “perché è bloccato?”.

Mantienilo blindato.

## Override multi-agente

Ogni agente può sovrascrivere sandbox + strumenti: `agents.list[].sandbox` e `agents.list[].tools` (più `agents.list[].tools.sandbox.tools` per la tool policy della sandbox). Vedi [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) per la precedenza.

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
- [OpenShell](/it/gateway/openshell) — setup del backend sandbox gestito, modalità workspace e riferimento della configurazione
- [Configurazione sandbox](/it/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) — debug di “perché è bloccato?”
- [Sicurezza](/it/gateway/security)
