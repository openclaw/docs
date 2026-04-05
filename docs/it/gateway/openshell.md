---
read_when:
    - Vuoi sandbox gestite nel cloud invece di Docker locale
    - Stai configurando il plugin OpenShell
    - Devi scegliere tra le modalità di spazio di lavoro mirror e remote
summary: Usa OpenShell come backend sandbox gestito per gli agenti OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-05T13:52:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: aaf9027d0632a70fb86455f8bc46dc908ff766db0eb0cdf2f7df39c715241ead
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell è un backend sandbox gestito per OpenClaw. Invece di eseguire container Docker
in locale, OpenClaw delega il ciclo di vita della sandbox alla CLI `openshell`,
che effettua il provisioning di ambienti remoti con esecuzione dei comandi basata su SSH.

Il plugin OpenShell riutilizza lo stesso transport SSH core e lo stesso bridge
del filesystem remoto del [backend SSH](/gateway/sandboxing#ssh-backend) generico. Aggiunge
il ciclo di vita specifico di OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
e una modalità opzionale di spazio di lavoro `mirror`.

## Prerequisiti

- La CLI `openshell` installata e presente in `PATH` (oppure imposta un percorso personalizzato tramite
  `plugins.entries.openshell.config.command`)
- Un account OpenShell con accesso alla sandbox
- Gateway OpenClaw in esecuzione sull'host

## Avvio rapido

1. Abilita il plugin e imposta il backend sandbox:

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
   e instrada l'esecuzione degli strumenti attraverso di essa.

3. Verifica:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modalità dello spazio di lavoro

Questa è la decisione più importante quando usi OpenShell.

### `mirror`

Usa `plugins.entries.openshell.config.mode: "mirror"` quando vuoi che **lo spazio di lavoro
locale resti canonico**.

Comportamento:

- Prima di `exec`, OpenClaw sincronizza lo spazio di lavoro locale nella sandbox OpenShell.
- Dopo `exec`, OpenClaw sincronizza di nuovo lo spazio di lavoro remoto in quello locale.
- Gli strumenti file continuano a operare tramite il bridge della sandbox, ma lo spazio di lavoro locale
  resta la fonte di verità tra i turni.

Ideale per:

- Modifichi file localmente fuori da OpenClaw e vuoi che queste modifiche siano visibili
  automaticamente nella sandbox.
- Vuoi che la sandbox OpenShell si comporti il più possibile come il backend Docker.
- Vuoi che lo spazio di lavoro host rifletta le scritture della sandbox dopo ogni turno `exec`.

Compromesso: costo di sincronizzazione aggiuntivo prima e dopo ogni `exec`.

### `remote`

Usa `plugins.entries.openshell.config.mode: "remote"` quando vuoi che lo
**spazio di lavoro OpenShell diventi canonico**.

Comportamento:

- Quando la sandbox viene creata per la prima volta, OpenClaw inizializza una volta lo spazio di lavoro remoto
  a partire da quello locale.
- Dopo di ciò, `exec`, `read`, `write`, `edit` e `apply_patch` operano
  direttamente sullo spazio di lavoro remoto OpenShell.
- OpenClaw **non** sincronizza di nuovo le modifiche remote nello spazio di lavoro locale.
- Le letture dei media al momento del prompt continuano a funzionare perché gli strumenti file e media leggono tramite
  il bridge della sandbox.

Ideale per:

- La sandbox deve vivere principalmente sul lato remoto.
- Vuoi un overhead di sincronizzazione minore per turno.
- Non vuoi che modifiche locali sull'host sovrascrivano silenziosamente lo stato della sandbox remota.

Importante: se modifichi file sull'host fuori da OpenClaw dopo l'inizializzazione iniziale,
la sandbox remota **non** vede queste modifiche. Usa
`openclaw sandbox recreate` per reinizializzarla.

### Scegliere una modalità

|                          | `mirror`                      | `remote`                 |
| ------------------------ | ----------------------------- | ------------------------ |
| **Spazio di lavoro canonico** | Host locale               | OpenShell remoto         |
| **Direzione sync**       | Bidirezionale (a ogni exec)   | Inizializzazione una tantum |
| **Overhead per turno**   | Più alto (upload + download)  | Più basso (operazioni remote dirette) |
| **Modifiche locali visibili?** | Sì, al prossimo exec     | No, fino a recreate      |
| **Ideale per**           | Flussi di sviluppo            | Agenti a lunga esecuzione, CI |

## Riferimento della configurazione

Tutta la configurazione di OpenShell si trova sotto `plugins.entries.openshell.config`:

| Chiave                    | Tipo                     | Predefinito   | Descrizione                                          |
| ------------------------- | ------------------------ | ------------- | ---------------------------------------------------- |
| `mode`                    | `"mirror"` o `"remote"`  | `"mirror"`    | Modalità di sincronizzazione dello spazio di lavoro  |
| `command`                 | `string`                 | `"openshell"` | Percorso o nome della CLI `openshell`                |
| `from`                    | `string`                 | `"openclaw"`  | Origine della sandbox per la prima creazione         |
| `gateway`                 | `string`                 | —             | Nome del gateway OpenShell (`--gateway`)             |
| `gatewayEndpoint`         | `string`                 | —             | URL endpoint del gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID policy OpenShell per la creazione della sandbox   |
| `providers`               | `string[]`               | `[]`          | Nomi dei provider da collegare quando viene creata la sandbox |
| `gpu`                     | `boolean`                | `false`       | Richiede risorse GPU                                 |
| `autoProviders`           | `boolean`                | `true`        | Passa `--auto-providers` durante `sandbox create`    |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Spazio di lavoro principale scrivibile all'interno della sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Percorso di mount dello spazio di lavoro dell'agente (per accesso in sola lettura) |
| `timeoutSeconds`          | `number`                 | `120`         | Timeout per le operazioni della CLI `openshell`      |

Le impostazioni a livello di sandbox (`mode`, `scope`, `workspaceAccess`) vengono configurate sotto
`agents.defaults.sandbox` come con qualsiasi backend. Vedi
[Sandboxing](/gateway/sandboxing) per la matrice completa.

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

# Ricrea (elimina lo spazio di lavoro remoto, reinizializza al prossimo utilizzo)
openclaw sandbox recreate --all
```

Per la modalità `remote`, **recreate è particolarmente importante**: elimina lo spazio di lavoro remoto
canonico per quell'ambito. L'utilizzo successivo inizializza uno spazio di lavoro remoto nuovo a partire
dallo spazio di lavoro locale.

Per la modalità `mirror`, recreate reimposta principalmente l'ambiente di esecuzione remoto perché
lo spazio di lavoro locale resta canonico.

### Quando eseguire recreate

Esegui recreate dopo aver modificato uno qualsiasi di questi elementi:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Limitazioni attuali

- Il browser della sandbox non è supportato nel backend OpenShell.
- `sandbox.docker.binds` non si applica a OpenShell.
- I controlli runtime specifici di Docker sotto `sandbox.docker.*` si applicano solo al backend
  Docker.

## Come funziona

1. OpenClaw chiama `openshell sandbox create` (con i flag `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` come configurato).
2. OpenClaw chiama `openshell sandbox ssh-config <name>` per ottenere i dettagli di connessione SSH
   della sandbox.
3. Il core scrive la configurazione SSH in un file temporaneo e apre una sessione SSH usando lo
   stesso bridge del filesystem remoto del backend SSH generico.
4. In modalità `mirror`: sincronizza da locale a remoto prima di exec, esegue, sincronizza di nuovo dopo exec.
5. In modalità `remote`: inizializza una volta alla creazione, poi opera direttamente sullo
   spazio di lavoro remoto.

## Vedi anche

- [Sandboxing](/gateway/sandboxing) -- modalità, ambiti e confronto tra backend
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- debug degli strumenti bloccati
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- override per agente
- [Sandbox CLI](/cli/sandbox) -- comandi `openclaw sandbox`
