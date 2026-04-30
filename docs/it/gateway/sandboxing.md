---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Come funziona il sandboxing di OpenClaw: modalità, ambiti, accesso all''area di lavoro e immagini'
title: Isolamento in ambiente protetto
x-i18n:
    generated_at: "2026-04-30T08:54:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96861f3f70bf26b5ed20a063c047064f98a0dc74d36e8f4ccada1f3bb455118d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw può eseguire **strumenti all'interno di backend sandbox** per ridurre l'area d'impatto. Questo è **facoltativo** e controllato dalla configurazione (`agents.defaults.sandbox` o `agents.list[].sandbox`). Se il sandboxing è disattivato, gli strumenti vengono eseguiti sull'host. Il Gateway rimane sull'host; l'esecuzione degli strumenti avviene in una sandbox isolata quando è abilitata.

<Note>
Questo non è un confine di sicurezza perfetto, ma limita in modo sostanziale l'accesso al filesystem e ai processi quando il modello compie un'azione errata.
</Note>

## Cosa viene eseguito in sandbox

- Esecuzione degli strumenti (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, ecc.).
- Browser sandbox facoltativo (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Sandboxed browser details">
    - Per impostazione predefinita, il browser sandbox si avvia automaticamente (assicura che CDP sia raggiungibile) quando lo strumento browser ne ha bisogno. Configura tramite `agents.defaults.sandbox.browser.autoStart` e `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Per impostazione predefinita, i container del browser sandbox usano una rete Docker dedicata (`openclaw-sandbox-browser`) invece della rete globale `bridge`. Configura con `agents.defaults.sandbox.browser.network`.
    - `agents.defaults.sandbox.browser.cdpSourceRange` facoltativo limita l'ingresso CDP al bordo del container con una allowlist CIDR (per esempio `172.21.0.1/32`).
    - L'accesso osservatore noVNC è protetto da password per impostazione predefinita; OpenClaw emette un URL token di breve durata che serve una pagina di bootstrap locale e apre noVNC con la password nel frammento dell'URL (non nei log di query/header).
    - `agents.defaults.sandbox.browser.allowHostControl` consente alle sessioni sandbox di puntare esplicitamente al browser host.
    - Allowlist facoltative regolano `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Non eseguito in sandbox:

- Il processo Gateway stesso.
- Qualsiasi strumento esplicitamente autorizzato a essere eseguito fuori dalla sandbox (per esempio `tools.elevated`).
  - **L'exec elevato aggira il sandboxing e usa il percorso di escape configurato (`gateway` per impostazione predefinita, o `node` quando la destinazione exec è `node`).**
  - Se il sandboxing è disattivato, `tools.elevated` non modifica l'esecuzione (già sull'host). Vedi [Modalità elevata](/it/tools/elevated).

## Modalità

`agents.defaults.sandbox.mode` controlla **quando** viene usato il sandboxing:

