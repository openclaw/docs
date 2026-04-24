---
read_when:
    - Stai gestendo Node associati (camera, screen, canvas)
    - Devi approvare richieste o invocare comandi del Node
summary: Riferimento CLI per `openclaw nodes` (status, pairing, invoke, camera/canvas/screen)
title: Node
x-i18n:
    generated_at: "2026-04-24T08:34:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f1b440b3113b71338ae9cab5e1ded607dba79b9429f5c0b1b5f9e758b9f73e
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Gestisci i Node associati (dispositivi) e richiama le capacità del Node.

Correlati:

- Panoramica dei Node: [Node](/it/nodes)
- Camera: [Node fotocamera](/it/nodes/camera)
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
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` stampa le tabelle in attesa/associati. Le righe associate includono il tempo trascorso dall'ultima connessione più recente (Last Connect).
Usa `--connected` per mostrare solo i Node attualmente connessi. Usa `--last-connected <duration>` per
filtrare i Node che si sono connessi entro una durata (ad esempio `24h`, `7d`).

Nota sull'approvazione:

- `openclaw nodes pending` richiede solo l'ambito pairing.
- `openclaw nodes approve <requestId>` eredita requisiti di ambito aggiuntivi dalla
  richiesta in attesa:
  - richiesta senza comando: solo pairing
  - comandi Node non-exec: pairing + write
  - `system.run` / `system.run.prepare` / `system.which`: pairing + admin

## Invoke

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flag di invoke:

- `--params <json>`: stringa oggetto JSON (predefinito `{}`).
- `--invoke-timeout <ms>`: timeout di invocazione del Node (predefinito `15000`).
- `--idempotency-key <key>`: chiave di idempotenza facoltativa.
- `system.run` e `system.run.prepare` sono bloccati qui; usa lo strumento `exec` con `host=node` per l'esecuzione della shell.

Per l'esecuzione della shell su un Node, usa lo strumento `exec` con `host=node` invece di `openclaw nodes run`.
La CLI `nodes` è ora focalizzata sulle capacità: RPC diretto tramite `nodes invoke`, più pairing, camera,
schermo, posizione, canvas e notifiche.

## Correlati

- [Riferimento CLI](/it/cli)
- [Node](/it/nodes)
