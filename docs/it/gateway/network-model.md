---
read_when:
    - Vuoi una vista concisa del modello di rete del Gateway
summary: Come si connettono il Gateway, i nodi e l'host canvas.
title: Modello di rete
x-i18n:
    generated_at: "2026-04-05T13:52:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d02d87f38ee5a9fae228f5028892b192c50b473ab4441bbe0b40ee85a1dd402
    source_path: gateway/network-model.md
    workflow: 15
---

# Modello di rete

> Questo contenuto è stato unito in [Network](/network#core-model). Consulta quella pagina per la guida aggiornata.

La maggior parte delle operazioni passa attraverso il Gateway (`openclaw gateway`), un singolo
processo a lunga esecuzione che gestisce le connessioni ai canali e il control plane WebSocket.

## Regole principali

- È consigliato un solo Gateway per host. È l'unico processo autorizzato a gestire la sessione WhatsApp Web. Per bot di emergenza o isolamento rigoroso, esegui più gateway con profili e porte isolati. Vedi [Multiple gateways](/gateway/multiple-gateways).
- Prima loopback: il WS del Gateway usa per impostazione predefinita `ws://127.0.0.1:18789`. La procedura guidata crea per impostazione predefinita l'autenticazione con segreto condiviso e di solito genera un token, anche per loopback. Per l'accesso non loopback, usa un percorso di autenticazione valido del gateway: autenticazione con token/password a segreto condiviso oppure una distribuzione `trusted-proxy` non loopback configurata correttamente. Le configurazioni tailnet/mobile di solito funzionano meglio tramite Tailscale Serve o un altro endpoint `wss://` invece del raw tailnet `ws://`.
- I nodi si connettono al WS del Gateway tramite LAN, tailnet o SSH secondo necessità. Il
  bridge TCP legacy è stato rimosso.
- L'host canvas è servito dal server HTTP del Gateway sulla **stessa porta** del Gateway (predefinita `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Quando `gateway.auth` è configurato e il Gateway è associato oltre loopback, queste route sono protette dall'autenticazione del Gateway. I client nodo usano URL di capacità con ambito nodo legati alla loro sessione WS attiva. Vedi [Gateway configuration](/gateway/configuration) (`canvasHost`, `gateway`).
- L'uso remoto avviene tipicamente tramite tunnel SSH o VPN tailnet. Vedi [Remote access](/gateway/remote) e [Discovery](/gateway/discovery).
