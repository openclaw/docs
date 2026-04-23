---
read_when:
    - Vuoi sandbox gestite nel cloud invece di Docker locale
    - Stai configurando il plugin OpenShell
    - Devi scegliere tra le modalità mirror e remote workspace
summary: Usa OpenShell come backend sandbox gestito per gli agenti OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T08:28:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534127b293364659a14df3e36583a9b7120f5d55cdbd8b4b611efe44adc7ff8
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell è un backend sandbox gestito per OpenClaw. Invece di eseguire container Docker
in locale, OpenClaw delega il ciclo di vita della sandbox alla CLI `openshell`,
che esegue il provisioning di ambienti remoti con esecuzione dei comandi basata su SSH.

Il plugin OpenShell riusa lo stesso trasporto SSH core e lo stesso bridge del filesystem remoto
del backend generico [SSH](/it/gateway/sandboxing#ssh-backend). Aggiunge il ciclo di vita specifico di
OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
e una modalità di workspace `mirror` opzionale.

## Prerequisiti

- La CLI `openshell` installata e disponibile in `PATH` (oppure imposta un percorso personalizzato tramite
  `plugins.entries.openshell.config.command`)
- Un account OpenShell con accesso alle sandbox
- OpenClaw Gateway in esecuzione sull'host

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

2. Riavvia il Gateway. Al turno agente successivo, OpenClaw crea una sandbox OpenShell
   e instrada l'esecuzione degli strumenti attraverso di essa.

3. Verifica:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modalità workspace

Questa è la decisione più importante quando usi OpenShell.

### `mirror`

Usa `plugins.entries.openshell.config.mode: "mirror"` quando vuoi che il **workspace locale
resti canonico**.

Comportamento:

- Prima di `exec`, OpenClaw sincronizza il workspace locale nella sandbox OpenShell.
- Dopo `exec`, OpenClaw sincronizza il workspace remoto di nuovo nel workspace locale.
- Gli strumenti file continuano a operare tramite il bridge sandbox, ma il workspace locale
  resta la fonte di verità tra i turni.

Ideale per:

- Modifichi file localmente fuori da OpenClaw e vuoi che quelle modifiche siano visibili nella
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
- Dopo di ciò, `exec`, `read`, `write`, `edit` e `apply_patch` operano
  direttamente sul workspace remoto OpenShell.
- OpenClaw **non** sincronizza le modifiche remote di nuovo nel workspace locale.
- Le letture di media al momento del prompt continuano comunque a funzionare perché gli strumenti file e media leggono tramite
  il bridge sandbox.

Ideale per:

- La sandbox deve vivere principalmente sul lato remoto.
- Vuoi un overhead di sincronizzazione per turno più basso.
- Non vuoi che modifiche locali sull'host sovrascrivano silenziosamente lo stato remoto della sandbox.

Importante: se modifichi file sull'host fuori da OpenClaw dopo l'inizializzazione iniziale,
la sandbox remota **non** vede quelle modifiche. Usa
`openclaw sandbox recreate` per reinizializzare.

### Scegliere una modalità

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Workspace canonico**   | Host locale                | OpenShell remoto          |
| **Direzione sincronizzazione** | Bidirezionale (ogni exec)  | Inizializzazione una tantum |
| **Overhead per turno**   | Più alto (upload + download) | Più basso (operazioni remote dirette) |
| **Modifiche locali visibili?** | Sì, al prossimo exec       | No, fino a recreate       |
| **Ideale per**           | Flussi di sviluppo         | Agenti di lunga durata, CI |

## Riferimento configurazione

Tutta la configurazione di OpenShell vive sotto `plugins.entries.openshell.config`:

| Chiave                    | Tipo                     | Predefinito   | Descrizione                                           |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` o `"remote"`  | `"mirror"`    | Modalità di sincronizzazione del workspace            |
| `command`                 | `string`                 | `"openshell"` | Percorso o nome della CLI `openshell`                 |
| `from`                    | `string`                 | `"openclaw"`  | Sorgente sandbox per la prima creazione               |
| `gateway`                 | `string`                 | —             | Nome Gateway OpenShell (`--gateway`)                  |
| `gatewayEndpoint`         | `string`                 | —             | URL endpoint Gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID policy OpenShell per la creazione della sandbox    |
| `providers`               | `string[]`               | `[]`          | Nomi provider da collegare quando viene creata la sandbox |
| `gpu`                     | `boolean`                | `false`       | Richiede risorse GPU                                  |
| `autoProviders`           | `boolean`                | `true`        | Passa `--auto-providers` durante la creazione della sandbox |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Workspace scrivibile principale all'interno della sandbox |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Percorso mount del workspace agente (per accesso di sola lettura) |
| `timeoutSeconds`          | `number`                 | `120`         | Timeout per le operazioni della CLI `openshell`       |

Le impostazioni a livello sandbox (`mode`, `scope`, `workspaceAccess`) sono configurate sotto
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

### OpenShell per agente con Gateway personalizzato

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

Le sandbox OpenShell sono gestite tramite la normale CLI sandbox:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

Per la modalità `remote`, **recreate è particolarmente importante**: elimina il workspace remoto
canonico per quell'ambito. All'uso successivo inizializza un nuovo workspace remoto dal
workspace locale.

Per la modalità `mirror`, recreate reimposta principalmente l'ambiente di esecuzione remoto perché
il workspace locale resta canonico.

### Quando eseguire recreate

Esegui recreate dopo aver cambiato uno qualsiasi di questi:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Hardening della sicurezza

OpenShell fissa il file descriptor root del workspace e ricontrolla l'identità della sandbox prima di ogni
lettura, così scambi di symlink o un workspace rimontato non possono reindirizzare le letture fuori
dal workspace remoto previsto.

## Limitazioni attuali

- Il browser sandbox non è supportato sul backend OpenShell.
- `sandbox.docker.binds` non si applica a OpenShell.
- Le manopole di runtime specifiche Docker sotto `sandbox.docker.*` si applicano solo al backend
  Docker.

## Come funziona

1. OpenClaw chiama `openshell sandbox create` (con i flag `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` come configurato).
2. OpenClaw chiama `openshell sandbox ssh-config <name>` per ottenere i dettagli
   di connessione SSH per la sandbox.
3. Il core scrive la configurazione SSH in un file temporaneo e apre una sessione SSH usando lo
   stesso bridge del filesystem remoto del backend SSH generico.
4. In modalità `mirror`: sincronizza da locale a remoto prima di exec, esegue, sincronizza di nuovo dopo exec.
5. In modalità `remote`: inizializza una volta alla creazione, poi opera direttamente sul workspace
   remoto.

## Vedi anche

- [Sandboxing](/it/gateway/sandboxing) -- modalità, ambiti e confronto tra backend
- [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) -- debug degli strumenti bloccati
- [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) -- sovrascritture per agente
- [CLI Sandbox](/it/cli/sandbox) -- comandi `openclaw sandbox`