<Tabs>
  <Tab title="off">
    Nessun sandboxing.
  </Tab>
  <Tab title="non-main">
    Esegue in sandbox solo le sessioni **non-main** (predefinito se vuoi le chat normali sull'host).

    `"non-main"` si basa su `session.mainKey` (predefinito `"main"`), non sull'id agente. Le sessioni di gruppo/canale usano le proprie chiavi, quindi contano come non-main e verranno eseguite in sandbox.

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

La configurazione specifica di SSH si trova sotto `agents.defaults.sandbox.ssh`. La configurazione specifica di OpenShell si trova sotto `plugins.entries.openshell.config`.

### Scelta di un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Dove viene eseguito** | Container locale                 | Qualsiasi host accessibile via SSH | Sandbox gestita da OpenShell                        |
| **Configurazione**  | `scripts/sandbox-setup.sh`       | Chiave SSH + host di destinazione | Plugin OpenShell abilitato                          |
| **Modello workspace** | Bind-mount o copia              | Remoto canonico (seed una volta) | `mirror` o `remote`                                 |
| **Controllo rete**  | `docker.network` (predefinito: none) | Dipende dall'host remoto       | Dipende da OpenShell                                |
| **Browser sandbox** | Supportato                       | Non supportato                 | Non ancora supportato                               |
| **Bind mount**      | `docker.binds`                   | N/D                            | N/D                                                 |
| **Ideale per**      | Sviluppo locale, isolamento completo | Offload su una macchina remota | Sandbox remote gestite con sincronizzazione bidirezionale facoltativa |

### Backend Docker

Il sandboxing è disattivato per impostazione predefinita. Se abiliti il sandboxing e non scegli un backend, OpenClaw usa il backend Docker. Esegue strumenti e browser sandbox localmente tramite il socket del daemon Docker (`/var/run/docker.sock`). L'isolamento dei container sandbox è determinato dai namespace Docker.

Per esporre le GPU host alle sandbox Docker, imposta `agents.defaults.sandbox.docker.gpus` o l'override per agente `agents.list[].sandbox.docker.gpus`. Il valore viene passato al flag `--gpus` di Docker come argomento separato, per esempio `"all"` o `"device=GPU-uuid"`, e richiede un runtime host compatibile come NVIDIA Container Toolkit.

<Warning>
**Vincoli Docker-out-of-Docker (DooD)**

Se distribuisci il Gateway OpenClaw stesso come container Docker, orchestra container sandbox fratelli usando il socket Docker dell'host (DooD). Questo introduce un vincolo specifico di mappatura dei percorsi:

- **La configurazione richiede percorsi host**: la configurazione `workspace` di `openclaw.json` DEVE contenere il **percorso assoluto dell'host** (per esempio `/home/user/.openclaw/workspaces`), non il percorso interno del container Gateway. Quando OpenClaw chiede al daemon Docker di generare una sandbox, il daemon valuta i percorsi relativamente al namespace del sistema operativo host, non al namespace del Gateway.
- **Parità del bridge FS (mappa dei volumi identica)**: anche il processo nativo del Gateway OpenClaw scrive file heartbeat e bridge nella directory `workspace`. Poiché il Gateway valuta esattamente la stessa stringa (il percorso host) dall'interno del proprio ambiente containerizzato, la distribuzione del Gateway DEVE includere una mappa dei volumi identica che colleghi nativamente il namespace host (`-v /home/user/.openclaw:/home/user/.openclaw`).

Se mappi i percorsi internamente senza parità assoluta con l'host, OpenClaw genera nativamente un errore di permesso `EACCES` quando tenta di scrivere il proprio heartbeat dentro l'ambiente container, perché la stringa del percorso pienamente qualificato non esiste nativamente.
</Warning>

### Backend SSH

Usa `backend: "ssh"` quando vuoi che OpenClaw esegua in sandbox `exec`, strumenti file e letture multimediali su una macchina arbitraria accessibile via SSH.

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
  <Accordion title="How it works">
    - OpenClaw crea una root remota per ambito sotto `sandbox.ssh.workspaceRoot`.
    - Al primo uso dopo creazione o ricreazione, OpenClaw inizializza una sola volta quel workspace remoto dal workspace locale.
    - Dopo di che, `exec`, `read`, `write`, `edit`, `apply_patch`, le letture multimediali dei prompt e lo staging dei media in ingresso vengono eseguiti direttamente sul workspace remoto tramite SSH.
    - OpenClaw non sincronizza automaticamente le modifiche remote di nuovo nel workspace locale.

  </Accordion>
  <Accordion title="Authentication material">
    - `identityFile`, `certificateFile`, `knownHostsFile`: usano file locali esistenti e li passano attraverso la configurazione OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: usano stringhe inline o SecretRefs. OpenClaw li risolve tramite il normale snapshot del runtime dei segreti, li scrive in file temporanei con `0600` e li elimina quando la sessione SSH termina.
    - Se sia `*File` sia `*Data` sono impostati per lo stesso elemento, `*Data` prevale per quella sessione SSH.

  </Accordion>
  <Accordion title="Remote-canonical consequences">
    Questo è un modello **remoto canonico**. Il workspace SSH remoto diventa il vero stato della sandbox dopo il seed iniziale.

    - Le modifiche locali sull'host effettuate fuori da OpenClaw dopo la fase di seed non sono visibili da remoto finché non ricrei la sandbox.
    - `openclaw sandbox recreate` elimina la root remota per ambito ed esegue di nuovo il seed dal locale al prossimo uso.
    - Il sandboxing del browser non è supportato sul backend SSH.
    - Le impostazioni `sandbox.docker.*` non si applicano al backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Usa `backend: "openshell"` quando vuoi che OpenClaw esegua strumenti in sandbox in un ambiente remoto gestito da OpenShell. Per la guida completa di configurazione, il riferimento alla configurazione e il confronto delle modalità workspace, vedi la [pagina OpenShell dedicata](/it/gateway/openshell).

OpenShell riusa lo stesso trasporto SSH core e lo stesso bridge del filesystem remoto del backend SSH generico, e aggiunge il ciclo di vita specifico di OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) più la modalità workspace facoltativa `mirror`.

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
- `remote`: il workspace OpenShell è canonico dopo la creazione della sandbox. OpenClaw inizializza una sola volta il workspace remoto dal workspace locale, poi gli strumenti file ed exec vengono eseguiti direttamente sulla sandbox remota senza sincronizzare le modifiche indietro.

