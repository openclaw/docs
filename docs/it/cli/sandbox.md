---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gestisci gli ambienti di runtime sandbox e verifica i criteri sandbox effettivi
title: CLI sandbox
x-i18n:
    generated_at: "2026-07-12T06:56:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

Gestisci i runtime sandbox per l'esecuzione isolata degli agenti: container Docker, destinazioni SSH o backend OpenShell.

## Comandi

### `openclaw sandbox list`

Elenca i runtime sandbox con stato, backend, corrispondenza della configurazione, età, tempo di inattività e sessione/agente associato.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # solo container del browser
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

Rimuove i runtime sandbox per forzarne la ricreazione con la configurazione corrente. I runtime vengono ricreati automaticamente al successivo utilizzo dell'agente.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # include le sottosessioni agent:mybot:*
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # solo container del browser
openclaw sandbox recreate --all --force        # ignora la conferma
```

Opzioni:

- `--all`: ricrea tutti i container sandbox
- `--session <key>`: ricrea il runtime con questa chiave di ambito esatta (come mostrata da `sandbox list`); nessuna espansione dei nomi abbreviati
- `--agent <id>`: ricrea i runtime per un agente (corrisponde a `agent:<id>` e `agent:<id>:*`)
- `--browser`: interessa solo i container del browser
- `--force`: ignora la richiesta di conferma

Specifica esattamente una tra `--all`, `--session` e `--agent`.

Per `ssh` e OpenShell `remote`, la ricreazione è più rilevante che con Docker: dopo il popolamento iniziale, lo spazio di lavoro remoto è quello canonico; `recreate` elimina tale spazio di lavoro remoto canonico per l'ambito selezionato e l'esecuzione successiva lo ripopola dallo spazio di lavoro locale corrente.

### `openclaw sandbox explain`

Esamina la modalità e l'ambito sandbox effettivi, l'accesso allo spazio di lavoro, i criteri degli strumenti sandbox e i controlli per gli strumenti con privilegi elevati (con i percorsi delle chiavi di configurazione da correggere).

Il rapporto mantiene `workspaceRoot` come radice sandbox configurata e mostra separatamente lo spazio di lavoro host effettivo, la directory di lavoro del runtime del backend e la tabella dei montaggi Docker. Con `workspaceAccess: "rw"`, lo spazio di lavoro host effettivo è lo spazio di lavoro dell'agente anziché una directory sotto `workspaceRoot`.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

A differenza di `recreate --session`, questo comando accetta nomi di sessione abbreviati (ad esempio `main`) e li espande in base all'agente risolto.

## Perché è necessaria la ricreazione

L'aggiornamento della configurazione sandbox non influisce sui container in esecuzione: i runtime esistenti mantengono le impostazioni precedenti e quelli inattivi vengono rimossi solo dopo `prune.idleHours` (valore predefinito: 24 ore). Gli agenti utilizzati regolarmente possono mantenere attivi indefinitamente runtime obsoleti. `openclaw sandbox recreate` rimuove il vecchio runtime affinché, al successivo utilizzo, venga ricostruito dalla configurazione corrente.

<Tip>
Preferisci `openclaw sandbox recreate` alla pulizia manuale specifica del backend. Usa il registro dei runtime del Gateway ed evita incongruenze quando cambiano l'ambito o le chiavi di sessione.
</Tip>

## Cause comuni

| Modifica                                                                                                                                                       | Comando                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Aggiornamento dell'immagine Docker (`agents.defaults.sandbox.docker.image`)                                                                                    | `openclaw sandbox recreate --all`                                   |
| Configurazione sandbox (`agents.defaults.sandbox.*`)                                                                                                           | `openclaw sandbox recreate --all`                                   |
| Destinazione/autenticazione SSH (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| Origine/criteri/modalità OpenShell (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                      | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (o `--agent <id>` per un solo agente) |

<Note>
I runtime vengono ricreati automaticamente al successivo utilizzo dell'agente.
</Note>

## Migrazione del registro

I metadati dei runtime sandbox risiedono nel database di stato SQLite condiviso. Le installazioni meno recenti possono contenere file di registro legacy che le normali operazioni di lettura non riscrivono più:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- un frammento JSON per ogni container/browser in `~/.openclaw/sandbox/containers/` o `~/.openclaw/sandbox/browsers/`

Esegui `openclaw doctor --fix` per migrare in SQLite le voci legacy valide. I file legacy non validi vengono messi in quarantena, così un vecchio registro danneggiato non può nascondere le voci dei runtime correnti.

## Configurazione

Le impostazioni sandbox si trovano in `~/.openclaw/openclaw.json`, sotto `agents.defaults.sandbox` (le sostituzioni specifiche per agente vanno in `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell (fornito dal plugin)
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... altre opzioni Docker
        },
        "prune": {
          "idleHours": 24, // rimozione automatica dopo 24 ore di inattività
          "maxAgeDays": 7, // rimozione automatica dopo 7 giorni
        },
      },
    },
  },
}
```

## Argomenti correlati

- [Riferimento della CLI](/it/cli)
- [Esecuzione in sandbox](/it/gateway/sandboxing)
- [Spazio di lavoro dell'agente](/it/concepts/agent-workspace)
- [Doctor](/it/gateway/doctor): verifica la configurazione della sandbox.
