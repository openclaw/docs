---
read_when:
    - Stai gestendo nodi abbinati (telecamere, schermo, area di disegno)
    - Devi approvare le richieste o invocare comandi Node
summary: Riferimento CLI per `openclaw nodes` (stato, associazione, invoke, camera/canvas/screen)
title: Nodi
x-i18n:
    generated_at: "2026-06-27T17:20:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Gestisci i nodi (dispositivi) associati e invoca le capacità dei nodi.

Correlati:

- Panoramica dei nodi: [Nodi](/it/nodes)
- Fotocamera: [Nodi fotocamera](/it/nodes/camera)
- Immagini: [Nodi immagine](/it/nodes/images)

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

`nodes list` stampa tabelle dei nodi in sospeso/associati. Le righe associate includono l'età della connessione più recente (Ultima connessione).
Usa `--connected` per mostrare solo i nodi attualmente connessi. Usa `--last-connected <duration>` per
filtrare i nodi che si sono connessi entro una durata (ad es. `24h`, `7d`).
Usa `nodes remove --node <id|name|ip>` per rimuovere l'associazione di un nodo. Per un
nodo supportato da dispositivo, questo revoca il ruolo `node` del dispositivo in `devices/paired.json`
e disconnette le sue sessioni con ruolo di nodo (un dispositivo con ruoli misti mantiene la sua riga e
perde solo il ruolo `node`; un dispositivo solo nodo viene eliminato); cancella inoltre qualsiasi
record di associazione nodo legacy corrispondente di proprietà del gateway. `operator.pairing` può rimuovere
righe nodo non operatore; un chiamante con token dispositivo che revoca il proprio ruolo nodo su un
dispositivo con ruoli misti necessita inoltre di `operator.admin`.

Nota sull'approvazione:

- `openclaw nodes pending` richiede solo l'ambito di associazione.
- `gateway.nodes.pairing.autoApproveCidrs` può saltare il passaggio in sospeso solo per
  associazioni di dispositivi `role: node` esplicitamente attendibili e al primo utilizzo. È disattivato per
  impostazione predefinita e non approva gli upgrade.
- `openclaw nodes approve <requestId>` eredita requisiti di ambito aggiuntivi dalla
  richiesta in sospeso:
  - richiesta senza comando: solo associazione
  - comandi nodo non exec: associazione + scrittura
  - `system.run` / `system.run.prepare` / `system.which`: associazione + amministrazione

## Invocazione

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flag di invocazione:

- `--params <json>`: stringa oggetto JSON (predefinito `{}`).
- `--invoke-timeout <ms>`: timeout di invocazione del nodo (predefinito `15000`).
- `--idempotency-key <key>`: chiave di idempotenza facoltativa.
- `system.run` e `system.run.prepare` sono bloccati qui; usa lo strumento `exec` con `host=node` per l'esecuzione shell.

Per l'esecuzione shell su un nodo, usa lo strumento `exec` con `host=node` invece di `openclaw nodes run`.
La CLI `nodes` ora è focalizzata sulle capacità: RPC diretta tramite `nodes invoke`, più associazione, fotocamera,
schermo, posizione, Canvas e notifiche. I comandi Canvas sono implementati dal Plugin Canvas sperimentale incluso; il core mantiene un hook di compatibilità affinché rimangano sotto `openclaw nodes canvas`.

## Correlati

- [Riferimento CLI](/it/cli)
- [Nodi](/it/nodes)