<AccordionGroup>
  <Accordion title="Remote transport details">
    - OpenClaw chiede a OpenShell la configurazione SSH specifica della sandbox tramite `openshell sandbox ssh-config <name>`.
    - Core scrive quella configurazione SSH in un file temporaneo, apre la sessione SSH e riusa lo stesso bridge del filesystem remoto usato da `backend: "ssh"`.
    - Solo in modalità `mirror` cambia il ciclo di vita: sincronizza dal locale al remoto prima di exec, poi sincronizza di nuovo dopo exec.

  </Accordion>
  <Accordion title="Current OpenShell limitations">
    - il browser sandbox non è ancora supportato
    - `sandbox.docker.binds` non è supportato sul backend OpenShell
    - le opzioni runtime specifiche di Docker sotto `sandbox.docker.*` si applicano ancora solo al backend Docker

  </Accordion>
</AccordionGroup>

#### Modalità workspace

OpenShell ha due modelli di workspace. Questa è la parte più importante nella pratica.

<Tabs>
  <Tab title="mirror (local canonical)">
    Usa `plugins.entries.openshell.config.mode: "mirror"` quando vuoi che il **workspace locale rimanga canonico**.

    Comportamento:

    - Prima di `exec`, OpenClaw sincronizza il workspace locale nella sandbox OpenShell.
    - Dopo `exec`, OpenClaw sincronizza il workspace remoto di nuovo nel workspace locale.
    - Gli strumenti file operano comunque tramite il bridge sandbox, ma il workspace locale rimane la fonte di verità tra i turni.

    Usa questa opzione quando:

    - modifichi file localmente fuori da OpenClaw e vuoi che tali modifiche compaiano automaticamente nella sandbox
    - vuoi che la sandbox OpenShell si comporti il più possibile come il backend Docker
    - vuoi che lo spazio di lavoro host rifletta le scritture della sandbox dopo ogni turno di exec

    Compromesso: costo di sincronizzazione aggiuntivo prima e dopo exec.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    Usa `plugins.entries.openshell.config.mode: "remote"` quando vuoi che lo **spazio di lavoro OpenShell diventi canonico**.

    Comportamento:

    - Quando la sandbox viene creata per la prima volta, OpenClaw inizializza lo spazio di lavoro remoto dallo spazio di lavoro locale una sola volta.
    - Dopo di che, `exec`, `read`, `write`, `edit` e `apply_patch` operano direttamente sullo spazio di lavoro OpenShell remoto.
    - OpenClaw **non** sincronizza le modifiche remote nello spazio di lavoro locale dopo exec.
    - Le letture dei media durante il prompt continuano a funzionare perché gli strumenti per file e media leggono tramite il bridge della sandbox invece di assumere un percorso host locale.
    - Il trasporto è SSH nella sandbox OpenShell restituita da `openshell sandbox ssh-config`.

    Conseguenze importanti:

    - Se modifichi file sull'host fuori da OpenClaw dopo il passaggio di inizializzazione, la sandbox remota **non** vedrà automaticamente tali modifiche.
    - Se la sandbox viene ricreata, lo spazio di lavoro remoto viene inizializzato di nuovo dallo spazio di lavoro locale.
    - Con `scope: "agent"` o `scope: "shared"`, quello spazio di lavoro remoto è condiviso nello stesso ambito.

    Usalo quando:

    - la sandbox deve risiedere principalmente sul lato remoto OpenShell
    - vuoi ridurre l'overhead di sincronizzazione per turno
    - non vuoi che le modifiche locali all'host sovrascrivano silenziosamente lo stato della sandbox remota

  </Tab>
</Tabs>

Scegli `mirror` se consideri la sandbox come un ambiente di esecuzione temporaneo. Scegli `remote` se consideri la sandbox come lo spazio di lavoro reale.

#### Ciclo di vita OpenShell

Le sandbox OpenShell sono comunque gestite tramite il normale ciclo di vita della sandbox:

- `openclaw sandbox list` mostra sia i runtime OpenShell sia i runtime Docker
- `openclaw sandbox recreate` elimina il runtime corrente e consente a OpenClaw di ricrearlo al prossimo utilizzo
- anche la logica di pulizia è consapevole del backend

Per la modalità `remote`, la ricreazione è particolarmente importante:

