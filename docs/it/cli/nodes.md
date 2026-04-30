---
read_when:
    - Stai gestendo nodi associati (telecamere, schermo, canvas)
    - Devi approvare le richieste o invocare comandi Node
summary: Riferimento CLI per `openclaw nodes` (stato, abbinamento, invocazione, fotocamera/canvas/schermo)
title: Nodi
x-i18n:
    generated_at: "2026-04-30T08:44:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3229db91d7e64b0d37bee29bd51895d90796f5fd33b67e3d900fd8bda2b6e7e9
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Gestisci i Node associati (dispositivi) e invoca le funzionalità dei Node.

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

`nodes list` stampa tabelle di richieste in sospeso/associazioni. Le righe associate includono l'età della connessione più recente (Last Connect).
Usa `--connected` per mostrare solo i Node attualmente connessi. Usa `--last-connected <duration>` per
filtrare i Node che si sono connessi entro una durata (ad es. `24h`, `7d`).
Usa `nodes remove --node <id|name|ip>` per eliminare un record obsoleto di associazione di Node di proprietà del Gateway.

Nota sull'approvazione:

- `openclaw nodes pending` richiede solo l'ambito di associazione.
- `gateway.nodes.pairing.autoApproveCidrs` può saltare il passaggio in sospeso solo per
  associazioni di dispositivi `role: node` esplicitamente attendibili e alla prima configurazione. È disattivato per
  impostazione predefinita e non approva gli aggiornamenti.
- `openclaw nodes approve <requestId>` eredita requisiti di ambito aggiuntivi dalla
  richiesta in sospeso:
  - richiesta senza comando: solo associazione
  - comandi Node non exec: associazione + scrittura
  - `system.run` / `system.run.prepare` / `system.which`: associazione + amministrazione

## Invoca

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flag di invocazione:

- `--params <json>`: stringa oggetto JSON (predefinito `{}`).
- `--invoke-timeout <ms>`: timeout di invocazione Node (predefinito `15000`).
- `--idempotency-key <key>`: chiave di idempotenza opzionale.
- `system.run` e `system.run.prepare` sono bloccati qui; usa lo strumento `exec` con `host=node` per l'esecuzione della shell.

Per l'esecuzione della shell su un Node, usa lo strumento `exec` con `host=node` invece di `openclaw nodes run`.
La CLI `nodes` ora è incentrata sulle funzionalità: RPC diretta tramite `nodes invoke`, più associazione, fotocamera,
schermo, posizione, canvas e notifiche.

## Correlati

- [Riferimento CLI](/it/cli)
- [Node](/it/nodes)
