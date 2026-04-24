---
read_when:
    - Hai bisogno di una panoramica dell'architettura di rete e della sicurezza
    - Stai eseguendo il debug dell'accesso locale vs tailnet o del pairing
    - Vuoi l'elenco canonico della documentazione di rete
summary: 'Hub di rete: superfici del gateway, pairing, discovery e sicurezza'
title: Rete
x-i18n:
    generated_at: "2026-04-24T08:48:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 663f372555f044146a5d381566371e9a38185e7f295243bfd61314f12e3a4f06
    source_path: network.md
    workflow: 15
---

# Hub di rete

Questo hub collega la documentazione principale su come OpenClaw connette, associa e protegge
i dispositivi tra localhost, LAN e tailnet.

## Modello principale

La maggior parte delle operazioni passa attraverso il Gateway (`openclaw gateway`), un singolo processo a lunga esecuzione che possiede le connessioni ai canali e il piano di controllo WebSocket.

- **Loopback first**: il WS del Gateway usa per impostazione predefinita `ws://127.0.0.1:18789`.
  I bind non-loopback richiedono un percorso di autenticazione del gateway valido: autenticazione a segreto condiviso
  con token/password, oppure un deployment `trusted-proxy`
  non-loopback correttamente configurato.
- **Un Gateway per host** è consigliato. Per l'isolamento, esegui più gateway con profili e porte isolati ([Più Gateway](/it/gateway/multiple-gateways)).
- **Canvas host** viene servito sulla stessa porta del Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), protetto dall'autenticazione del Gateway quando è associato oltre il loopback.
- **L'accesso remoto** è tipicamente tramite tunnel SSH o VPN Tailscale ([Accesso remoto](/it/gateway/remote)).

Riferimenti chiave:

- [Architettura del Gateway](/it/concepts/architecture)
- [Protocollo del Gateway](/it/gateway/protocol)
- [Runbook del Gateway](/it/gateway)
- [Superfici web + modalità bind](/it/web)

## Pairing + identità

- [Panoramica del pairing (DM + Node)](/it/channels/pairing)
- [Pairing dei Node di proprietà del Gateway](/it/gateway/pairing)
- [CLI devices (pairing + rotazione del token)](/it/cli/devices)
- [CLI pairing (approvazioni DM)](/it/cli/pairing)

Attendibilità locale:

- Le connessioni loopback locali dirette possono essere approvate automaticamente per il pairing, in modo da mantenere fluida l'esperienza UX sullo stesso host.
- OpenClaw ha anche un percorso ristretto di auto-connessione backend/container-locale per flussi helper attendibili con segreto condiviso.
- I client tailnet e LAN, inclusi i bind tailnet sullo stesso host, richiedono comunque
  approvazione esplicita del pairing.

## Discovery + trasporti

- [Discovery e trasporti](/it/gateway/discovery)
- [Bonjour / mDNS](/it/gateway/bonjour)
- [Accesso remoto (SSH)](/it/gateway/remote)
- [Tailscale](/it/gateway/tailscale)

## Node + trasporti

- [Panoramica dei Node](/it/nodes)
- [Protocollo Bridge (Node legacy, storico)](/it/gateway/bridge-protocol)
- [Runbook Node: iOS](/it/platforms/ios)
- [Runbook Node: Android](/it/platforms/android)

## Sicurezza

- [Panoramica della sicurezza](/it/gateway/security)
- [Riferimento della configurazione del Gateway](/it/gateway/configuration)
- [Risoluzione dei problemi](/it/gateway/troubleshooting)
- [Doctor](/it/gateway/doctor)

## Correlati

- [Modello di rete del Gateway](/it/gateway/network-model)
- [Accesso remoto](/it/gateway/remote)
