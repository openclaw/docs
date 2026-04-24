---
read_when:
    - Vuoi sandbox gestite nel cloud invece di Docker locale
    - Stai configurando il Plugin OpenShell
    - Devi scegliere tra le modalità workspace mirror e remote
summary: Usa OpenShell come backend sandbox gestito per gli agenti OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-24T08:41:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47954cd27b4c7ef9d4268597c2846960b39b99fd03ece5dddb5055e9282366a0
    source_path: gateway/openshell.md
    workflow: 15
---

OpenShell è un backend sandbox gestito per OpenClaw. Invece di eseguire container Docker
in locale, OpenClaw delega il ciclo di vita della sandbox alla CLI `openshell`,
che effettua il provisioning di ambienti remoti con esecuzione dei comandi basata su SSH.

Il Plugin OpenShell riutilizza lo stesso trasporto SSH core e lo stesso bridge
del filesystem remoto del backend [SSH](/it/gateway/sandboxing#ssh-backend) generico. Aggiunge
il ciclo di vita specifico di OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
e una modalità workspace `mirror` facoltativa.

## Prerequisiti

- La CLI `openshell` installata e presente in `PATH` (oppure imposta un percorso personalizzato tramite
  `plugins.entries.openshell.config.command`)
- Un account OpenShell con accesso alla sandbox
- OpenClaw Gateway in esecuzione sull'host

## Avvio rapido

1. Abilita il Plugin e imposta il backend sandbox:

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
          mode: "remote",
        },
      },
    },
  },
}
```

2. Riavvia il Gateway. Al turno successivo dell'agente, OpenClaw crea una sandbox OpenShell
   e instrada attraverso di essa l'esecuzione degli strumenti.

3. Verifica:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modalità workspace

Questa è la decisione più importante quando usi OpenShell.

### `mirror`

Usa `plugins.entries.openshell.config.mode: "mirror"` quando vuoi che il **workspace
locale resti canonico**.

Comportamento:

- Prima di `exec`, OpenClaw sincronizza il workspace locale nella sandbox OpenShell.
- Dopo `exec`, OpenClaw sincronizza il workspace remoto di nuovo nel workspace locale.
- Gli strumenti file continuano a operare tramite il bridge della sandbox, ma il workspace locale
  resta la fonte di verità tra un turno e l'altro.

Ideale per:

- Modifichi file localmente fuori da OpenClaw e vuoi che queste modifiche siano visibili nella
  sandbox automaticamente.
- Vuoi che la sandbox OpenShell si comporti il più possibile come il backend Docker.
- Vuoi che il workspace host rifletta le scritture della sandbox dopo ogni turno exec.

Compromesso: costo di sincronizzazione aggiuntivo prima e dopo ogni exec.

### `remote`

Usa `plugins.entries.openshell.config.mode: "remote"` quando vuoi che il
**workspace OpenShell diventi canonico**.

Comportamento:

- Quando la sandbox viene creata per la prima volta, OpenClaw inizializza il workspace remoto dal
  workspace locale una sola volta.
- Dopo di che, `exec`, `read`, `write`, `edit` e `apply_patch` operano
  direttamente sul workspace remoto OpenShell.
- OpenClaw **non** sincronizza le modifiche remote di nuovo nel workspace locale.
- Le letture dei media al momento del prompt continuano a funzionare perché gli strumenti file e media leggono tramite
  il bridge della sandbox.

Ideale per:

- La sandbox dovrebbe vivere principalmente sul lato remoto.
- Vuoi un overhead di sincronizzazione per turno più basso.
- Non vuoi che modifiche locali sull'host sovrascrivano silenziosamente lo stato remoto della sandbox.

Importante: se modifichi file sull'host fuori da OpenClaw dopo l'inizializzazione iniziale,
la sandbox remota **non** vede quelle modifiche. Usa
`openclaw sandbox recreate` per reinizializzarla.

### Scegliere una modalità

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Workspace canonico**   | Host locale                | OpenShell remoto          |
| **Direzione sync**       | Bidirezionale (ogni exec)  | Inizializzazione una tantum |
| **Overhead per turno**   | Più alto (upload + download) | Più basso (operazioni remote dirette) |
| **Modifiche locali visibili?** | Sì, al prossimo exec   | No, fino a recreate       |
| **Ideale per**           | Workflow di sviluppo       | Agenti di lunga durata, CI |

## Riferimento della configurazione

Tutta la configurazione di OpenShell si trova sotto `plugins.entries.openshell.config`:

| Chiave                    | Tipo                     | Predefinito   | Descrizione                                           |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` o `"remote"`  | `"mirror"`    | Modalità di sincronizzazione del workspace            |
| `command`                 | `string`                 | `"openshell"` | Percorso o nome della CLI `openshell`                 |
| `from`                    | `string`                 | `"openclaw"`  | Sorgente della sandbox per la prima creazione         |
| `gateway`                 | `string`                 | —             | Nome del gateway OpenShell (`--gateway`)              |
| `gatewayEndpoint`         | `string`                 | —             | URL endpoint del gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID policy OpenShell per la creazione della sandbox    |
| `providers`               | `string[]`               | `[]`          | Nomi dei provider da collegare quando la sandbox viene creata |
| `gpu`                     | `boolean`                | `false`       | Richiede risorse GPU                                  |
| `autoProviders`           | `boolean`                | `true`        | Passa `--auto-providers` durante `sandbox create`     |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Workspace principale scrivibile all'interno della sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Percorso di mount del workspace dell'agente (per accesso in sola lettura) |
| `timeoutSeconds`          | `number`                 | `120`         | Timeout per le operazioni CLI `openshell`             |

