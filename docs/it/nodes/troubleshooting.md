---
read_when:
    - Il Node è connesso, ma gli strumenti fotocamera/canvas/schermo/exec non funzionano
    - Ti serve un modello mentale della distinzione tra associazione dei Node e approvazioni
summary: Risoluzione dei problemi relativi all'associazione dei Node, ai requisiti di esecuzione in primo piano, alle autorizzazioni e agli errori degli strumenti
title: Risoluzione dei problemi di Node
x-i18n:
    generated_at: "2026-07-12T07:13:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53d082dcd2f4bb022eb683d72d193dbb6800b5a81a8f5ab9506d82feaa0dbc49
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Usa questa pagina quando un Node è visibile nello stato, ma gli strumenti del Node non funzionano.

## Sequenza di comandi

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Quindi esegui i controlli specifici del Node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Segnali di funzionamento corretto:

- Il Node è connesso e associato per il ruolo `node`.
- `nodes describe` include la funzionalità che stai richiamando.
- Le approvazioni di esecuzione mostrano la modalità e l'elenco consentito previsti.

## Requisiti per l'esecuzione in primo piano

`canvas.*`, `camera.*` e `screen.*` funzionano solo in primo piano sui Node iOS/Android.

Controllo e correzione rapidi:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Se viene visualizzato `NODE_BACKGROUND_UNAVAILABLE`, porta l'app del Node in primo piano e riprova.

## Matrice delle autorizzazioni

| Funzionalità                 | iOS                                                        | Android                                                        | App Node per macOS                                  | Codice di errore tipico                        |
| ---------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------- |
| `camera.snap`, `camera.clip` | Fotocamera (+ microfono per l'audio della clip)             | Fotocamera (+ microfono per l'audio della clip)                 | Fotocamera (+ microfono per l'audio della clip)      | `*_PERMISSION_REQUIRED`                        |
| `screen.record`              | Registrazione schermo (+ microfono facoltativo)             | Richiesta di acquisizione schermo (+ microfono facoltativo)     | Registrazione schermo                               | `*_PERMISSION_REQUIRED`                        |
| `computer.act`               | non disponibile                                            | non disponibile                                                | Accessibilità + Registrazione schermo                | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED`  |
| `location.get`               | Durante l'uso o Sempre (dipende dalla modalità)             | Posizione in primo piano/in background in base alla modalità    | Autorizzazione per la posizione                      | `LOCATION_PERMISSION_REQUIRED`                 |
| `system.run`                 | non disponibile (percorso dell'host del Node)               | non disponibile (percorso dell'host del Node)                   | Approvazioni di esecuzione obbligatorie              | `SYSTEM_RUN_DENIED`                            |

## Associazione e approvazioni

Tre controlli distinti determinano se un comando del Node viene eseguito correttamente:

1. **Associazione del dispositivo**: questo Node può connettersi al Gateway?
2. **Criterio dei comandi Node del Gateway**: l'ID del comando RPC è consentito da `gateway.nodes.allowCommands` / `denyCommands` e dalle impostazioni predefinite della piattaforma?
3. **Approvazioni di esecuzione**: questo Node può eseguire localmente uno specifico comando shell?

L'associazione del Node è un controllo di identità e attendibilità, non un sistema di approvazione per singolo comando. Per `system.run`, il criterio specifico del Node si trova nel file delle approvazioni di esecuzione del Node (`openclaw approvals get --node ...`), non nel record di associazione del Gateway.

Controlli rapidi:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- Associazione mancante: approva prima il dispositivo Node.
- Comando mancante in `nodes describe`: controlla il criterio dei comandi Node del Gateway e verifica che il Node abbia effettivamente dichiarato quel comando durante la connessione.
- Associazione corretta ma `system.run` non riesce: correggi le approvazioni di esecuzione o l'elenco consentito su quel Node.

Per le esecuzioni `host=node` basate su approvazione, il Gateway vincola inoltre l'esecuzione al `systemRunPlan` canonico preparato. Se un chiamante successivo modifica il comando, la directory di lavoro o i metadati della sessione prima dell'inoltro dell'esecuzione approvata, il Gateway rifiuta l'esecuzione a causa di una mancata corrispondenza con l'approvazione, anziché considerare attendibile il payload modificato.

## Codici di errore comuni dei Node

| Codice                                 | Significato                                                                                                                                                                                                                                                                |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | L'app è in background; portala in primo piano.                                                                                                                                                                                                                              |
| `CAMERA_DISABLED`                      | L'interruttore della fotocamera è disattivato nelle impostazioni del Node.                                                                                                                                                                                                  |
| `*_PERMISSION_REQUIRED`                | L'autorizzazione del sistema operativo è mancante o negata.                                                                                                                                                                                                                 |
| `LOCATION_DISABLED`                    | La modalità di localizzazione è disattivata.                                                                                                                                                                                                                                |
| `LOCATION_PERMISSION_REQUIRED`         | La modalità di localizzazione richiesta non è stata concessa.                                                                                                                                                                                                               |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | L'app è in background, ma è disponibile solo l'autorizzazione Durante l'uso.                                                                                                                                                                                                |
| `COMPUTER_DISABLED`                    | Abilita **Allow Computer Control** nell'app per macOS, quindi approva l'aggiornamento dell'associazione.                                                                                                                                                                     |
| `ACCESSIBILITY_REQUIRED`               | Concedi l'autorizzazione Accessibilità al bundle corrente dell'app OpenClaw nelle Impostazioni di Sistema di macOS.                                                                                                                                                          |
| `SYSTEM_RUN_DENIED: approval required` | La richiesta di esecuzione richiede un'approvazione esplicita.                                                                                                                                                                                                              |
| `SYSTEM_RUN_DENIED: allowlist miss`    | Il comando è bloccato dalla modalità con elenco consentito. Sugli host Node Windows, le forme con wrapper della shell come `cmd.exe /c ...` sono considerate non presenti nell'elenco consentito in tale modalità, a meno che non vengano approvate tramite il flusso di richiesta. |

## Procedura rapida di ripristino

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Se il problema persiste:

- Approva nuovamente l'associazione del dispositivo.
- Riapri l'app del Node in primo piano.
- Concedi nuovamente le autorizzazioni del sistema operativo.
- Ricrea o modifica il criterio delle approvazioni di esecuzione.

Per il controllo del computer, verifica inoltre che un agente con funzionalità visive esponga lo strumento `computer`, che `screen.snapshot` venga eseguito correttamente con l'autorizzazione Registrazione schermo e che `/phone status` mostri l'autorizzazione temporanea o permanente del Gateway prevista. Una voce in `gateway.nodes.denyCommands` prevale sempre su `allowCommands`.

## Argomenti correlati

- [Panoramica dei Node](/it/nodes)
- [Node con fotocamera](/it/nodes/camera)
- [Comando per la posizione](/it/nodes/location-command)
- [Uso del computer](/it/nodes/computer-use)
- [Approvazioni di esecuzione](/it/tools/exec-approvals)
- [Associazione del Gateway](/it/gateway/pairing)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
