---
read_when:
    - Creazione o debug di client Node (modalità Node iOS/Android/macOS)
    - Indagare gli errori di abbinamento o di autenticazione bridge
    - Verifica della superficie Node esposta dal Gateway
summary: 'Protocollo bridge storico (nodi legacy): TCP JSONL, abbinamento, RPC con ambito'
title: Protocollo bridge
x-i18n:
    generated_at: "2026-06-27T17:30:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 485d18f94b731018c6e0df493068b0b6aceff9afba6bebf1350db63c04cee98c
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Il bridge TCP è stato **rimosso**. Le build attuali di OpenClaw non distribuiscono il listener del bridge e le chiavi di configurazione `bridge.*` non sono più nello schema. Questa pagina è mantenuta solo come riferimento storico. Usa il [Protocollo Gateway](/it/gateway/protocol) per tutti i client node/operatore.
</Warning>

## Perché esisteva

- **Confine di sicurezza**: il bridge espone una piccola allowlist invece
  dell'intera superficie API del Gateway.
- **Abbinamento + identità del node**: l'ammissione dei node è gestita dal Gateway ed è legata
  a un token per node.
- **UX di rilevamento**: i node possono rilevare i Gateway tramite Bonjour sulla LAN oppure connettersi
  direttamente tramite una tailnet.
- **WS di loopback**: il piano di controllo WS completo resta locale salvo tunneling tramite SSH.

## Trasporto

- TCP, un oggetto JSON per riga (JSONL).
- TLS opzionale (quando `bridge.tls.enabled` è true).
- La porta listener predefinita storica era `18790` (le build attuali non avviano un
  bridge TCP).

Quando TLS è abilitato, i record TXT di rilevamento includono `bridgeTls=1` più
`bridgeTlsSha256` come suggerimento non segreto. Nota che i record TXT Bonjour/mDNS
non sono autenticati; i client non devono trattare l'impronta digitale pubblicizzata come
un pin autorevole senza intento esplicito dell'utente o altra verifica fuori banda.

## Handshake + abbinamento

1. Il client invia `hello` con metadati del node + token (se già abbinato).
2. Se non è abbinato, il Gateway risponde `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Il client invia `pair-request`.
4. Il Gateway attende l'approvazione, quindi invia `pair-ok` e `hello-ok`.

Storicamente, `hello-ok` restituiva `serverName`; le superfici Plugin ospitate ora
sono pubblicizzate tramite `pluginSurfaceUrls`. Canvas/A2UI usa
`pluginSurfaceUrls.canvas`; l'alias deprecato `canvasHostUrl` non fa parte
del protocollo rifattorizzato.

## Frame

Client → Gateway:

- `req` / `res`: RPC Gateway con ambito (chat, sessioni, configurazione, integrità, voicewake, skills.bins)
- `event`: segnali del node (trascrizione vocale, richiesta agente, sottoscrizione chat, ciclo di vita exec)

Gateway → Client:

- `invoke` / `invoke-res`: comandi del node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: aggiornamenti chat per le sessioni sottoscritte
- `ping` / `pong`: keepalive

L'applicazione della allowlist legacy viveva in `src/gateway/server-bridge.ts` (rimosso).

## Eventi del ciclo di vita exec

I node possono emettere eventi `exec.finished` per esporre attività `system.run` completate.
Questi sono mappati a eventi di sistema nel Gateway. (I node legacy possono ancora emettere `exec.started`.)
I node possono emettere `exec.denied` per tentativi `system.run` negati; il Gateway accetta
l'evento come diniego terminale e non accoda un evento di sistema né risveglia il lavoro dell'agente.

Campi del payload (tutti opzionali salvo dove indicato):

- `sessionKey` (obbligatorio): sessione agente per la correlazione dell'evento e, per
  `exec.finished`, la consegna dell'evento di sistema.
- `runId`: ID exec univoco per il raggruppamento.
- `command`: stringa del comando grezza o formattata.
- `exitCode`, `timedOut`, `success`, `output`: dettagli di completamento (solo finished).
- `reason`: motivo del diniego (solo denied).

## Uso storico della tailnet

- Associa il bridge a un IP tailnet: `bridge.bind: "tailnet"` in
  `~/.openclaw/openclaw.json` (solo storico; `bridge.*` non è più valido).
- I client si connettono tramite nome MagicDNS o IP tailnet.
- Bonjour **non** attraversa le reti; usa host/porta manuali o DNS-SD wide-area
  quando necessario.

## Versionamento

Il bridge era **v1 implicito** (nessuna negoziazione min/max). Questa sezione è
solo un riferimento storico; i client node/operatore attuali usano il
[Protocollo Gateway](/it/gateway/protocol) WebSocket.

## Correlati

- [Protocollo Gateway](/it/gateway/protocol)
- [Node](/it/nodes)
