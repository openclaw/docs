---
read_when:
    - Stai gestendo nodi associati (telecamere, schermo, area di disegno)
    - È necessario approvare le richieste o invocare comandi node
summary: Riferimento CLI per `openclaw nodes` (status, pairing, invoke, camera/canvas/screen)
title: Nodi
x-i18n:
    generated_at: "2026-05-06T17:54:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3eb0d23037c939e4022115a2d65e0e9cb25a872daed715b8652979ce6707cf7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Gestisci i node associati (dispositivi) e invoca le capacità dei node.

Correlati:

- Panoramica dei Node: [Node](/it/nodes)
- Fotocamera: [Node fotocamera](/it/nodes/camera)
- Immagini: [Node immagini](/it/nodes/images)

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

`nodes list` stampa tabelle delle richieste in sospeso e dei dispositivi associati. Le righe associate includono l'età della connessione più recente (Ultima connessione).
Usa `--connected` per mostrare solo i node attualmente connessi. Usa `--last-connected <duration>` per
filtrare i node che si sono connessi entro una durata (ad esempio `24h`, `7d`).
Usa `nodes remove --node <id|name|ip>` per eliminare un record di associazione di node obsoleto di proprietà del gateway.

Nota sull'approvazione:

- `openclaw nodes pending` richiede solo l'ambito di associazione.
- `gateway.nodes.pairing.autoApproveCidrs` può saltare il passaggio in sospeso solo per
  l'associazione esplicitamente attendibile e iniziale di un dispositivo `role: node`. È disattivato per
  impostazione predefinita e non approva gli aggiornamenti.
- `openclaw nodes approve <requestId>` eredita requisiti di ambito aggiuntivi dalla
  richiesta in sospeso:
  - richiesta senza comando: solo associazione
  - comandi node non exec: associazione + scrittura
  - `system.run` / `system.run.prepare` / `system.which`: associazione + admin

## Invocazione

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flag di invocazione:

- `--params <json>`: stringa oggetto JSON (predefinito `{}`).
- `--invoke-timeout <ms>`: timeout di invocazione del node (predefinito `15000`).
- `--idempotency-key <key>`: chiave di idempotenza facoltativa.
- `system.run` e `system.run.prepare` sono bloccati qui; usa lo strumento `exec` con `host=node` per l'esecuzione della shell.

Per l'esecuzione della shell su un node, usa lo strumento `exec` con `host=node` invece di `openclaw nodes run`.
La CLI `nodes` ora è focalizzata sulle capacità: RPC diretto tramite `nodes invoke`, più associazione, fotocamera,
schermo, posizione, canvas e notifiche.

## Correlati

- [Riferimento CLI](/it/cli)
- [Node](/it/nodes)
