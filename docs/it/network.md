---
read_when:
    - Ti serve la panoramica dell'architettura di rete e della sicurezza
    - Stai eseguendo il debug dell'accesso locale rispetto a quello tramite tailnet o dell'associazione
    - Vuoi l'elenco canonico della documentazione di rete
summary: 'Hub di rete: interfacce del Gateway, associazione, rilevamento e sicurezza'
title: Rete
x-i18n:
    generated_at: "2026-07-12T07:12:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

Questo hub raccoglie i collegamenti alla documentazione principale su come OpenClaw connette, associa e protegge
i dispositivi su localhost, LAN e tailnet.

## Modello principale

La maggior parte delle operazioni passa attraverso il Gateway (`openclaw gateway`), un singolo processo a esecuzione prolungata che gestisce le connessioni ai canali e il piano di controllo WebSocket.

- **Prima local loopback**: per impostazione predefinita, il WS del Gateway usa `ws://127.0.0.1:18789`.
  I binding non local loopback rifiutano di avviarsi senza un percorso di autenticazione del Gateway valido:
  autenticazione mediante token/password con segreto condiviso oppure una distribuzione
  `trusted-proxy` non local loopback configurata correttamente.
- **È consigliato un Gateway per host**. Per l'isolamento, esegui più Gateway con profili e porte isolati ([Gateway multipli](/it/gateway/multiple-gateways)).
- **L'host Canvas** viene servito sulla stessa porta del Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`) ed è protetto dall'autenticazione del Gateway quando il binding non è limitato a local loopback.
- **L'accesso remoto** avviene in genere tramite un tunnel SSH o una VPN Tailscale ([Accesso remoto](/it/gateway/remote)).

Riferimenti principali:

- [Architettura del Gateway](/it/concepts/architecture)
- [Protocollo del Gateway](/it/gateway/protocol)
- [Guida operativa del Gateway](/it/gateway)
- [Superfici web e modalità di binding](/it/web)

## Associazione e identità

- [Panoramica dell'associazione (DM e nodi)](/it/channels/pairing)
- [Associazione dei nodi gestita dal Gateway](/it/gateway/pairing)
- [CLI dei dispositivi (associazione e rotazione dei token)](/it/cli/devices)
- [CLI di associazione (approvazioni dei DM)](/it/cli/pairing)

Attendibilità locale:

- Le connessioni dirette tramite local loopback (senza intestazioni inoltrate/proxy) possono essere
  approvate automaticamente per l'associazione, così da mantenere fluida l'esperienza utente sullo stesso host.
- OpenClaw dispone inoltre di un percorso ristretto di auto-connessione locale al backend/container per
  i flussi di helper attendibili basati su segreto condiviso.
- I client tailnet e LAN, inclusi i binding tailnet sullo stesso host, richiedono comunque
  un'approvazione esplicita dell'associazione.

## Rilevamento e trasporti

- [Rilevamento e trasporti](/it/gateway/discovery)
- [Bonjour / mDNS](/it/gateway/bonjour)
- [Accesso remoto (SSH)](/it/gateway/remote)
- [Tailscale](/it/gateway/tailscale)

## Nodi e trasporti

- [Panoramica dei nodi](/it/nodes)
- [Protocollo bridge (nodi legacy, storico)](/it/gateway/bridge-protocol)
- [Guida operativa del nodo: iOS](/it/platforms/ios)
- [Guida operativa del nodo: Android](/it/platforms/android)

## Sicurezza

- [Panoramica della sicurezza](/it/gateway/security)
- [Riferimento per la configurazione del Gateway](/it/gateway/configuration)
- [Risoluzione dei problemi](/it/gateway/troubleshooting)
- [Doctor](/it/gateway/doctor)

## Contenuti correlati

- [Guida operativa del Gateway](/it/gateway)
- [Accesso remoto](/it/gateway/remote)
