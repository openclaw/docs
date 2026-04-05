---
read_when:
    - Il nodo è connesso ma gli strumenti camera/canvas/screen/exec falliscono
    - Ti serve il modello mentale pairing del nodo vs approvazioni
summary: Risoluzione dei problemi di pairing dei nodi, requisiti di primo piano, permessi e guasti degli strumenti
title: Risoluzione dei problemi dei nodi
x-i18n:
    generated_at: "2026-04-05T13:57:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2e431e6a35c482a655e01460bef9fab5d5a5ae7dc46f8f992ee51100f5c937e
    source_path: nodes/troubleshooting.md
    workflow: 15
---

# Risoluzione dei problemi dei nodi

Usa questa pagina quando un nodo è visibile nello stato ma gli strumenti del nodo falliscono.

## Sequenza di comandi

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Poi esegui i controlli specifici del nodo:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Segnali di corretto funzionamento:

- Il nodo è connesso e associato per il ruolo `node`.
- `nodes describe` include la capability che stai chiamando.
- Le approvazioni exec mostrano la modalità/allowlist prevista.

## Requisiti di primo piano

`canvas.*`, `camera.*` e `screen.*` funzionano solo in primo piano sui nodi iOS/Android.

Controllo e correzione rapidi:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Se vedi `NODE_BACKGROUND_UNAVAILABLE`, porta l'app del nodo in primo piano e riprova.

## Matrice dei permessi

| Capability                   | iOS                                     | Android                                      | app nodo macOS                | Codice di errore tipico        |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Fotocamera (+ microfono per audio clip) | Fotocamera (+ microfono per audio clip)      | Fotocamera (+ microfono per audio clip) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Registrazione schermo (+ microfono facoltativo) | Prompt di cattura schermo (+ microfono facoltativo) | Registrazione schermo         | `*_PERMISSION_REQUIRED`        |
| `location.get`               | Durante l'uso o Sempre (dipende dalla modalità) | Posizione in primo piano/sfondo in base alla modalità | Permesso posizione            | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/d (percorso host del nodo)            | n/d (percorso host del nodo)                 | Approvazioni exec richieste   | `SYSTEM_RUN_DENIED`            |

## Pairing versus approvazioni

Questi sono gate diversi:

1. **Pairing del dispositivo**: questo nodo può connettersi al gateway?
2. **Policy dei comandi nodo del gateway**: l'ID comando RPC è consentito da `gateway.nodes.allowCommands` / `denyCommands` e dai valori predefiniti della piattaforma?
3. **Approvazioni exec**: questo nodo può eseguire localmente uno specifico comando shell?

Controlli rapidi:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Se manca il pairing, approva prima il dispositivo del nodo.
Se in `nodes describe` manca un comando, controlla la policy dei comandi nodo del gateway e se il nodo ha effettivamente dichiarato quel comando alla connessione.
Se il pairing è corretto ma `system.run` fallisce, correggi le approvazioni exec/l'allowlist su quel nodo.

Il pairing del nodo è un gate di identità/fiducia, non una superficie di approvazione per singolo comando. Per `system.run`, la policy per nodo si trova nel file delle approvazioni exec di quel nodo (`openclaw approvals get --node ...`), non nel record di pairing del gateway.

Per le esecuzioni `host=node` supportate da approvazione, il gateway vincola inoltre l'esecuzione al `systemRunPlan` canonico preparato. Se un chiamante successivo modifica comando/cwd o metadati della sessione prima che l'esecuzione approvata venga inoltrata, il gateway rifiuta l'esecuzione come mancata corrispondenza dell'approvazione invece di fidarsi del payload modificato.

## Codici di errore comuni dei nodi

- `NODE_BACKGROUND_UNAVAILABLE` → l'app è in background; portala in primo piano.
- `CAMERA_DISABLED` → interruttore fotocamera disabilitato nelle impostazioni del nodo.
- `*_PERMISSION_REQUIRED` → permesso del sistema operativo mancante/negato.
- `LOCATION_DISABLED` → la modalità posizione è disattivata.
- `LOCATION_PERMISSION_REQUIRED` → la modalità posizione richiesta non è stata concessa.
- `LOCATION_BACKGROUND_UNAVAILABLE` → l'app è in background ma esiste solo il permesso Durante l'uso.
- `SYSTEM_RUN_DENIED: approval required` → la richiesta exec richiede approvazione esplicita.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloccato dalla modalità allowlist.
  Sugli host nodo Windows, le forme wrapper della shell come `cmd.exe /c ...` sono trattate come mancate corrispondenze dell'allowlist in
  modalità allowlist, a meno che non vengano approvate tramite il flusso ask.

## Ciclo di recupero rapido

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Se sei ancora bloccato:

- Riapprova il pairing del dispositivo.
- Riapri l'app del nodo (in primo piano).
- Concedi di nuovo i permessi del sistema operativo.
- Ricrea/regola la policy di approvazione exec.

Correlati:

- [/nodes/index](/nodes/index)
- [/nodes/camera](/nodes/camera)
- [/nodes/location-command](/nodes/location-command)
- [/tools/exec-approvals](/tools/exec-approvals)
- [/gateway/pairing](/gateway/pairing)
