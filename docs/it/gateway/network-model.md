---
read_when:
    - Vuoi una vista concisa del modello di rete del Gateway
summary: Come si collegano il Gateway, i Node e l'host canvas.
title: Modello di rete
x-i18n:
    generated_at: "2026-04-24T08:41:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68637b72c4b3a6110556909da9a454e4be480fe2f3b42b09d054949c1104a62c
    source_path: gateway/network-model.md
    workflow: 15
---

> Questo contenuto è stato integrato in [Network](/it/network#core-model). Consulta quella pagina per la guida aggiornata.

La maggior parte delle operazioni passa attraverso il Gateway (`openclaw gateway`), un singolo
processo a lunga esecuzione che possiede le connessioni dei canali e il control plane WebSocket.

## Regole principali

- Si consiglia un solo Gateway per host. È l'unico processo autorizzato a possedere la sessione WhatsApp Web. Per bot di emergenza o isolamento rigoroso, esegui più gateway con profili e porte isolati. Vedi [Multiple gateways](/it/gateway/multiple-gateways).
- Prima il loopback: il WS del Gateway usa per impostazione predefinita `ws://127.0.0.1:18789`. La procedura guidata crea per impostazione predefinita l'autenticazione con segreto condiviso e di solito genera un token, anche per il loopback. Per accesso non-loopback, usa un percorso valido di autenticazione del gateway: autenticazione con token/password a segreto condiviso, oppure una distribuzione `trusted-proxy` non-loopback configurata correttamente. Le configurazioni tailnet/mobile di solito funzionano meglio tramite Tailscale Serve o un altro endpoint `wss://` invece di un `ws://` tailnet grezzo.
- I Node si collegano al WS del Gateway tramite LAN, tailnet o SSH secondo necessità. Il
  bridge TCP legacy è stato rimosso.
- L'host canvas è servito dal server HTTP del Gateway sulla **stessa porta** del Gateway (predefinita `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Quando `gateway.auth` è configurato e il Gateway si collega oltre il loopback, queste route sono protette dall'autenticazione del Gateway. I client Node usano URL di capacità con ambito Node legati alla loro sessione WS attiva. Vedi [Gateway configuration](/it/gateway/configuration) (`canvasHost`, `gateway`).
- L'uso remoto avviene in genere tramite tunnel SSH o VPN tailnet. Vedi [Remote access](/it/gateway/remote) e [Discovery](/it/gateway/discovery).

## Correlati

- [Accesso remoto](/it/gateway/remote)
- [Autenticazione trusted proxy](/it/gateway/trusted-proxy-auth)
- [Protocollo Gateway](/it/gateway/protocol)
