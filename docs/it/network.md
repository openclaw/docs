---
read_when:
    - Hai bisogno della panoramica su architettura di rete + sicurezza
    - Stai eseguendo il debug di accesso o pairing locale vs tailnet
    - Vuoi l'elenco canonico della documentazione di rete
summary: 'Hub di rete: superfici del gateway, pairing, discovery e sicurezza'
title: Rete
x-i18n:
    generated_at: "2026-04-05T13:57:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a5f39d4f40ad19646d372000c85b663770eae412af91e1c175eb27b22208118
    source_path: network.md
    workflow: 15
---

# Hub di rete

Questo hub collega la documentazione principale su come OpenClaw connette, associa e protegge
i dispositivi tra localhost, LAN e tailnet.

## Modello principale

La maggior parte delle operazioni passa attraverso il Gateway (`openclaw gateway`), un singolo processo a lunga esecuzione che possiede le connessioni ai canali e il control plane WebSocket.

- **Prima il loopback**: il WS del Gateway usa per impostazione predefinita `ws://127.0.0.1:18789`.
  I bind non loopback richiedono un percorso di autenticazione gateway valido: autenticazione con segreto condiviso
  tramite token/password, oppure un deployment
  `trusted-proxy` non loopback configurato correttamente.
- **Un Gateway per host** è consigliato. Per isolamento, esegui più gateway con profili e porte isolati ([Gateway multipli](/gateway/multiple-gateways)).
- **L'host Canvas** viene servito sulla stessa porta del Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), protetto dall'autenticazione del Gateway quando il bind va oltre il loopback.
- **L'accesso remoto** avviene tipicamente tramite tunnel SSH o VPN Tailscale ([Accesso remoto](/gateway/remote)).

Riferimenti chiave:

- [Architettura del Gateway](/concepts/architecture)
- [Protocollo del Gateway](/gateway/protocol)
- [Runbook del Gateway](/gateway)
- [Superfici Web + modalità bind](/web)

## Pairing + identità

- [Panoramica pairing (DM + nodi)](/it/channels/pairing)
- [Pairing dei nodi gestito dal Gateway](/gateway/pairing)
- [CLI Devices (pairing + rotazione token)](/cli/devices)
- [CLI Pairing (approvazioni DM)](/cli/pairing)

Affidabilità locale:

- Le connessioni loopback locali dirette possono essere approvate automaticamente per il pairing per mantenere fluida l'esperienza sullo stesso host.
- OpenClaw ha anche un percorso ristretto backend/container-local self-connect per flussi helper attendibili con segreto condiviso.
- I client tailnet e LAN, inclusi i bind tailnet sullo stesso host, richiedono comunque
  un'approvazione esplicita del pairing.

## Discovery + transport

- [Discovery e transport](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [Accesso remoto (SSH)](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## Nodi + transport

- [Panoramica nodi](/nodes)
- [Protocollo bridge (nodi legacy, storico)](/gateway/bridge-protocol)
- [Runbook nodo: iOS](/platforms/ios)
- [Runbook nodo: Android](/platforms/android)

## Sicurezza

- [Panoramica sicurezza](/gateway/security)
- [Riferimento configurazione del Gateway](/gateway/configuration)
- [Risoluzione dei problemi](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)
