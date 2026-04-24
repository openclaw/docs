---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Come funziona il sandboxing in OpenClaw: modalità, scope, accesso al workspace e immagini'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-24T08:42:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07be63b71a458a17020f33a24d60e6d8d7007d4eaea686a21acabf4815c3f653
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw può eseguire **strumenti dentro backend sandbox** per ridurre il raggio d’azione.
Questo è **opzionale** ed è controllato dalla configurazione (`agents.defaults.sandbox` oppure
`agents.list[].sandbox`). Se il sandboxing è disattivato, gli strumenti vengono eseguiti sull’host.
Il Gateway resta sull’host; l’esecuzione degli strumenti avviene in una sandbox isolata
quando è abilitata.

Questo non è un confine di sicurezza perfetto, ma limita materialmente l’accesso a filesystem
e processi quando il modello fa qualcosa di stupido.

## Cosa viene messo in sandbox

- Esecuzione degli strumenti (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, ecc.).
- Browser sandbox opzionale (`agents.defaults.sandbox.browser`).
  - Per impostazione predefinita, il browser sandbox si avvia automaticamente (garantisce che CDP sia raggiungibile) quando lo strumento browser ne ha bisogno.
    Configurazione tramite `agents.defaults.sandbox.browser.autoStart` e `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Per impostazione predefinita, i container browser sandbox usano una rete Docker dedicata (`openclaw-sandbox-browser`) invece della rete globale `bridge`.
    Configurazione con `agents.defaults.sandbox.browser.network`.
  - L’opzionale `agents.defaults.sandbox.browser.cdpSourceRange` limita l’ingresso CDP al margine del container con una allowlist CIDR (per esempio `172.21.0.1/32`).
  - L’accesso osservatore noVNC è protetto da password per impostazione predefinita; OpenClaw emette un URL token a breve durata che serve una pagina bootstrap locale e apre noVNC con la password nel frammento URL (non nei log di query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` consente alle sessioni sandbox di indirizzare esplicitamente il browser host.
  - Allowlist opzionali controllano `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Non vengono messi in sandbox:

- Il processo Gateway stesso.
- Qualsiasi strumento esplicitamente autorizzato a essere eseguito fuori dalla sandbox (es. `tools.elevated`).
  - **L’exec elevato bypassa il sandboxing e usa il percorso di escape configurato (`gateway` per impostazione predefinita, oppure `node` quando la destinazione exec è `node`).**
  - Se il sandboxing è disattivato, `tools.elevated` non cambia l’esecuzione (già sull’host). Vedi [Modalità elevata](/it/tools/elevated).

## Modalità

`agents.defaults.sandbox.mode` controlla **quando** viene usato il sandboxing:

- `"off"`: nessun sandboxing.
- `"non-main"`: sandbox solo per le sessioni **non-main** (predefinito se vuoi chat normali sull’host).
- `"all"`: ogni sessione viene eseguita in sandbox.
  Nota: `"non-main"` si basa su `session.mainKey` (predefinito `"main"`), non sull’ID agente.
  Le sessioni di gruppo/canale usano le proprie chiavi, quindi contano come non-main e verranno messe in sandbox.

## Scope

`agents.defaults.sandbox.scope` controlla **quanti container** vengono creati:

- `"agent"` (predefinito): un container per agente.
- `"session"`: un container per sessione.
- `"shared"`: un container condiviso da tutte le sessioni sandbox.

## Backend

`agents.defaults.sandbox.backend` controlla **quale runtime** fornisce la sandbox:

- `"docker"` (predefinito quando il sandboxing è abilitato): runtime sandbox locale supportato da Docker.
- `"ssh"`: runtime sandbox remoto generico supportato da SSH.
- `"openshell"`: runtime sandbox supportato da OpenShell.

La configurazione specifica SSH si trova sotto `agents.defaults.sandbox.ssh`.
La configurazione specifica OpenShell si trova sotto `plugins.entries.openshell.config`.

### Scegliere un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Dove viene eseguito** | Container locale              | Qualsiasi host accessibile via SSH | Sandbox gestita da OpenShell                    |
| **Configurazione**  | `scripts/sandbox-setup.sh`       | Chiave SSH + host di destinazione | Plugin OpenShell abilitato                      |
| **Modello workspace** | Bind-mount o copia             | Canonico remoto (seed una volta) | `mirror` oppure `remote`                         |
| **Controllo rete**  | `docker.network` (predefinito: none) | Dipende dall’host remoto     | Dipende da OpenShell                                |
| **Browser sandbox** | Supportato                       | Non supportato                 | Non ancora supportato                               |
| **Bind mount**      | `docker.binds`                   | N/D                            | N/D                                                 |
| **Ideale per**      | Sviluppo locale, isolamento completo | Offload su macchina remota | Sandbox remote gestite con sincronizzazione opzionale bidirezionale |

### Backend Docker

Il sandboxing è disattivato per impostazione predefinita. Se abiliti il sandboxing e non scegli un
backend, OpenClaw usa il backend Docker. Esegue strumenti e browser sandbox
localmente tramite il socket del daemon Docker (`/var/run/docker.sock`). L’isolamento del container sandbox
è determinato dai namespace Docker.

**Vincoli Docker-out-of-Docker (DooD)**:
Se distribuisci il Gateway OpenClaw stesso come container Docker, esso orchestra container sandbox sibling usando il socket Docker dell’host (DooD). Questo introduce un vincolo specifico di mappatura dei percorsi:

- **La configurazione richiede percorsi host**: la configurazione `workspace` in `openclaw.json` DEVE contenere il **percorso assoluto dell’host** (es. `/home/user/.openclaw/workspaces`), non il percorso interno del container Gateway. Quando OpenClaw chiede al daemon Docker di creare una sandbox, il daemon valuta i percorsi rispetto al namespace del sistema operativo host, non al namespace del Gateway.
- **Parità FS Bridge (mappa volume identica)**: il processo nativo del Gateway OpenClaw scrive anche file heartbeat e bridge nella directory `workspace`. Poiché il Gateway valuta esattamente la stessa stringa (il percorso host) dall’interno del proprio ambiente containerizzato, il deployment del Gateway DEVE includere una mappa volume identica che colleghi il namespace host in modo nativo (`-v /home/user/.openclaw:/home/user/.openclaw`).

Se mappi i percorsi internamente senza parità assoluta con l’host, OpenClaw genera nativamente un errore di permesso `EACCES` tentando di scrivere il proprio heartbeat dentro l’ambiente container perché la stringa del percorso completamente qualificata non esiste in modo nativo.

### Backend SSH

Usa `backend: "ssh"` quando vuoi che OpenClaw esegua in sandbox `exec`, strumenti file e letture media su
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

Come funziona:

- OpenClaw crea una root remota per-scope sotto `sandbox.ssh.workspaceRoot`.
- Al primo utilizzo dopo create o recreate, OpenClaw inizializza quel workspace remoto dal workspace locale una volta sola.
- Dopo di ciò, `exec`, `read`, `write`, `edit`, `apply_patch`, letture media del prompt e staging dei media in ingresso vengono eseguiti direttamente contro il workspace remoto via SSH.
- OpenClaw non sincronizza automaticamente le modifiche remote di nuovo nel workspace locale.

Materiale di autenticazione:

- `identityFile`, `certificateFile`, `knownHostsFile`: usa file locali esistenti e passali tramite configurazione OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: usa stringhe inline o SecretRef. OpenClaw le risolve tramite il normale snapshot runtime dei segreti, le scrive in file temporanei con `0600` e le elimina quando la sessione SSH termina.
- Se sia `*File` sia `*Data` sono impostati per lo stesso elemento, `*Data` ha la precedenza per quella sessione SSH.

Questo è un modello **canonico remoto**. Il workspace remoto SSH diventa il vero stato sandbox dopo il seed iniziale.

Conseguenze importanti:

- Le modifiche locali sull’host fatte fuori da OpenClaw dopo il passaggio di seed non sono visibili da remoto finché non ricrei la sandbox.
- `openclaw sandbox recreate` elimina la root remota per-scope e al successivo utilizzo esegue di nuovo il seed dal locale.
- Il browser sandbox non è supportato sul backend SSH.
- Le impostazioni `sandbox.docker.*` non si applicano al backend SSH.

### Backend OpenShell

Usa `backend: "openshell"` quando vuoi che OpenClaw esegua strumenti in sandbox in un
ambiente remoto gestito da OpenShell. Per la guida completa alla configurazione, il
riferimento della configurazione e il confronto delle modalità workspace, vedi la pagina
dedicata [OpenShell](/it/gateway/openshell).

OpenShell riutilizza lo stesso trasporto SSH core e lo stesso bridge del filesystem remoto del
backend SSH generico, e aggiunge un ciclo di vita specifico OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) più la modalità workspace opzionale `mirror`.

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

- `mirror` (predefinita): il workspace locale resta canonico. OpenClaw sincronizza i file locali in OpenShell prima di exec e sincronizza il workspace remoto indietro dopo exec.
- `remote`: il workspace OpenShell è canonico dopo la creazione della sandbox. OpenClaw inizializza una volta il workspace remoto dal workspace locale, poi strumenti file ed exec vengono eseguiti direttamente contro la sandbox remota senza sincronizzare le modifiche di ritorno.

Dettagli del trasporto remoto:

- OpenClaw chiede a OpenShell la configurazione SSH specifica della sandbox tramite `openshell sandbox ssh-config <name>`.
- Il core scrive quella configurazione SSH in un file temporaneo, apre la sessione SSH e riutilizza lo stesso bridge del filesystem remoto usato da `backend: "ssh"`.
- In modalità `mirror` cambia solo il ciclo di vita: sincronizzazione da locale a remoto prima di exec, poi sincronizzazione di ritorno dopo exec.

Limitazioni attuali di OpenShell:

- il browser sandbox non è ancora supportato
- `sandbox.docker.binds` non è supportato sul backend OpenShell
- le impostazioni runtime specifiche Docker sotto `sandbox.docker.*` si applicano ancora solo al backend Docker

#### Modalità workspace

OpenShell ha due modelli workspace. Questa è la parte che conta di più nella pratica.

##### `mirror`

Usa `plugins.entries.openshell.config.mode: "mirror"` quando vuoi che il **workspace locale resti canonico**.

Comportamento:

- Prima di `exec`, OpenClaw sincronizza il workspace locale nella sandbox OpenShell.
- Dopo `exec`, OpenClaw sincronizza il workspace remoto di nuovo nel workspace locale.
- Gli strumenti file continuano a operare attraverso il bridge sandbox, ma il workspace locale resta la fonte di verità tra un turno e l’altro.

Usalo quando:

- modifichi file localmente fuori da OpenClaw e vuoi che quelle modifiche appaiano automaticamente nella sandbox
- vuoi che la sandbox OpenShell si comporti il più possibile come il backend Docker
- vuoi che il workspace host rifletta le scritture sandbox dopo ogni turno exec

Controindicazione:

- costo di sincronizzazione aggiuntivo prima e dopo exec

##### `remote`

Usa `plugins.entries.openshell.config.mode: "remote"` quando vuoi che il **workspace OpenShell diventi canonico**.

Comportamento:

- Quando la sandbox viene creata per la prima volta, OpenClaw inizializza il workspace remoto dal workspace locale una sola volta.
- Dopo di ciò, `exec`, `read`, `write`, `edit` e `apply_patch` operano direttamente contro il workspace remoto OpenShell.
- OpenClaw **non** sincronizza le modifiche remote di nuovo nel workspace locale dopo exec.
- Le letture media al momento del prompt continuano a funzionare perché gli strumenti file e media leggono attraverso il bridge sandbox invece di assumere un percorso host locale.
- Il trasporto è SSH verso la sandbox OpenShell restituita da `openshell sandbox ssh-config`.

Conseguenze importanti:

- Se modifichi file sull’host fuori da OpenClaw dopo il passaggio di seed, la sandbox remota **non** vedrà quelle modifiche automaticamente.
- Se la sandbox viene ricreata, il workspace remoto viene inizializzato di nuovo dal workspace locale.
- Con `scope: "agent"` oppure `scope: "shared"`, quel workspace remoto viene condiviso a quello stesso scope.

Usalo quando:

- la sandbox deve vivere principalmente sul lato remoto OpenShell
- vuoi un overhead di sincronizzazione inferiore per turno
- non vuoi che modifiche locali sull’host sovrascrivano silenziosamente lo stato remoto della sandbox

Scegli `mirror` se pensi alla sandbox come a un ambiente di esecuzione temporaneo.
Scegli `remote` se pensi alla sandbox come al vero workspace.

#### Ciclo di vita OpenShell

Le sandbox OpenShell sono comunque gestite tramite il normale ciclo di vita sandbox:

- `openclaw sandbox list` mostra i runtime OpenShell oltre ai runtime Docker
- `openclaw sandbox recreate` elimina il runtime corrente e lascia che OpenClaw lo ricrei al successivo utilizzo
- anche la logica di prune è consapevole del backend

Per la modalità `remote`, recreate è particolarmente importante:

- recreate elimina il workspace remoto canonico per quello scope
- il successivo utilizzo inizializza un nuovo workspace remoto dal workspace locale

Per la modalità `mirror`, recreate principalmente reimposta l’ambiente di esecuzione remoto
perché il workspace locale resta comunque canonico.

## Accesso al workspace

`agents.defaults.sandbox.workspaceAccess` controlla **che cosa la sandbox può vedere**:

- `"none"` (predefinito): gli strumenti vedono un workspace sandbox sotto `~/.openclaw/sandboxes`.
- `"ro"`: monta il workspace dell’agente in sola lettura su `/agent` (disabilita `write`/`edit`/`apply_patch`).
- `"rw"`: monta il workspace dell’agente in lettura/scrittura su `/workspace`.

Con il backend OpenShell:

- la modalità `mirror` usa comunque il workspace locale come fonte canonica tra i turni exec
- la modalità `remote` usa il workspace remoto OpenShell come fonte canonica dopo il seed iniziale
- `workspaceAccess: "ro"` e `"none"` continuano a limitare il comportamento di scrittura allo stesso modo

I media in ingresso vengono copiati nel workspace sandbox attivo (`media/inbound/*`).
Nota sulle Skills: lo strumento `read` è radicato nella sandbox. Con `workspaceAccess: "none"`,
OpenClaw rispecchia le Skills idonee nel workspace sandbox (`.../skills`) così
possono essere lette. Con `"rw"`, le Skills del workspace sono leggibili da
`/workspace/skills`.

## Bind mount personalizzati

`agents.defaults.sandbox.docker.binds` monta directory host aggiuntive nel container.
Formato: `host:container:mode` (es. `"/home/user/source:/source:rw"`).

I bind globali e per agente vengono **uniti** (non sostituiti). Con `scope: "shared"`, i bind per agente vengono ignorati.

`agents.defaults.sandbox.browser.binds` monta directory host aggiuntive **solo** nel container browser sandbox.

- Quando è impostato (incluso `[]`), sostituisce `agents.defaults.sandbox.docker.binds` per il container browser.
- Quando è omesso, il container browser usa come fallback `agents.defaults.sandbox.docker.binds` (compatibilità retroattiva).

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

Note sulla sicurezza:

- I bind bypassano il filesystem sandbox: espongono percorsi host con la modalità che imposti (`:ro` oppure `:rw`).
- OpenClaw blocca sorgenti bind pericolose (per esempio: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` e mount genitori che li esporrebbero).
- OpenClaw blocca anche comuni radici di credenziali nella home directory come `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` e `~/.ssh`.
- La validazione dei bind non si basa solo sul confronto di stringhe. OpenClaw normalizza il percorso sorgente, poi lo risolve di nuovo attraverso l’antenato esistente più profondo prima di ricontrollare percorsi bloccati e radici consentite.
- Questo significa che anche le fughe tramite genitori symlink falliscono in modalità fail-closed anche quando il leaf finale non esiste ancora. Esempio: `/workspace/run-link/new-file` si risolve comunque come `/var/run/...` se `run-link` punta lì.
- Le radici sorgente consentite vengono canonicalizzate allo stesso modo, quindi un percorso che solo apparentemente si trova nell’allowlist prima della risoluzione dei symlink viene comunque rifiutato come `outside allowed roots`.
- I mount sensibili (segreti, chiavi SSH, credenziali di servizio) dovrebbero essere `:ro` salvo necessità assoluta.
- Combinalo con `workspaceAccess: "ro"` se ti serve solo accesso in lettura al workspace; le modalità bind restano indipendenti.
- Vedi [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) per capire come i bind interagiscono con la policy degli strumenti e l’exec elevato.

## Immagini + configurazione iniziale

Immagine Docker predefinita: `openclaw-sandbox:bookworm-slim`

Compilala una volta:

```bash
scripts/sandbox-setup.sh
```

Nota: l’immagine predefinita **non** include Node. Se una Skill ha bisogno di Node (o
altri runtime), crea un’immagine personalizzata oppure installa tramite
`sandbox.docker.setupCommand` (richiede uscita di rete + root scrivibile +
utente root).

Se vuoi un’immagine sandbox più funzionale con strumenti comuni (per esempio
`curl`, `jq`, `nodejs`, `python3`, `git`), compila:

```bash
scripts/sandbox-common-setup.sh
```

Poi imposta `agents.defaults.sandbox.docker.image` su
`openclaw-sandbox-common:bookworm-slim`.

Immagine browser sandbox:

```bash
scripts/sandbox-browser-setup.sh
```

Per impostazione predefinita, i container Docker sandbox vengono eseguiti **senza rete**.
Sostituiscilo con `agents.defaults.sandbox.docker.network`.

L’immagine browser sandbox inclusa applica anche valori predefiniti conservativi di avvio Chromium
per workload containerizzati. I valori predefiniti correnti del container includono:

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
  quando i container non hanno supporto GPU. Imposta `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  se il tuo workload richiede WebGL o altre funzionalità 3D/browser.
- `--disable-extensions` è abilitato per impostazione predefinita e può essere disabilitato con
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` per flussi che dipendono da estensioni.
- `--renderer-process-limit=2` è controllato da
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, dove `0` mantiene il valore predefinito di Chromium.

Se hai bisogno di un profilo runtime diverso, usa un’immagine browser personalizzata e fornisci
il tuo entrypoint. Per profili Chromium locali (non container), usa
`browser.extraArgs` per aggiungere flag di avvio supplementari.

Valori predefiniti di sicurezza:

- `network: "host"` è bloccato.
- `network: "container:<id>"` è bloccato per impostazione predefinita (rischio di bypass tramite join del namespace).
- Override di emergenza: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Le installazioni Docker e il gateway containerizzato si trovano qui:
[Docker](/it/install/docker)

Per deployment del gateway Docker, `scripts/docker/setup.sh` può inizializzare la configurazione sandbox.
Imposta `OPENCLAW_SANDBOX=1` (oppure `true`/`yes`/`on`) per abilitare quel percorso. Puoi
sostituire la posizione del socket con `OPENCLAW_DOCKER_SOCKET`. Configurazione completa e riferimento
env: [Docker](/it/install/docker#agent-sandbox).

## setupCommand (configurazione una tantum del container)

`setupCommand` viene eseguito **una sola volta** dopo la creazione del container sandbox (non a ogni esecuzione).
Viene eseguito nel container tramite `sh -lc`.

Percorsi:

- Globale: `agents.defaults.sandbox.docker.setupCommand`
- Per agente: `agents.list[].sandbox.docker.setupCommand`

Errori comuni:

- Il valore predefinito di `docker.network` è `"none"` (nessuna uscita), quindi le installazioni di pacchetti falliranno.
- `docker.network: "container:<id>"` richiede `dangerouslyAllowContainerNamespaceJoin: true` ed è solo per emergenza.
- `readOnlyRoot: true` impedisce le scritture; imposta `readOnlyRoot: false` oppure crea un’immagine personalizzata.
- `user` deve essere root per installare pacchetti (ometti `user` oppure imposta `user: "0:0"`).
- L’exec sandbox non eredita `process.env` dell’host. Usa
  `agents.defaults.sandbox.docker.env` (oppure un’immagine personalizzata) per le chiavi API delle Skills.

## Policy degli strumenti + vie di fuga

Le policy allow/deny degli strumenti si applicano comunque prima delle regole sandbox. Se uno strumento è negato
globalmente o per agente, il sandboxing non lo ripristina.

`tools.elevated` è una via di fuga esplicita che esegue `exec` fuori dalla sandbox (`gateway` per impostazione predefinita, oppure `node` quando la destinazione exec è `node`).
Le direttive `/exec` si applicano solo ai mittenti autorizzati e persistono per sessione; per disabilitare in modo rigido
`exec`, usa il deny della policy degli strumenti (vedi [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debug:

- Usa `openclaw sandbox explain` per ispezionare la modalità sandbox effettiva, la policy degli strumenti e le chiavi di configurazione di correzione.
- Vedi [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) per il modello mentale “perché questo è bloccato?”.
  Mantienilo strettamente controllato.

## Override multi-agente

Ogni agente può sostituire sandbox + strumenti:
`agents.list[].sandbox` e `agents.list[].tools` (più `agents.list[].tools.sandbox.tools` per la policy degli strumenti sandbox).
Vedi [Sandbox & Tools multi-agente](/it/tools/multi-agent-sandbox-tools) per la precedenza.

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

## Documentazione correlata

- [OpenShell](/it/gateway/openshell) -- configurazione del backend sandbox gestito, modalità workspace e riferimento della configurazione
- [Configurazione Sandbox](/it/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) -- debug di “perché questo è bloccato?”
- [Sandbox & Tools multi-agente](/it/tools/multi-agent-sandbox-tools) -- override per agente e precedenza
- [Security](/it/gateway/security)
