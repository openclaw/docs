---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Come funziona il sandboxing di OpenClaw: modalità, ambiti, accesso al workspace e immagini'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-05T13:54:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 756ebd5b9806c23ba720a311df7e3b4ffef6ce41ba4315ee4b36b5ea87b26e60
    source_path: gateway/sandboxing.md
    workflow: 15
---

# Sandboxing

OpenClaw può eseguire gli **strumenti all'interno di backend sandbox** per ridurre il raggio d'impatto.
Questa funzionalità è **facoltativa** ed è controllata dalla configurazione (`agents.defaults.sandbox` o
`agents.list[].sandbox`). Se il sandboxing è disattivato, gli strumenti vengono eseguiti sull'host.
Il Gateway rimane sull'host; l'esecuzione degli strumenti avviene in un sandbox isolato
quando è abilitata.

Non si tratta di un confine di sicurezza perfetto, ma limita in modo sostanziale l'accesso
al filesystem e ai processi quando il modello fa qualcosa di stupido.

## Cosa viene eseguito nel sandbox

- Esecuzione degli strumenti (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, ecc.).
- Browser sandboxato facoltativo (`agents.defaults.sandbox.browser`).
  - Per impostazione predefinita, il browser sandboxato si avvia automaticamente (assicurando che il CDP sia raggiungibile) quando lo strumento browser ne ha bisogno.
    Configuralo tramite `agents.defaults.sandbox.browser.autoStart` e `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Per impostazione predefinita, i container del browser sandboxato usano una rete Docker dedicata (`openclaw-sandbox-browser`) invece della rete globale `bridge`.
    Configurazione tramite `agents.defaults.sandbox.browser.network`.
  - `agents.defaults.sandbox.browser.cdpSourceRange` facoltativo limita l'ingresso CDP al margine del container con una allowlist CIDR (ad esempio `172.21.0.1/32`).
  - L'accesso osservatore noVNC è protetto da password per impostazione predefinita; OpenClaw emette un URL token temporaneo che serve una pagina bootstrap locale e apre noVNC con la password nel frammento URL (non nei log di query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` consente alle sessioni sandboxate di prendere esplicitamente di mira il browser host.
  - Allowlist facoltative limitano `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Non viene eseguito nel sandbox:

- Il processo Gateway stesso.
- Qualsiasi strumento esplicitamente autorizzato a essere eseguito fuori dal sandbox (ad esempio `tools.elevated`).
  - **L'exec elevato bypassa il sandboxing e usa il percorso di escape configurato (`gateway` per impostazione predefinita, oppure `node` quando la destinazione exec è `node`).**
  - Se il sandboxing è disattivato, `tools.elevated` non cambia l'esecuzione (è già sull'host). Vedi [Elevated Mode](/tools/elevated).

## Modalità

`agents.defaults.sandbox.mode` controlla **quando** viene usato il sandboxing:

- `"off"`: nessun sandboxing.
- `"non-main"`: sandboxa solo le sessioni **non main** (predefinito se vuoi le chat normali sull'host).
- `"all"`: ogni sessione viene eseguita in un sandbox.
  Nota: `"non-main"` si basa su `session.mainKey` (predefinito `"main"`), non sull'id dell'agente.
  Le sessioni di gruppo/canale usano le proprie chiavi, quindi contano come non-main e verranno sandboxate.

## Ambito

`agents.defaults.sandbox.scope` controlla **quanti container** vengono creati:

- `"agent"` (predefinito): un container per agente.
- `"session"`: un container per sessione.
- `"shared"`: un container condiviso da tutte le sessioni sandboxate.

## Backend

`agents.defaults.sandbox.backend` controlla **quale runtime** fornisce il sandbox:

- `"docker"` (predefinito): runtime sandbox locale basato su Docker.
- `"ssh"`: runtime sandbox remoto generico basato su SSH.
- `"openshell"`: runtime sandbox basato su OpenShell.

La configurazione specifica di SSH si trova sotto `agents.defaults.sandbox.ssh`.
La configurazione specifica di OpenShell si trova sotto `plugins.entries.openshell.config`.

### Scegliere un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Dove viene eseguito** | Container locale                 | Qualsiasi host accessibile via SSH | Sandbox gestito da OpenShell                        |
| **Setup**           | `scripts/sandbox-setup.sh`       | Chiave SSH + host di destinazione | Plugin OpenShell abilitato                          |
| **Modello workspace** | Bind-mount o copia               | Canonico remoto (seed una volta) | `mirror` o `remote`                                 |
| **Controllo rete**  | `docker.network` (predefinito: none) | Dipende dall'host remoto       | Dipende da OpenShell                                |
| **Browser sandbox** | Supportato                        | Non supportato                 | Non ancora supportato                               |
| **Bind mount**      | `docker.binds`                   | N/D                            | N/D                                                 |
| **Ideale per**      | Sviluppo locale, isolamento completo | Offloading su una macchina remota | Sandbox remoti gestiti con sync bidirezionale facoltativa |

### Backend SSH

Usa `backend: "ssh"` quando vuoi che OpenClaw esegua in sandbox `exec`, gli strumenti file e le letture media su
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
          // Oppure usa SecretRefs / contenuti inline invece di file locali:
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
- Al primo utilizzo dopo la creazione o la ricreazione, OpenClaw inizializza quel workspace remoto dal workspace locale una sola volta.
- Successivamente, `exec`, `read`, `write`, `edit`, `apply_patch`, le letture media nel prompt e la preparazione dei media in ingresso vengono eseguiti direttamente contro il workspace remoto via SSH.
- OpenClaw non sincronizza automaticamente sul workspace locale le modifiche remote.

Materiale di autenticazione:

- `identityFile`, `certificateFile`, `knownHostsFile`: usano file locali esistenti e li fanno passare tramite la configurazione OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: usano stringhe inline o SecretRefs. OpenClaw le risolve tramite il normale snapshot runtime dei segreti, le scrive in file temporanei con `0600` e le elimina quando termina la sessione SSH.
- Se per lo stesso elemento sono impostati sia `*File` sia `*Data`, `*Data` ha la precedenza per quella sessione SSH.

Questo è un modello **canonico remoto**. Il workspace SSH remoto diventa il vero stato del sandbox dopo il seed iniziale.

Conseguenze importanti:

- Le modifiche locali all'host effettuate fuori da OpenClaw dopo il seed non sono visibili in remoto finché non ricrei il sandbox.
- `openclaw sandbox recreate` elimina la root remota per ambito e al successivo utilizzo esegue di nuovo il seed dal locale.
- Il browser sandboxato non è supportato sul backend SSH.
- Le impostazioni `sandbox.docker.*` non si applicano al backend SSH.

### Backend OpenShell

Usa `backend: "openshell"` quando vuoi che OpenClaw esegua gli strumenti in sandbox in un
ambiente remoto gestito da OpenShell. Per la guida completa al setup, il riferimento
di configurazione e il confronto delle modalità del workspace, vedi la pagina dedicata
[OpenShell](/gateway/openshell).

OpenShell riutilizza lo stesso trasporto SSH di base e lo stesso bridge del filesystem remoto del
backend SSH generico, e aggiunge il ciclo di vita specifico di OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) più la modalità workspace facoltativa `mirror`.

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

- `mirror` (predefinita): il workspace locale resta canonico. OpenClaw sincronizza i file locali in OpenShell prima di `exec` e sincronizza di nuovo il workspace remoto dopo `exec`.
- `remote`: il workspace OpenShell diventa canonico dopo la creazione del sandbox. OpenClaw inizializza il workspace remoto dal workspace locale una volta, poi gli strumenti file e `exec` operano direttamente contro il sandbox remoto senza sincronizzare indietro le modifiche.

Dettagli del trasporto remoto:

- OpenClaw chiede a OpenShell la configurazione SSH specifica del sandbox tramite `openshell sandbox ssh-config <name>`.
- Il core scrive quella configurazione SSH in un file temporaneo, apre la sessione SSH e riutilizza lo stesso bridge del filesystem remoto usato da `backend: "ssh"`.
- In modalità `mirror` cambia solo il ciclo di vita: sincronizza locale → remoto prima di `exec`, poi sincronizza di nuovo al ritorno.

Limitazioni attuali di OpenShell:

- il browser sandboxato non è ancora supportato
- `sandbox.docker.binds` non è supportato sul backend OpenShell
- le opzioni runtime specifiche Docker sotto `sandbox.docker.*` continuano ad applicarsi solo al backend Docker

#### Modalità workspace

OpenShell ha due modelli di workspace. Questa è la parte che conta di più nella pratica.

##### `mirror`

Usa `plugins.entries.openshell.config.mode: "mirror"` quando vuoi che il **workspace locale resti canonico**.

Comportamento:

- Prima di `exec`, OpenClaw sincronizza il workspace locale nel sandbox OpenShell.
- Dopo `exec`, OpenClaw sincronizza il workspace remoto di nuovo nel workspace locale.
- Gli strumenti file operano comunque attraverso il bridge del sandbox, ma tra i turni il workspace locale resta la fonte di verità.

Usalo quando:

- modifichi file localmente fuori da OpenClaw e vuoi che quelle modifiche compaiano automaticamente nel sandbox
- vuoi che il sandbox OpenShell si comporti il più possibile come il backend Docker
- vuoi che il workspace host rifletta le scritture del sandbox dopo ogni turno di exec

Contropartita:

- costo di sincronizzazione aggiuntivo prima e dopo `exec`

##### `remote`

Usa `plugins.entries.openshell.config.mode: "remote"` quando vuoi che il **workspace OpenShell diventi canonico**.

Comportamento:

- Quando il sandbox viene creato per la prima volta, OpenClaw inizializza una volta il workspace remoto dal workspace locale.
- Successivamente, `exec`, `read`, `write`, `edit` e `apply_patch` operano direttamente contro il workspace OpenShell remoto.
- OpenClaw **non** sincronizza sul workspace locale le modifiche remote dopo `exec`.
- Le letture media al momento del prompt continuano a funzionare perché gli strumenti file e media leggono tramite il bridge del sandbox invece di assumere un percorso host locale.
- Il trasporto è SSH nel sandbox OpenShell restituito da `openshell sandbox ssh-config`.

Conseguenze importanti:

- Se modifichi file sull'host fuori da OpenClaw dopo il seed, il sandbox remoto **non** vedrà automaticamente quelle modifiche.
- Se il sandbox viene ricreato, il workspace remoto viene nuovamente inizializzato dal workspace locale.
- Con `scope: "agent"` o `scope: "shared"`, quel workspace remoto è condiviso allo stesso ambito.

Usalo quando:

- il sandbox deve vivere principalmente sul lato remoto OpenShell
- vuoi un overhead di sincronizzazione per turno più basso
- non vuoi che modifiche locali sull'host sovrascrivano silenziosamente lo stato remoto del sandbox

Scegli `mirror` se pensi al sandbox come a un ambiente di esecuzione temporaneo.
Scegli `remote` se pensi al sandbox come al vero workspace.

#### Ciclo di vita di OpenShell

I sandbox OpenShell sono comunque gestiti tramite il normale ciclo di vita del sandbox:

- `openclaw sandbox list` mostra i runtime OpenShell oltre a quelli Docker
- `openclaw sandbox recreate` elimina il runtime corrente e lascia che OpenClaw lo ricrei al successivo utilizzo
- anche la logica di prune è consapevole del backend

Per la modalità `remote`, la ricreazione è particolarmente importante:

- recreate elimina il workspace remoto canonico per quell'ambito
- al successivo utilizzo inizializza un nuovo workspace remoto dal workspace locale

Per la modalità `mirror`, recreate principalmente reimposta l'ambiente di esecuzione remoto
perché il workspace locale resta comunque canonico.

## Accesso al workspace

`agents.defaults.sandbox.workspaceAccess` controlla **cosa può vedere il sandbox**:

- `"none"` (predefinito): gli strumenti vedono un workspace sandbox sotto `~/.openclaw/sandboxes`.
- `"ro"`: monta il workspace dell'agente in sola lettura su `/agent` (disabilita `write`/`edit`/`apply_patch`).
- `"rw"`: monta il workspace dell'agente in lettura/scrittura su `/workspace`.

Con il backend OpenShell:

- la modalità `mirror` continua a usare il workspace locale come fonte canonica tra i turni di exec
- la modalità `remote` usa il workspace OpenShell remoto come fonte canonica dopo il seed iniziale
- `workspaceAccess: "ro"` e `"none"` limitano comunque il comportamento di scrittura allo stesso modo

I media in ingresso vengono copiati nel workspace sandbox attivo (`media/inbound/*`).
Nota sulle Skills: lo strumento `read` è radicato nel sandbox. Con `workspaceAccess: "none"`,
OpenClaw rispecchia le skills idonee nel workspace sandbox (`.../skills`) così
possono essere lette. Con `"rw"`, le skills del workspace sono leggibili da
`/workspace/skills`.

## Bind mount personalizzati

`agents.defaults.sandbox.docker.binds` monta directory host aggiuntive nel container.
Formato: `host:container:mode` (ad esempio `"/home/user/source:/source:rw"`).

I bind globali e per agente vengono **uniti** (non sostituiti). Con `scope: "shared"`, i bind per agente vengono ignorati.

`agents.defaults.sandbox.browser.binds` monta directory host aggiuntive solo nel container del **browser sandboxato**.

- Quando è impostato (compreso `[]`), sostituisce `agents.defaults.sandbox.docker.binds` per il container browser.
- Quando è omesso, il container browser ricade su `agents.defaults.sandbox.docker.binds` (retrocompatibile).

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

- I bind bypassano il filesystem del sandbox: espongono percorsi host con la modalità impostata (`:ro` o `:rw`).
- OpenClaw blocca sorgenti di bind pericolose (ad esempio: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` e mount padre che le esporrebbero).
- OpenClaw blocca anche root comuni di credenziali nella home directory come `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` e `~/.ssh`.
- La validazione dei bind non è solo un confronto di stringhe. OpenClaw normalizza il percorso sorgente, poi lo risolve di nuovo tramite l'antenato esistente più profondo prima di ricontrollare i percorsi bloccati e le root consentite.
- Questo significa che le escape tramite symlink padre continuano a fallire in chiusura anche quando la foglia finale non esiste ancora. Esempio: `/workspace/run-link/new-file` continua a risolversi come `/var/run/...` se `run-link` punta lì.
- Le root sorgente consentite vengono canonicalizzate allo stesso modo, quindi un percorso che solo apparentemente rientra nella allowlist prima della risoluzione dei symlink viene comunque rifiutato come `outside allowed roots`.
- I mount sensibili (segreti, chiavi SSH, credenziali di servizio) dovrebbero essere `:ro` a meno che non sia assolutamente necessario.
- Combina con `workspaceAccess: "ro"` se ti serve solo accesso in lettura al workspace; le modalità bind restano indipendenti.
- Vedi [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) per come i bind interagiscono con la policy degli strumenti e con exec elevato.

## Immagini + setup

Immagine Docker predefinita: `openclaw-sandbox:bookworm-slim`

Compilala una volta:

```bash
scripts/sandbox-setup.sh
```

Nota: l'immagine predefinita **non** include Node. Se una skill richiede Node (o
altri runtime), devi incorporare un'immagine personalizzata oppure installare tramite
`sandbox.docker.setupCommand` (richiede uscita di rete + root scrivibile +
utente root).

Se vuoi un'immagine sandbox più funzionale con strumenti comuni (ad esempio
`curl`, `jq`, `nodejs`, `python3`, `git`), compila:

```bash
scripts/sandbox-common-setup.sh
```

Poi imposta `agents.defaults.sandbox.docker.image` su
`openclaw-sandbox-common:bookworm-slim`.

Immagine del browser sandboxato:

```bash
scripts/sandbox-browser-setup.sh
```

Per impostazione predefinita, i container Docker sandbox vengono eseguiti **senza rete**.
Sovrascrivi con `agents.defaults.sandbox.docker.network`.

L'immagine del browser sandbox inclusa applica anche impostazioni di avvio conservative di Chromium
per carichi di lavoro containerizzati. Le impostazioni predefinite correnti del container includono:

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
  `--disable-software-rasterizer`, `--disable-gpu`) sono facoltativi e sono utili
  quando i container non hanno supporto GPU. Imposta `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  se il tuo carico di lavoro richiede WebGL o altre funzionalità browser/3D.
- `--disable-extensions` è abilitato per impostazione predefinita e può essere disabilitato con
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` per flussi che dipendono dalle estensioni.
- `--renderer-process-limit=2` è controllato da
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, dove `0` mantiene il valore predefinito di Chromium.

Se ti serve un profilo runtime diverso, usa un'immagine browser personalizzata e fornisci
il tuo entrypoint. Per profili Chromium locali (non container), usa
`browser.extraArgs` per aggiungere flag di avvio supplementari.

Valori predefiniti di sicurezza:

- `network: "host"` è bloccato.
- `network: "container:<id>"` è bloccato per impostazione predefinita (rischio di bypass tramite namespace join).
- Override break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Le installazioni Docker e il gateway containerizzato si trovano qui:
[Docker](/install/docker)

Per i deployment del gateway Docker, `scripts/docker/setup.sh` può inizializzare la configurazione del sandbox.
Imposta `OPENCLAW_SANDBOX=1` (o `true`/`yes`/`on`) per abilitare quel percorso. Puoi
sovrascrivere la posizione del socket con `OPENCLAW_DOCKER_SOCKET`. Riferimento completo
su setup e variabili d'ambiente: [Docker](/install/docker#agent-sandbox).

## setupCommand (setup del container una tantum)

`setupCommand` viene eseguito **una sola volta** dopo la creazione del container sandbox (non a ogni esecuzione).
Viene eseguito all'interno del container tramite `sh -lc`.

Percorsi:

- Globale: `agents.defaults.sandbox.docker.setupCommand`
- Per agente: `agents.list[].sandbox.docker.setupCommand`

Problemi comuni:

- Il valore predefinito di `docker.network` è `"none"` (nessun accesso in uscita), quindi le installazioni di pacchetti falliranno.
- `docker.network: "container:<id>"` richiede `dangerouslyAllowContainerNamespaceJoin: true` ed è solo break-glass.
- `readOnlyRoot: true` impedisce le scritture; imposta `readOnlyRoot: false` oppure incorpora un'immagine personalizzata.
- `user` deve essere root per le installazioni di pacchetti (ometti `user` oppure imposta `user: "0:0"`).
- L'exec del sandbox **non** eredita `process.env` dell'host. Usa
  `agents.defaults.sandbox.docker.env` (o un'immagine personalizzata) per le chiavi API delle skill.

## Policy degli strumenti + vie di fuga

Le policy allow/deny degli strumenti continuano ad applicarsi prima delle regole del sandbox. Se uno strumento è negato
globalmente o per agente, il sandboxing non lo riabilita.

`tools.elevated` è una via di fuga esplicita che esegue `exec` fuori dal sandbox (`gateway` per impostazione predefinita, oppure `node` quando la destinazione exec è `node`).
Le direttive `/exec` si applicano solo ai mittenti autorizzati e persistono per sessione; per disabilitare rigidamente
`exec`, usa la deny della policy degli strumenti (vedi [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debug:

- Usa `openclaw sandbox explain` per ispezionare la modalità sandbox effettiva, la policy degli strumenti e le chiavi di configurazione per la correzione.
- Vedi [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) per il modello mentale di “perché è bloccato?”.
  Mantienilo bloccato.

## Override multi-agente

Ogni agente può sovrascrivere sandbox + strumenti:
`agents.list[].sandbox` e `agents.list[].tools` (più `agents.list[].tools.sandbox.tools` per la policy strumenti del sandbox).
Vedi [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) per la precedenza.

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

- [OpenShell](/gateway/openshell) -- setup del backend sandbox gestito, modalità workspace e riferimento di configurazione
- [Sandbox Configuration](/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- debug di "perché è bloccato?"
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) -- override per agente e precedenza
- [Security](/gateway/security)
