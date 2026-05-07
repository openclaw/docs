---
read_when:
    - Stai gestendo nodi associati (fotocamere, schermo, canvas)
    - Devi approvare le richieste o invocare comandi Node
summary: Riferimento CLI per `openclaw nodes` (status, pairing, invoke, camera/canvas/screen)
title: Node
x-i18n:
    generated_at: "2026-05-07T13:14:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 681c199462d5f58c3e4346713263a78e7513335f087c713877e3050e21c8e15f
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Gestisci i Node associati (dispositivi) e invoca le capacità dei Node.

Correlati:

- Panoramica dei Node: [Node](/it/nodes)
- Fotocamera: [Node fotocamera](/it/nodes/camera)
- Immagini: [Node immagine](/it/nodes/images)

Opzioni comuni:

- `--url`, `--token`, `--timeout`, `--json`

## Comandi comuni

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` stampa le tabelle delle richieste in sospeso e delle associazioni. Le righe associate includono l'età della connessione più recente (Ultima connessione).
Usa `--connected` per mostrare solo i Node attualmente connessi. Usa `--last-connected <duration>` per
filtrare i Node che si sono connessi entro una durata (ad es. `24h`, `7d`).
Usa `nodes remove --node <id|name|ip>` per eliminare un record obsoleto di associazione di Node di proprietà del Gateway.

Nota sull'approvazione:

- `openclaw nodes pending` richiede solo l'ambito di associazione.
- `gateway.nodes.pairing.autoApproveCidrs` può saltare il passaggio in sospeso solo per
  l'associazione di dispositivi `role: node` esplicitamente attendibili e al primo utilizzo. È disattivato per
  impostazione predefinita e non approva gli upgrade.
- `openclaw nodes approve <requestId>` eredita requisiti di ambito aggiuntivi dalla
  richiesta in sospeso:
  - richiesta senza comando: solo associazione
  - comandi Node non exec: associazione + scrittura
  - `system.run` / `system.run.prepare` / `system.which`: associazione + admin

## Invocazione

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flag di invocazione:

- `--params <json>`: stringa di oggetto JSON (predefinito `{}`).
- `--invoke-timeout <ms>`: timeout di invocazione del Node (predefinito `15000`).
- `--idempotency-key <key>`: chiave di idempotenza opzionale.
- `system.run` e `system.run.prepare` sono bloccati qui; usa lo strumento `exec` con `host=node` per l'esecuzione della shell.

Per l'esecuzione della shell su un Node, usa lo strumento `exec` con `host=node` invece di `openclaw nodes run`.
La CLI `nodes` ora è incentrata sulle capacità: RPC diretto tramite `nodes invoke`, oltre ad associazione, fotocamera,
schermo, posizione, Canvas e notifiche. I comandi Canvas sono implementati dal Plugin Canvas sperimentale in bundle; il core mantiene un hook di compatibilità in modo che rimangano sotto `openclaw nodes canvas`.

## Correlati

- [Riferimento CLI](/it/cli)
- [Node](/it/nodes)
