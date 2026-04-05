---
read_when:
    - Creazione o debug di client nodo (modalità nodo iOS/Android/macOS)
    - Analisi di errori di pairing o autenticazione bridge
    - Audit della superficie del nodo esposta dal gateway
summary: 'Protocollo bridge storico (nodi legacy): TCP JSONL, pairing, RPC con ambito'
title: Protocollo Bridge
x-i18n:
    generated_at: "2026-04-05T13:51:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bc25c388f3d65944167d05ca78f987c84ca480f0213e3485b118ebf4858c50f
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Protocollo bridge (trasporto nodo legacy)

<Warning>
Il bridge TCP è stato **rimosso**. Le build attuali di OpenClaw non distribuiscono il listener bridge e le chiavi di configurazione `bridge.*` non sono più nello schema. Questa pagina è mantenuta solo come riferimento storico. Usa il [Protocollo Gateway](/gateway/protocol) per tutti i client nodo/operatore.
</Warning>

## Perché esisteva

- **Perimetro di sicurezza**: il bridge espone una piccola allowlist invece dell'intera
  superficie API del gateway.
- **Pairing + identità del nodo**: l'ammissione del nodo è gestita dal gateway e legata
  a un token per nodo.
- **Esperienza di discovery**: i nodi possono individuare i gateway tramite Bonjour sulla LAN, oppure connettersi
  direttamente tramite una tailnet.
- **WS loopback**: l'intero piano di controllo WS resta locale a meno che non venga instradato tramite SSH.

## Trasporto

- TCP, un oggetto JSON per riga (JSONL).
- TLS opzionale (quando `bridge.tls.enabled` è true).
- La porta storica predefinita del listener era `18790` (le build attuali non avviano un
  bridge TCP).

Quando TLS è abilitato, i record TXT di discovery includono `bridgeTls=1` più
`bridgeTlsSha256` come suggerimento non segreto. Nota che i record TXT Bonjour/mDNS non sono
autenticati; i client non devono trattare l'impronta pubblicizzata come un pin
autorevole senza esplicita intenzione dell'utente o altra verifica fuori banda.

## Handshake + pairing

1. Il client invia `hello` con i metadati del nodo + token (se già accoppiato).
2. Se non è accoppiato, il gateway risponde con `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Il client invia `pair-request`.
4. Il gateway attende l'approvazione, poi invia `pair-ok` e `hello-ok`.

Storicamente, `hello-ok` restituiva `serverName` e poteva includere
`canvasHostUrl`.

## Frame

Client → Gateway:

- `req` / `res`: RPC del gateway con ambito (chat, sessions, config, health, voicewake, skills.bins)
- `event`: segnali del nodo (trascrizione vocale, richiesta agente, sottoscrizione chat, ciclo di vita exec)

Gateway → Client:

- `invoke` / `invoke-res`: comandi del nodo (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: aggiornamenti chat per le sessioni sottoscritte
- `ping` / `pong`: keepalive

L'applicazione legacy dell'allowlist si trovava in `src/gateway/server-bridge.ts` (rimosso).

## Eventi del ciclo di vita exec

I nodi possono emettere eventi `exec.finished` o `exec.denied` per esporre l'attività di system.run.
Questi vengono mappati agli eventi di sistema nel gateway. (I nodi legacy possono ancora emettere `exec.started`.)

Campi del payload (tutti opzionali salvo dove indicato):

- `sessionKey` (obbligatorio): sessione agente che deve ricevere l'evento di sistema.
- `runId`: id exec univoco per il raggruppamento.
- `command`: stringa del comando raw o formattata.
- `exitCode`, `timedOut`, `success`, `output`: dettagli di completamento (solo finished).
- `reason`: motivo del rifiuto (solo denied).

## Uso storico della tailnet

- Associa il bridge a un IP tailnet: `bridge.bind: "tailnet"` in
  `~/.openclaw/openclaw.json` (solo storico; `bridge.*` non è più valido).
- I client si connettono tramite nome MagicDNS o IP tailnet.
- Bonjour **non** attraversa le reti; usa host/porta manuali o DNS‑SD wide-area
  quando necessario.

## Versioning

Il bridge era **v1 implicita** (nessuna negoziazione min/max). Questa sezione è
solo un riferimento storico; i client nodo/operatore attuali usano il WebSocket
[Protocollo Gateway](/gateway/protocol).