Le impostazioni a livello di sandbox (`mode`, `scope`, `workspaceAccess`) si configurano sotto
`agents.defaults.sandbox` come per qualsiasi backend. Vedi
[Sandboxing](/it/gateway/sandboxing) per la matrice completa.

## Esempi

### Configurazione remota minima

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### Modalità mirror con GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
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
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell per agente con gateway personalizzato

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Gestione del ciclo di vita

Le sandbox OpenShell vengono gestite tramite la normale CLI sandbox:

```bash
# Elenca tutti i runtime sandbox (Docker + OpenShell)
openclaw sandbox list

# Ispeziona la policy effettiva
openclaw sandbox explain

# Recreate (elimina il workspace remoto, reinizializza al prossimo utilizzo)
openclaw sandbox recreate --all
```

Per la modalità `remote`, **recreate è particolarmente importante**: elimina il workspace
remoto canonico per quell'ambito. All'utilizzo successivo inizializza un nuovo workspace remoto dal
workspace locale.

Per la modalità `mirror`, recreate principalmente reimposta l'ambiente di esecuzione remoto perché
il workspace locale resta canonico.

### Quando eseguire recreate

Esegui recreate dopo aver cambiato uno qualsiasi di questi elementi:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Hardening di sicurezza

OpenShell fissa il fd root del workspace e ricontrolla l'identità della sandbox prima di ogni
lettura, così scambi di symlink o un workspace rimontato non possono reindirizzare le letture fuori dal
workspace remoto previsto.

## Limitazioni attuali

- Il browser sandbox non è supportato sul backend OpenShell.
- `sandbox.docker.binds` non si applica a OpenShell.
- I controlli runtime specifici di Docker sotto `sandbox.docker.*` si applicano solo al backend
  Docker.

## Come funziona

1. OpenClaw chiama `openshell sandbox create` (con `--from`, `--gateway`,
   `--policy`, `--providers`, flag `--gpu` secondo configurazione).
2. OpenClaw chiama `openshell sandbox ssh-config <name>` per ottenere i dettagli
   della connessione SSH per la sandbox.
3. Il core scrive la configurazione SSH in un file temporaneo e apre una sessione SSH usando lo
   stesso bridge del filesystem remoto del backend SSH generico.
4. In modalità `mirror`: sincronizza da locale a remoto prima di exec, esegue, sincronizza indietro dopo exec.
5. In modalità `remote`: inizializza una volta alla creazione, poi opera direttamente sul
   workspace remoto.

## Correlati

- [Sandboxing](/it/gateway/sandboxing) -- modalità, ambiti e confronto tra backend
- [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) -- debug degli strumenti bloccati
- [Multi-Agent Sandbox and Tools](/it/tools/multi-agent-sandbox-tools) -- override per agente
- [CLI Sandbox](/it/cli/sandbox) -- comandi `openclaw sandbox`
