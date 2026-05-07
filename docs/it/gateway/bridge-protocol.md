---
read_when:
    - Compilazione o debug dei client Node (modalità Node iOS/Android/macOS)
    - Indagare sugli errori di abbinamento o di autenticazione del bridge
    - Audit della superficie Node esposta dal Gateway
summary: 'Protocollo storico del bridge (nodi legacy): TCP JSONL, abbinamento, RPC con ambito limitato'
title: Protocollo di collegamento
x-i18n:
    generated_at: "2026-05-07T13:16:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc906ca3a8a4ebef9b39c53187bcb4d06b287875b8e8748a168812f9a52e6152
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Il bridge TCP è stato **rimosso**. Le build attuali di OpenClaw non distribuiscono il listener del bridge e le chiavi di configurazione `bridge.*` non sono più nello schema. Questa pagina è conservata solo come riferimento storico. Usa il [Protocollo Gateway](/it/gateway/protocol) per tutti i client nodo/operatore.
</Warning>

## Perché esisteva

- **Confine di sicurezza**: il bridge espone una piccola lista consentita invece dell'intera superficie API del Gateway.
- **Abbinamento + identità del nodo**: l'ammissione dei nodi è gestita dal Gateway ed è legata a un token per nodo.
- **UX di discovery**: i nodi possono individuare i Gateway tramite Bonjour su LAN, oppure connettersi direttamente su una tailnet.
- **WS in loopback**: il piano di controllo WS completo resta locale a meno che non venga instradato tramite tunnel SSH.

## Trasporto

- TCP, un oggetto JSON per riga (JSONL).
- TLS opzionale (quando `bridge.tls.enabled` è true).
- La porta listener predefinita storica era `18790` (le build attuali non avviano un bridge TCP).

Quando TLS è abilitato, i record TXT di discovery includono `bridgeTls=1` più `bridgeTlsSha256` come suggerimento non segreto. Nota che i record TXT Bonjour/mDNS non sono autenticati; i client non devono trattare l'impronta pubblicizzata come un pin autorevole senza un'intenzione esplicita dell'utente o un'altra verifica fuori banda.

## Handshake + abbinamento

1. Il client invia `hello` con metadati del nodo + token (se già abbinato).
2. Se non è abbinato, il Gateway risponde `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Il client invia `pair-request`.
4. Il Gateway attende l'approvazione, poi invia `pair-ok` e `hello-ok`.

Storicamente, `hello-ok` restituiva `serverName`; le superfici dei Plugin ospitati sono ora pubblicizzate tramite `pluginSurfaceUrls`. Canvas/A2UI usa `pluginSurfaceUrls.canvas`; l'alias deprecato `canvasHostUrl` non fa parte del protocollo rifattorizzato.

## Frame

Client → Gateway:

- `req` / `res`: RPC del Gateway con ambito (chat, sessions, config, health, voicewake, skills.bins)
- `event`: segnali del nodo (trascrizione vocale, richiesta agente, iscrizione alla chat, ciclo di vita exec)

Gateway → Client:

- `invoke` / `invoke-res`: comandi del nodo (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`)
- `event`: aggiornamenti chat per le sessioni sottoscritte
- `ping` / `pong`: keepalive

L'applicazione legacy della lista consentita si trovava in `src/gateway/server-bridge.ts` (rimosso).

## Eventi del ciclo di vita exec

I nodi possono emettere eventi `exec.finished` o `exec.denied` per esporre l'attività system.run.
Questi vengono mappati a eventi di sistema nel Gateway. (I nodi legacy possono ancora emettere `exec.started`.)

Campi del payload (tutti opzionali salvo diversa indicazione):

- `sessionKey` (obbligatorio): sessione agente che deve ricevere l'evento di sistema.
- `runId`: ID exec univoco per il raggruppamento.
- `command`: stringa del comando grezza o formattata.
- `exitCode`, `timedOut`, `success`, `output`: dettagli di completamento (solo finished).
- `reason`: motivo del rifiuto (solo denied).

## Uso storico della tailnet

- Associa il bridge a un IP della tailnet: `bridge.bind: "tailnet"` in `~/.openclaw/openclaw.json` (solo storico; `bridge.*` non è più valido).
- I client si connettono tramite nome MagicDNS o IP della tailnet.
- Bonjour **non** attraversa le reti; usa host/porta manuali o DNS-SD wide-area quando necessario.

## Versionamento

Il bridge era **v1 implicito** (nessuna negoziazione min/max). Questa sezione è solo un riferimento storico; i client nodo/operatore attuali usano il [Protocollo Gateway](/it/gateway/protocol) WebSocket.

## Correlati

- [Protocollo Gateway](/it/gateway/protocol)
- [Nodi](/it/nodes)
