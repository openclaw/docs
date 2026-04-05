---
read_when:
    - Stai gestendo nodi associati (fotocamere, schermo, canvas)
    - Devi approvare richieste o invocare comandi del nodo
summary: Riferimento CLI per `openclaw nodes` (stato, pairing, invoke, camera/canvas/schermo)
title: nodes
x-i18n:
    generated_at: "2026-04-05T13:48:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ce3095591c4623ad18e3eca8d8083e5c10266fbf94afea2d025f0ba8093a175
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Gestisci i nodi associati (dispositivi) e invoca le capacità dei nodi.

Correlati:

- Panoramica dei nodi: [Nodes](/nodes)
- Fotocamera: [Camera nodes](/nodes/camera)
- Immagini: [Image nodes](/nodes/images)

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
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` stampa tabelle di elementi in sospeso/associati. Le righe associate includono il tempo trascorso dall'ultima connessione (Last Connect).
Usa `--connected` per mostrare solo i nodi attualmente connessi. Usa `--last-connected <duration>` per
filtrare i nodi che si sono connessi entro una durata specifica (ad esempio `24h`, `7d`).

Nota sull'approvazione:

- `openclaw nodes pending` richiede solo l'ambito di pairing.
- `openclaw nodes approve <requestId>` eredita requisiti di ambito aggiuntivi dalla
  richiesta in sospeso:
  - richiesta senza comandi: solo pairing
  - comandi del nodo non exec: pairing + write
  - `system.run` / `system.run.prepare` / `system.which`: pairing + admin

## Invoke

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flag di invoke:

- `--params <json>`: stringa oggetto JSON (predefinito `{}`).
- `--invoke-timeout <ms>`: timeout di invocazione del nodo (predefinito `15000`).
- `--idempotency-key <key>`: chiave di idempotenza facoltativa.
- `system.run` e `system.run.prepare` sono bloccati qui; usa lo strumento `exec` con `host=node` per l'esecuzione shell.

Per l'esecuzione shell su un nodo, usa lo strumento `exec` con `host=node` invece di `openclaw nodes run`.
La CLI `nodes` ora è focalizzata sulle capacità: RPC diretto tramite `nodes invoke`, più pairing, fotocamera,
schermo, posizione, canvas e notifiche.