- la ricreazione elimina lo spazio di lavoro remoto canonico per quell'ambito
- l'utilizzo successivo inizializza un nuovo spazio di lavoro remoto dallo spazio di lavoro locale

Per la modalità `mirror`, la ricreazione ripristina principalmente l'ambiente di esecuzione remoto, perché lo spazio di lavoro locale rimane comunque canonico.

## Accesso allo spazio di lavoro

`agents.defaults.sandbox.workspaceAccess` controlla **che cosa può vedere la sandbox**:

<Tabs>
  <Tab title="none (default)">
    Gli strumenti vedono uno spazio di lavoro sandbox sotto `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Monta lo spazio di lavoro dell'agente in sola lettura in `/agent` (disabilita `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Monta lo spazio di lavoro dell'agente in lettura/scrittura in `/workspace`.
  </Tab>
</Tabs>

Con il backend OpenShell:

- la modalità `mirror` usa ancora lo spazio di lavoro locale come origine canonica tra i turni di exec
- la modalità `remote` usa lo spazio di lavoro OpenShell remoto come origine canonica dopo l'inizializzazione iniziale
- `workspaceAccess: "ro"` e `"none"` continuano a limitare il comportamento di scrittura nello stesso modo

I media in ingresso vengono copiati nello spazio di lavoro sandbox attivo (`media/inbound/*`).

<Note>
**Nota sulle Skills:** lo strumento `read` è radicato nella sandbox. Con `workspaceAccess: "none"`, OpenClaw rispecchia le Skills idonee nello spazio di lavoro sandbox (`.../skills`) in modo che possano essere lette. Con `"rw"`, le Skills dello spazio di lavoro sono leggibili da `/workspace/skills`.
</Note>

## Montaggi bind personalizzati

`agents.defaults.sandbox.docker.binds` monta directory host aggiuntive nel container. Formato: `host:container:mode` (ad esempio, `"/home/user/source:/source:rw"`).

I bind globali e per agente vengono **uniti** (non sostituiti). Con `scope: "shared"`, i bind per agente vengono ignorati.

`agents.defaults.sandbox.browser.binds` monta directory host aggiuntive solo nel container del **browser sandbox**.

- Quando è impostato (incluso `[]`), sostituisce `agents.defaults.sandbox.docker.binds` per il container del browser.
- Quando è omesso, il container del browser ricade su `agents.defaults.sandbox.docker.binds` (compatibile con le versioni precedenti).

