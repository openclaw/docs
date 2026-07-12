---
read_when:
    - Vuoi sandbox gestite nel cloud anziché Docker locale
    - Stai configurando il plugin OpenShell
    - Devi scegliere tra le modalità area di lavoro con mirroring e remota
summary: Usa OpenShell come backend sandbox gestito per gli agenti OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-07-12T07:05:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell è un backend sandbox gestito: invece di eseguire container Docker
localmente, OpenClaw delega il ciclo di vita della sandbox alla CLI `openshell`, che
predispone ambienti remoti ed esegue comandi tramite SSH.

Il plugin riutilizza lo stesso trasporto SSH e lo stesso bridge del filesystem remoto del
[backend SSH](/it/gateway/sandboxing#ssh-backend) generico e aggiunge la gestione del
ciclo di vita di OpenShell (`sandbox create/get/delete/ssh-config`), oltre a una modalità
opzionale `mirror` per la sincronizzazione dell'area di lavoro.

## Prerequisiti

- Plugin OpenShell installato (`openclaw plugins install @openclaw/openshell-sandbox`)
- CLI `openshell` disponibile in `PATH` (oppure un percorso personalizzato tramite
  `plugins.entries.openshell.config.command`)
- Un account OpenShell con accesso alle sandbox
- Gateway OpenClaw in esecuzione sull'host

## Avvio rapido

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

Riavvia il Gateway. Al turno successivo dell'agente, OpenClaw crea una sandbox
OpenShell e vi instrada l'esecuzione degli strumenti. Verifica con:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modalità dell'area di lavoro

Questa è la decisione più importante relativa a OpenShell.

### mirror (predefinita)

`plugins.entries.openshell.config.mode: "mirror"` mantiene **canonica l'area di
lavoro locale**:

- Prima di `exec`, OpenClaw sincronizza l'area di lavoro locale nella sandbox.
- Dopo `exec`, OpenClaw sincronizza nuovamente in locale l'area di lavoro remota.
- Gli strumenti per i file passano attraverso il bridge della sandbox, ma tra un
  turno e l'altro la copia locale rimane la fonte autorevole.

Ideale per i flussi di lavoro di sviluppo: le modifiche locali effettuate al di fuori
di OpenClaw vengono rilevate alla successiva esecuzione e il comportamento della
sandbox è simile a quello del backend Docker.

Compromesso: costo di caricamento e scaricamento a ogni turno di esecuzione.

### remote

`mode: "remote"` rende **canonica l'area di lavoro OpenShell**:

- Alla prima creazione della sandbox, OpenClaw inizializza una sola volta l'area
  di lavoro remota a partire da quella locale.
- Successivamente, `exec`, `read`, `write`, `edit` e `apply_patch` operano
  direttamente sull'area di lavoro remota. OpenClaw **non** sincronizza le modifiche
  remote in locale.
- La lettura dei contenuti multimediali durante la generazione del prompt continua
  a funzionare (gli strumenti per file e contenuti multimediali leggono tramite il
  bridge della sandbox).

Ideale per agenti di lunga durata e CI: minore sovraccarico per turno e le modifiche
locali sull'host non possono sovrascrivere silenziosamente lo stato remoto.

<Warning>
Le modifiche ai file effettuate sull'host al di fuori di OpenClaw dopo l'inizializzazione non sono visibili alla sandbox remota. Esegui `openclaw sandbox recreate` per inizializzarla nuovamente.
</Warning>

### Scelta della modalità

|                               | `mirror`                             | `remote`                             |
| ----------------------------- | ------------------------------------ | ------------------------------------ |
| **Area di lavoro canonica**   | Host locale                          | OpenShell remoto                     |
| **Direzione sincronizzazione**| Bidirezionale (a ogni esecuzione)    | Inizializzazione singola             |
| **Sovraccarico per turno**    | Maggiore (caricamento + scaricamento)| Minore (operazioni remote dirette)   |
| **Modifiche locali visibili?**| Sì, alla successiva esecuzione       | No, fino alla ricreazione            |
| **Ideale per**                | Flussi di lavoro di sviluppo         | Agenti di lunga durata, CI           |

## Riferimento della configurazione

Tutta la configurazione di OpenShell si trova in `plugins.entries.openshell.config`:

| Chiave                    | Tipo                     | Valore predefinito | Descrizione                                                                                         |
| ------------------------- | ------------------------ | ------------------ | --------------------------------------------------------------------------------------------------- |
| `mode`                    | `"mirror"` o `"remote"`  | `"mirror"`         | Modalità di sincronizzazione dell'area di lavoro                                                    |
| `command`                 | `string`                 | `"openshell"`      | Percorso o nome della CLI `openshell`                                                               |
| `from`                    | `string`                 | `"openclaw"`       | Origine della sandbox per la prima creazione                                                        |
| `gateway`                 | `string`                 | non impostato      | Nome del gateway OpenShell (`--gateway` di primo livello)                                           |
| `gatewayEndpoint`         | `string`                 | non impostato      | Endpoint del gateway OpenShell (`--gateway-endpoint` di primo livello)                              |
| `policy`                  | `string`                 | non impostato      | ID della policy OpenShell per la creazione della sandbox                                            |
| `providers`               | `string[]`               | `[]`               | Nomi dei provider associati alla creazione della sandbox (deduplicati, un flag `--provider` per voce) |
| `gpu`                     | `boolean`                | `false`            | Richiede risorse GPU (`--gpu`)                                                                      |
| `autoProviders`           | `boolean`                | `true`             | Passa `--auto-providers` (o `--no-auto-providers` se false) durante la creazione                     |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`       | Area di lavoro principale scrivibile all'interno della sandbox                                      |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`         | Percorso di montaggio dell'area di lavoro dell'agente (sola lettura se l'accesso non è `rw`)        |
| `timeoutSeconds`          | `number`                 | `120`              | Timeout per le operazioni della CLI `openshell`                                                      |

`remoteWorkspaceDir` e `remoteAgentWorkspaceDir` devono essere percorsi assoluti e
rimanere nelle radici gestite `/sandbox` o `/agent`; gli altri percorsi assoluti vengono
rifiutati.

Le impostazioni a livello di sandbox (`mode`, `scope`, `workspaceAccess`) si trovano in
`agents.defaults.sandbox`, come per qualsiasi backend. Consulta
[Gestione delle sandbox](/it/gateway/sandboxing) per la matrice completa.

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

```bash
# Elenca tutti i runtime sandbox (Docker + OpenShell)
openclaw sandbox list

# Esamina la policy effettiva
openclaw sandbox explain

# Ricrea (elimina l'area di lavoro remota e la reinizializza all'utilizzo successivo)
openclaw sandbox recreate --all
```

Per la modalità `remote`, la ricreazione è particolarmente importante: elimina l'area
di lavoro remota canonica per l'ambito specificato e, all'utilizzo successivo, ne
inizializza una nuova a partire da quella locale. Per la modalità `mirror`, la ricreazione
reimposta principalmente l'ambiente di esecuzione remoto, poiché la copia locale rimane
canonica.

Ricrea dopo aver modificato uno dei seguenti elementi:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## Rafforzamento della sicurezza

Il bridge del filesystem in modalità mirror vincola la radice dell'area di lavoro locale
e ricontrolla i percorsi canonici (tramite realpath) prima di ogni lettura, scrittura,
creazione di directory, rimozione e rinomina, rifiutando i collegamenti simbolici
all'interno del percorso. La sostituzione di un collegamento simbolico o il rimontaggio
dell'area di lavoro non possono reindirizzare l'accesso ai file al di fuori dell'albero
replicato.

## Limitazioni attuali

- Il browser della sandbox non è supportato dal backend OpenShell.
- `sandbox.docker.binds` non si applica a OpenShell; la creazione della sandbox non
  riesce se sono configurati dei bind.
- Le opzioni di runtime specifiche di Docker in `sandbox.docker.*` (tranne `env`)
  si applicano solo al backend Docker.

## Funzionamento

1. OpenClaw esegue `sandbox get` per il nome della sandbox (con gli eventuali
   `--gateway`/`--gateway-endpoint` configurati); se l'operazione non riesce, ne
   crea una con `sandbox create`, passando `--name`, `--from`, `--policy` quando
   impostato, `--gpu` quando abilitato, `--auto-providers`/`--no-auto-providers`
   e un flag `--provider` per ogni provider configurato.
2. OpenClaw esegue `sandbox ssh-config` per il nome della sandbox per recuperare
   i dettagli della connessione SSH.
3. Il core scrive la configurazione SSH in un file temporaneo e apre una sessione
   SSH tramite lo stesso bridge del filesystem remoto del backend SSH generico.
4. In modalità `mirror`: sincronizza dal locale al remoto prima dell'esecuzione,
   esegue il comando, quindi sincronizza nuovamente dal remoto al locale.
5. In modalità `remote`: inizializza una volta alla creazione, quindi opera
   direttamente sull'area di lavoro remota.

## Argomenti correlati

- [Gestione delle sandbox](/it/gateway/sandboxing) - modalità, ambiti e confronto tra backend
- [Sandbox, policy degli strumenti e privilegi elevati](/it/gateway/sandbox-vs-tool-policy-vs-elevated) - debug degli strumenti bloccati
- [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) - sostituzioni per agente
- [CLI della sandbox](/it/cli/sandbox) - comandi `openclaw sandbox`
