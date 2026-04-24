---
read_when:
    - Sviluppo o debug di client Node (modalità Node iOS/Android/macOS)
    - Analisi dei problemi di associazione o di autenticazione del bridge
    - Audit della superficie Node esposta dal Gateway
summary: 'Protocollo storico del bridge (Node legacy): TCP JSONL, pairing, RPC con ambito'
title: Protocollo Bridge
x-i18n:
    generated_at: "2026-04-24T08:39:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b2a54f439e586ea7e535cedae4a07c365f95702835b05ba5a779d590dcf967e
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Protocollo Bridge (trasporto Node legacy)

<Warning>
Il bridge TCP è stato **rimosso**. Le build correnti di OpenClaw non includono il listener bridge e le chiavi di configurazione `bridge.*` non sono più nello schema. Questa pagina viene mantenuta solo come riferimento storico. Usa il [Protocollo Gateway](/it/gateway/protocol) per tutti i client Node/operator.
</Warning>

## Perché esisteva

- **Confine di sicurezza**: il bridge espone una piccola allowlist invece dell'intera
  superficie API del Gateway.
- **Associazione + identità del Node**: l'ammissione del Node è di proprietà del Gateway ed è legata
  a un token per Node.
- **Esperienza di discovery**: i Node possono scoprire Gateway tramite Bonjour su LAN, oppure connettersi
  direttamente su un tailnet.
- **WS loopback**: l'intero control plane WS resta locale a meno che non venga tunnelizzato via SSH.

## Trasporto

- TCP, un oggetto JSON per riga (JSONL).
- TLS facoltativo (quando `bridge.tls.enabled` è true).
- La porta di ascolto storica predefinita era `18790` (le build correnti non avviano un
  bridge TCP).

Quando TLS è abilitato, i record TXT di discovery includono `bridgeTls=1` più
`bridgeTlsSha256` come suggerimento non segreto. Nota che i record TXT Bonjour/mDNS non sono
autenticati; i client non devono trattare la fingerprint pubblicizzata come un pin
autorevole senza esplicita intenzione dell'utente o altra verifica fuori banda.

## Handshake + associazione

1. Il client invia `hello` con metadati del Node + token (se già associato).
2. Se non è associato, il Gateway risponde `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Il client invia `pair-request`.
4. Il Gateway attende l'approvazione, poi invia `pair-ok` e `hello-ok`.

Storicamente, `hello-ok` restituiva `serverName` e poteva includere
`canvasHostUrl`.

## Frame

Client → Gateway:

- `req` / `res`: RPC Gateway con ambito (chat, sessioni, configurazione, health, voicewake, skills.bins)
- `event`: segnali del Node (trascrizione vocale, richiesta agente, sottoscrizione chat, ciclo di vita exec)

Gateway → Client:

- `invoke` / `invoke-res`: comandi del Node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: aggiornamenti chat per le sessioni sottoscritte
- `ping` / `pong`: keepalive

L'applicazione legacy della allowlist si trovava in `src/gateway/server-bridge.ts` (rimossa).

## Eventi del ciclo di vita exec

I Node possono emettere eventi `exec.finished` o `exec.denied` per esporre l'attività di system.run.
Questi vengono mappati a eventi di sistema nel Gateway. (I Node legacy possono ancora emettere `exec.started`.)

Campi del payload (tutti facoltativi se non diversamente indicato):

- `sessionKey` (obbligatorio): sessione agente che deve ricevere l'evento di sistema.
- `runId`: id exec univoco per il raggruppamento.
- `command`: stringa del comando raw o formattata.
- `exitCode`, `timedOut`, `success`, `output`: dettagli di completamento (solo finished).
- `reason`: motivo del rifiuto (solo denied).

## Uso storico del tailnet

- Collega il bridge a un IP tailnet: `bridge.bind: "tailnet"` in
  `~/.openclaw/openclaw.json` (solo storico; `bridge.*` non è più valido).
- I client si connettono tramite nome MagicDNS o IP tailnet.
- Bonjour **non** attraversa le reti; usa host/porta manuali o DNS‑SD wide-area
  quando necessario.

## Versionamento

Il bridge era **v1 implicita** (nessuna negoziazione min/max). Questa sezione è
solo riferimento storico; i client Node/operator correnti usano il WebSocket
[Protocollo Gateway](/it/gateway/protocol).

## Correlati

- [Protocollo Gateway](/it/gateway/protocol)
- [Node](/it/nodes)
