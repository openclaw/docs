---
read_when:
    - Ti serve la panoramica sull'architettura di rete e sulla sicurezza
    - Stai eseguendo il debug dell'accesso locale rispetto alla tailnet o dell'associazione
    - Vuoi l'elenco canonico della documentazione di rete
summary: 'Hub di rete: superfici del Gateway, abbinamento, rilevamento e sicurezza'
title: Rete
x-i18n:
    generated_at: "2026-05-06T08:57:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0ff6c4ee46005aeac1612ea40f1ce3d5824aa507d0842788dbf4bffbaccfcc
    source_path: network.md
    workflow: 16
---

Questo hub collega la documentazione principale su come OpenClaw connette, associa e protegge
i dispositivi tra localhost, LAN e tailnet.

## Modello principale

La maggior parte delle operazioni passa attraverso il Gateway (`openclaw gateway`), un singolo processo di lunga durata che gestisce le connessioni dei canali e il piano di controllo WebSocket.

- **Prima il loopback**: il WS del Gateway usa come valore predefinito `ws://127.0.0.1:18789`.
  I bind non-loopback richiedono un percorso valido di autenticazione del gateway: autenticazione
  con token/password a segreto condiviso, oppure una distribuzione `trusted-proxy`
  non-loopback configurata correttamente.
- **Un Gateway per host** è consigliato. Per l'isolamento, esegui più gateway con profili e porte isolati ([Gateway multipli](/it/gateway/multiple-gateways)).
- **Host canvas** viene servito sulla stessa porta del Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), protetto dall'autenticazione del Gateway quando è associato oltre il loopback.
- **Accesso remoto** è in genere un tunnel SSH o una VPN Tailscale ([Accesso remoto](/it/gateway/remote)).

Riferimenti principali:

- [Architettura del Gateway](/it/concepts/architecture)
- [Protocollo del Gateway](/it/gateway/protocol)
- [Runbook del Gateway](/it/gateway)
- [Superfici web + modalità di bind](/it/web)

## Associazione + identità

- [Panoramica dell'associazione (DM + nodi)](/it/channels/pairing)
- [Associazione dei nodi gestita dal Gateway](/it/gateway/pairing)
- [CLI dei dispositivi (associazione + rotazione dei token)](/it/cli/devices)
- [CLI di associazione (approvazioni DM)](/it/cli/pairing)

Attendibilità locale:

- Le connessioni dirette tramite local loopback possono essere approvate automaticamente per l'associazione, così da mantenere fluida l'esperienza sullo stesso host.
- OpenClaw ha anche un percorso ristretto di auto-connessione backend/container-locale per flussi helper attendibili a segreto condiviso.
- I client tailnet e LAN, inclusi i bind tailnet sullo stesso host, richiedono comunque
  un'approvazione esplicita dell'associazione.

## Rilevamento + trasporti

- [Rilevamento e trasporti](/it/gateway/discovery)
- [Bonjour / mDNS](/it/gateway/bonjour)
- [Accesso remoto (SSH)](/it/gateway/remote)
- [Tailscale](/it/gateway/tailscale)

## Nodi + trasporti

- [Panoramica dei nodi](/it/nodes)
- [Protocollo bridge (nodi legacy, storico)](/it/gateway/bridge-protocol)
- [Runbook dei nodi: iOS](/it/platforms/ios)
- [Runbook dei nodi: Android](/it/platforms/android)

## Sicurezza

- [Panoramica della sicurezza](/it/gateway/security)
- [Riferimento alla configurazione del Gateway](/it/gateway/configuration)
- [Risoluzione dei problemi](/it/gateway/troubleshooting)
- [Doctor](/it/gateway/doctor)

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Accesso remoto](/it/gateway/remote)
