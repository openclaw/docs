---
read_when:
    - Vuoi sandbox gestite nel cloud invece di Docker locale
    - Stai configurando il plugin OpenShell
    - Devi scegliere tra le modalità area di lavoro mirror e remota
summary: Usa OpenShell come backend sandbox gestito per gli agenti OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-06-27T17:33:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278f7550a3178c30a1b42f80495c55bb9827f7785ce9c4d1ee4a57adb3a5e4b
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell è un backend sandbox gestito per OpenClaw. Invece di eseguire
container Docker localmente, OpenClaw delega il ciclo di vita della sandbox alla
CLI `openshell`, che effettua il provisioning di ambienti remoti con esecuzione
dei comandi basata su SSH.

Il Plugin OpenShell riutilizza lo stesso trasporto SSH di base e lo stesso bridge
del filesystem remoto del [backend SSH](/it/gateway/sandboxing#ssh-backend)
generico. Aggiunge il ciclo di vita specifico di OpenShell (`sandbox
create/get/delete`, `sandbox ssh-config`) e una modalità workspace `mirror`
opzionale.

## Prerequisiti

- Plugin OpenShell installato (`openclaw plugins install @openclaw/openshell-sandbox`)
- La CLI `openshell` installata e presente in `PATH` (oppure imposta un percorso
  personalizzato tramite `plugins.entries.openshell.config.command`)
- Un account OpenShell con accesso alle sandbox
- OpenClaw Gateway in esecuzione sull'host

## Avvio rapido

1. Installa e abilita il Plugin, quindi imposta il backend sandbox:

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

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

2. Riavvia il Gateway. Al turno successivo dell'agente, OpenClaw crea una
   sandbox OpenShell e instrada l'esecuzione degli strumenti attraverso di essa.

3. Verifica:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modalità workspace

Questa è la decisione più importante quando si usa OpenShell.

### `mirror`

Usa `plugins.entries.openshell.config.mode: "mirror"` quando vuoi che il
**workspace locale resti canonico**.

Comportamento:

- Prima di `exec`, OpenClaw sincronizza il workspace locale nella sandbox OpenShell.
- Dopo `exec`, OpenClaw sincronizza il workspace remoto di nuovo nel workspace locale.
- Gli strumenti per i file operano comunque tramite il bridge della sandbox, ma il
  workspace locale rimane la fonte di verità tra i turni.

Ideale per:

- Modifichi file localmente fuori da OpenClaw e vuoi che tali modifiche siano
  visibili automaticamente nella sandbox.
- Vuoi che la sandbox OpenShell si comporti il più possibile come il backend Docker.
- Vuoi che il workspace host rifletta le scritture della sandbox dopo ogni turno exec.

Compromesso: costo di sincronizzazione aggiuntivo prima e dopo ogni exec.

### `remote`

Usa `plugins.entries.openshell.config.mode: "remote"` quando vuoi che il
**workspace OpenShell diventi canonico**.

Comportamento:

- Quando la sandbox viene creata per la prima volta, OpenClaw inizializza una sola
  volta il workspace remoto dal workspace locale.
- Dopo di che, `exec`, `read`, `write`, `edit` e `apply_patch` operano
  direttamente sul workspace OpenShell remoto.
- OpenClaw **non** sincronizza le modifiche remote nel workspace locale.
- Le letture dei media al momento del prompt continuano a funzionare perché gli
  strumenti per file e media leggono tramite il bridge della sandbox.

Ideale per:

- La sandbox deve risiedere principalmente sul lato remoto.
- Vuoi un overhead di sincronizzazione inferiore per turno.
- Non vuoi che modifiche locali sull'host sovrascrivano silenziosamente lo stato
  della sandbox remota.

<Warning>
Se modifichi file sull'host fuori da OpenClaw dopo l'inizializzazione iniziale, la sandbox remota **non** vede tali modifiche. Usa `openclaw sandbox recreate` per reinizializzarla.
</Warning>

### Scegliere una modalità

|                          | `mirror`                          | `remote`                         |
| ------------------------ | --------------------------------- | -------------------------------- |
| **Workspace canonico**   | Host locale                       | OpenShell remoto                 |
| **Direzione sync**       | Bidirezionale (ogni exec)         | Inizializzazione una tantum      |
| **Overhead per turno**   | Maggiore (upload + download)      | Minore (operazioni remote dirette) |
| **Modifiche locali visibili?** | Sì, al prossimo exec        | No, fino a recreate              |
| **Ideale per**           | Flussi di sviluppo                | Agenti di lunga durata, CI       |

## Riferimento di configurazione

Tutta la configurazione OpenShell si trova sotto `plugins.entries.openshell.config`:

| Chiave                    | Tipo                     | Predefinito   | Descrizione                                           |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` o `"remote"`  | `"mirror"`    | Modalità di sincronizzazione workspace                |
| `command`                 | `string`                 | `"openshell"` | Percorso o nome della CLI `openshell`                 |
| `from`                    | `string`                 | `"openclaw"`  | Origine sandbox per la prima creazione                |
| `gateway`                 | `string`                 | —             | Nome Gateway OpenShell (`--gateway`)                  |
| `gatewayEndpoint`         | `string`                 | —             | URL endpoint Gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID policy OpenShell per la creazione della sandbox    |
| `providers`               | `string[]`               | `[]`          | Nomi dei provider da collegare quando la sandbox viene creata |
| `gpu`                     | `boolean`                | `false`       | Richiede risorse GPU                                  |
| `autoProviders`           | `boolean`                | `true`        | Passa `--auto-providers` durante la creazione della sandbox |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Workspace scrivibile principale dentro la sandbox     |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Percorso di mount del workspace agente (per accesso in sola lettura) |
| `timeoutSeconds`          | `number`                 | `120`         | Timeout per le operazioni della CLI `openshell`       |

Le impostazioni a livello di sandbox (`mode`, `scope`, `workspaceAccess`) si
configurano sotto `agents.defaults.sandbox`, come con qualsiasi backend. Consulta
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

Le sandbox OpenShell vengono gestite tramite la normale CLI sandbox:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

Per la modalità `remote`, **recreate è particolarmente importante**: elimina il
workspace remoto canonico per quello scope. L'uso successivo inizializza un nuovo
workspace remoto dal workspace locale.

Per la modalità `mirror`, recreate reimposta principalmente l'ambiente di
esecuzione remoto, perché il workspace locale rimane canonico.

### Quando usare recreate

Usa recreate dopo aver modificato uno di questi elementi:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Rafforzamento della sicurezza

OpenShell fissa il fd della radice del workspace e ricontrolla l'identità della
sandbox prima di ogni lettura, quindi scambi di symlink o un workspace rimontato
non possono reindirizzare le letture fuori dal workspace remoto previsto.

## Limitazioni attuali

- Il browser sandbox non è supportato sul backend OpenShell.
- `sandbox.docker.binds` non si applica a OpenShell.
- Le impostazioni runtime specifiche di Docker sotto `sandbox.docker.*` si
  applicano solo al backend Docker.

## Come funziona

1. OpenClaw chiama `openshell sandbox create` (con i flag `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` come configurato).
2. OpenClaw chiama `openshell sandbox ssh-config <name>` per ottenere i dettagli
   di connessione SSH della sandbox.
3. Il core scrive la configurazione SSH in un file temporaneo e apre una sessione
   SSH usando lo stesso bridge del filesystem remoto del backend SSH generico.
4. In modalità `mirror`: sincronizza dal locale al remoto prima di exec, esegue,
   poi sincronizza indietro dopo exec.
5. In modalità `remote`: inizializza una volta alla creazione, poi opera
   direttamente sul workspace remoto.

## Correlati

- [Sandboxing](/it/gateway/sandboxing) -- modalità, scope e confronto dei backend
- [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) -- debug degli strumenti bloccati
- [Multi-Agent Sandbox and Tools](/it/tools/multi-agent-sandbox-tools) -- override per agente
- [CLI sandbox](/it/cli/sandbox) -- comandi `openclaw sandbox`
