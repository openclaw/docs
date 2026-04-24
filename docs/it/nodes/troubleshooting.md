---
read_when:
    - Il Node è connesso ma gli strumenti camera/canvas/screen/exec falliscono
    - Ti serve il modello mentale pairing dei Node vs approvazioni
summary: Risoluzione dei problemi di pairing dei Node, requisiti di esecuzione in primo piano, permessi e guasti degli strumenti
title: Risoluzione dei problemi dei Node
x-i18n:
    generated_at: "2026-04-24T08:48:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59c7367d02945e972094b47832164d95573a2aab1122e8ccf6feb80bcfcd95be
    source_path: nodes/troubleshooting.md
    workflow: 15
---

Usa questa pagina quando un Node è visibile nello stato ma gli strumenti del Node falliscono.

## Sequenza di comandi

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Poi esegui controlli specifici del Node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Segnali di stato integro:

- Il Node è connesso e associato per il ruolo `node`.
- `nodes describe` include la capability che stai chiamando.
- Le approvazioni exec mostrano la modalità/lista di autorizzazione previste.

## Requisiti di foreground

`canvas.*`, `camera.*` e `screen.*` funzionano solo in foreground sui Node iOS/Android.

Controllo e correzione rapidi:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Se vedi `NODE_BACKGROUND_UNAVAILABLE`, porta l'app del Node in foreground e riprova.

## Matrice dei permessi

| Capability                   | iOS                                     | Android                                      | app Node macOS                | Codice di errore tipico        |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Fotocamera (+ microfono per audio clip) | Fotocamera (+ microfono per audio clip)      | Fotocamera (+ microfono per audio clip) | `*_PERMISSION_REQUIRED` |
| `screen.record`              | Registrazione schermo (+ microfono facoltativo) | Prompt cattura schermo (+ microfono facoltativo) | Registrazione schermo | `*_PERMISSION_REQUIRED` |
| `location.get`               | During Using oppure Always (dipende dalla modalità) | Posizione foreground/background in base alla modalità | Permesso posizione | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a (percorso host Node)                | n/a (percorso host Node)                     | Richiede approvazioni exec    | `SYSTEM_RUN_DENIED`            |

## Pairing vs approvazioni

Queste sono barriere diverse:

1. **Pairing del dispositivo**: questo Node può connettersi al gateway?
2. **Policy dei comandi Node del Gateway**: l'ID comando RPC è consentito da `gateway.nodes.allowCommands` / `denyCommands` e dai valori predefiniti della piattaforma?
3. **Approvazioni exec**: questo Node può eseguire uno specifico comando shell in locale?

Controlli rapidi:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Se il pairing manca, approva prima il dispositivo Node.
Se `nodes describe` non include un comando, controlla la policy dei comandi Node del gateway e se il Node ha effettivamente dichiarato quel comando alla connessione.
Se il pairing è corretto ma `system.run` fallisce, correggi le approvazioni exec/allowlist su quel Node.

Il pairing del Node è una barriera di identità/fiducia, non una superficie di approvazione per comando. Per `system.run`, la policy per Node risiede nel file di approvazioni exec di quel Node (`openclaw approvals get --node ...`), non nel record di pairing del gateway.

Per le esecuzioni `host=node` supportate da approvazione, il gateway lega anche l'esecuzione al
`systemRunPlan` canonico preparato. Se un chiamante successivo modifica comando/cwd o
metadati della sessione prima che l'esecuzione approvata venga inoltrata, il gateway rifiuta l'esecuzione
come mancata corrispondenza dell'approvazione invece di fidarsi del payload modificato.

## Codici di errore comuni del Node

- `NODE_BACKGROUND_UNAVAILABLE` → l'app è in background; portala in foreground.
- `CAMERA_DISABLED` → toggle della fotocamera disabilitato nelle impostazioni del Node.
- `*_PERMISSION_REQUIRED` → permesso OS mancante/negato.
- `LOCATION_DISABLED` → la modalità posizione è disattivata.
- `LOCATION_PERMISSION_REQUIRED` → la modalità posizione richiesta non è concessa.
- `LOCATION_BACKGROUND_UNAVAILABLE` → l'app è in background ma esiste solo il permesso While Using.
- `SYSTEM_RUN_DENIED: approval required` → la richiesta exec necessita di approvazione esplicita.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloccato dalla modalità allowlist.
  Sugli host Node Windows, forme con shell-wrapper come `cmd.exe /c ...` vengono trattate come allowlist miss in
  modalità allowlist, a meno che non siano approvate tramite il flusso ask.

## Ciclo rapido di recupero

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Se sei ancora bloccato:

- Riapprova il pairing del dispositivo.
- Riapri l'app del Node (foreground).
- Riconcedi i permessi del sistema operativo.
- Ricrea/regola la policy di approvazione exec.

Correlati:

- [/nodes/index](/it/nodes/index)
- [/nodes/camera](/it/nodes/camera)
- [/nodes/location-command](/it/nodes/location-command)
- [/tools/exec-approvals](/it/tools/exec-approvals)
- [/gateway/pairing](/it/gateway/pairing)

## Correlati

- [Panoramica dei Node](/it/nodes)
- [Gateway troubleshooting](/it/gateway/troubleshooting)
- [Channel troubleshooting](/it/channels/troubleshooting)