Esempio (origine in sola lettura + una directory dati aggiuntiva):

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
- OpenClaw blocca sorgenti bind pericolose (ad esempio: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` e montaggi padre che le esporrebbero).
- OpenClaw blocca anche le radici comuni delle credenziali nella directory home, come `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` e `~/.ssh`.
- La convalida dei bind non è solo confronto di stringhe. OpenClaw normalizza il percorso sorgente, poi lo risolve di nuovo tramite l'antenato esistente più profondo prima di ricontrollare percorsi bloccati e radici consentite.
- Ciò significa che le fughe tramite genitori symlink continuano a fallire in modo chiuso anche quando la foglia finale non esiste ancora. Esempio: `/workspace/run-link/new-file` si risolve comunque come `/var/run/...` se `run-link` punta lì.
- Le radici sorgente consentite vengono canonicalizzate nello stesso modo, quindi un percorso che sembra rientrare nell'elenco consentito solo prima della risoluzione dei symlink viene comunque rifiutato come `outside allowed roots`.
- I montaggi sensibili (segreti, chiavi SSH, credenziali di servizio) dovrebbero essere `:ro` salvo assoluta necessità.
- Combina con `workspaceAccess: "ro"` se ti serve solo accesso in lettura allo spazio di lavoro; le modalità dei bind restano indipendenti.
- Vedi [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) per come i bind interagiscono con la policy degli strumenti e l'exec elevato.

</Warning>

## Immagini e configurazione

Immagine Docker predefinita: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Build the default image">
    ```bash
    scripts/sandbox-setup.sh
    ```

    L'immagine predefinita **non** include Node. Se una skill richiede Node (o altri runtime), crea un'immagine personalizzata oppure installa tramite `sandbox.docker.setupCommand` (richiede uscita di rete + root scrivibile + utente root).

    OpenClaw non sostituisce silenziosamente con il semplice `debian:bookworm-slim` quando manca `openclaw-sandbox:bookworm-slim`. Le esecuzioni sandbox che puntano all'immagine predefinita falliscono subito con un'istruzione di build finché non esegui `scripts/sandbox-setup.sh`, perché l'immagine inclusa contiene `python3` per gli helper di scrittura/modifica della sandbox.

  </Step>
  <Step title="Optional: build the common image">
    Per un'immagine sandbox più funzionale con strumenti comuni (ad esempio `curl`, `jq`, `nodejs`, `python3`, `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Poi imposta `agents.defaults.sandbox.docker.image` su `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

Per impostazione predefinita, i container sandbox Docker vengono eseguiti **senza rete**. Sovrascrivi con `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    L'immagine del browser sandbox inclusa applica anche impostazioni predefinite conservative di avvio Chromium per carichi di lavoro containerizzati. Le impostazioni predefinite correnti del container includono:

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
    - I tre flag di irrobustimento grafico (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) sono facoltativi e utili quando i container non hanno supporto GPU. Imposta `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se il tuo carico di lavoro richiede WebGL o altre funzionalità 3D/browser.
    - `--disable-extensions` è abilitato per impostazione predefinita e può essere disabilitato con `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` per flussi che dipendono da estensioni.
    - `--renderer-process-limit=2` è controllato da `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, dove `0` mantiene il valore predefinito di Chromium.

    Se ti serve un profilo runtime diverso, usa un'immagine browser personalizzata e fornisci il tuo entrypoint. Per profili Chromium locali (non container), usa `browser.extraArgs` per aggiungere ulteriori flag di avvio.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` è bloccato.
    - `network: "container:<id>"` è bloccato per impostazione predefinita (rischio di bypass tramite join del namespace).
    - Override di emergenza: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Le installazioni Docker e il gateway containerizzato si trovano qui: [Docker](/it/install/docker)

Per le distribuzioni del Gateway Docker, `scripts/docker/setup.sh` può inizializzare la configurazione della sandbox. Imposta `OPENCLAW_SANDBOX=1` (o `true`/`yes`/`on`) per abilitare quel percorso. Puoi sovrascrivere la posizione del socket con `OPENCLAW_DOCKER_SOCKET`. Configurazione completa e riferimento env: [Docker](/it/install/docker#agent-sandbox).

## setupCommand (configurazione una tantum del container)

`setupCommand` viene eseguito **una sola volta** dopo la creazione del container sandbox (non a ogni esecuzione). Viene eseguito dentro il container tramite `sh -lc`.

Percorsi:

- Globale: `agents.defaults.sandbox.docker.setupCommand`
- Per agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - Il valore predefinito di `docker.network` è `"none"` (nessuna uscita), quindi le installazioni di pacchetti falliranno.
    - `docker.network: "container:<id>"` richiede `dangerouslyAllowContainerNamespaceJoin: true` ed è solo per emergenze.
    - `readOnlyRoot: true` impedisce le scritture; imposta `readOnlyRoot: false` oppure crea un'immagine personalizzata.
    - `user` deve essere root per installare pacchetti (ometti `user` o imposta `user: "0:0"`).
    - L'exec della sandbox **non** eredita `process.env` dell'host. Usa `agents.defaults.sandbox.docker.env` (o un'immagine personalizzata) per le chiavi API delle skill.

  </Accordion>
</AccordionGroup>

## Policy degli strumenti e vie di fuga

Le policy allow/deny degli strumenti si applicano comunque prima delle regole della sandbox. Se uno strumento è negato globalmente o per agente, la sandbox non lo riabilita.

`tools.elevated` è una via di fuga esplicita che esegue `exec` fuori dalla sandbox (`gateway` per impostazione predefinita, o `node` quando il target exec è `node`). Le direttive `/exec` si applicano solo ai mittenti autorizzati e persistono per sessione; per disabilitare rigidamente `exec`, usa il deny della policy degli strumenti (vedi [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debug:

- Usa `openclaw sandbox explain` per ispezionare modalità sandbox effettiva, policy degli strumenti e chiavi di configurazione di correzione.
- Vedi [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) per il modello mentale di "perché questo è bloccato?".

Mantienilo bloccato.

## Override multi-agente

Ogni agente può sovrascrivere sandbox + strumenti: `agents.list[].sandbox` e `agents.list[].tools` (più `agents.list[].tools.sandbox.tools` per la policy degli strumenti della sandbox). Vedi [Multi-Agent Sandbox & Tools](/it/tools/multi-agent-sandbox-tools) per la precedenza.

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
- [OpenShell](/it/gateway/openshell) — configurazione del backend sandbox gestito, modalità dell'area di lavoro e riferimento di configurazione
- [Configurazione sandbox](/it/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs criterio degli strumenti vs elevato](/it/gateway/sandbox-vs-tool-policy-vs-elevated) — debug di "perché è bloccato?"
- [Sicurezza](/it/gateway/security)
