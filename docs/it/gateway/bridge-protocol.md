---
read_when:
    - Compilazione o debug dei client Node (modalità Node per iOS/Android/macOS)
    - Indagine sugli errori di associazione o di autenticazione del bridge
    - Verifica della superficie Node esposta dal Gateway
summary: 'Protocollo bridge storico (nodi precedenti): TCP JSONL, abbinamento, RPC con ambito'
title: Protocollo ponte
x-i18n:
    generated_at: "2026-05-06T17:55:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84c4b5c344d880d4283eebd8596e8b5b0aad5cae747694784011deb1547db30
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Il bridge TCP è stato **rimosso**. Le build attuali di OpenClaw non includono il listener del bridge e le chiavi di configurazione `bridge.*` non sono più nello schema. Questa pagina è mantenuta solo come riferimento storico. Usa il [protocollo Gateway](/it/gateway/protocol) per tutti i client node/operatore.
</Warning>

## Perché esisteva

- **Confine di sicurezza**: il bridge espone una piccola lista consentita invece dell'intera superficie API del gateway.
- **Pairing + identità del node**: l'ammissione dei node è gestita dal gateway ed è legata a un token per node.
- **UX di discovery**: i node possono rilevare i gateway tramite Bonjour sulla LAN, oppure connettersi direttamente tramite una tailnet.
- **WS di local loopback**: il piano di controllo WS completo resta locale, salvo tunneling tramite SSH.

## Trasporto

- TCP, un oggetto JSON per riga (JSONL).
- TLS opzionale (quando `bridge.tls.enabled` è true).
- La porta del listener predefinita storica era `18790` (le build attuali non avviano un bridge TCP).

Quando TLS è abilitato, i record TXT di discovery includono `bridgeTls=1` più `bridgeTlsSha256` come suggerimento non segreto. Nota che i record TXT Bonjour/mDNS non sono autenticati; i client non devono trattare l'impronta digitale pubblicizzata come un pin autorevole senza un'intenzione esplicita dell'utente o un'altra verifica fuori banda.

## Handshake + pairing

1. Il client invia `hello` con metadati del node + token (se già associato).
2. Se non è associato, il gateway risponde con `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Il client invia `pair-request`.
4. Il gateway attende l'approvazione, poi invia `pair-ok` e `hello-ok`.

Storicamente, `hello-ok` restituiva `serverName` e poteva includere `canvasHostUrl`.

## Frame

Client → Gateway:

- `req` / `res`: RPC gateway con ambito limitato (chat, sessioni, configurazione, salute, voicewake, skills.bins)
- `event`: segnali del node (trascrizione vocale, richiesta dell'agente, sottoscrizione chat, ciclo di vita exec)

Gateway → Client:

- `invoke` / `invoke-res`: comandi del node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: aggiornamenti chat per le sessioni sottoscritte
- `ping` / `pong`: keepalive

L'applicazione della lista consentita legacy risiedeva in `src/gateway/server-bridge.ts` (rimosso).

## Eventi del ciclo di vita exec

I node possono emettere eventi `exec.finished` o `exec.denied` per esporre l'attività system.run.
Questi vengono mappati a eventi di sistema nel gateway. (I node legacy possono ancora emettere `exec.started`.)

Campi del payload (tutti opzionali salvo diversa indicazione):

- `sessionKey` (obbligatorio): sessione dell'agente che deve ricevere l'evento di sistema.
- `runId`: id exec univoco per il raggruppamento.
- `command`: stringa di comando grezza o formattata.
- `exitCode`, `timedOut`, `success`, `output`: dettagli di completamento (solo finished).
- `reason`: motivo del rifiuto (solo denied).

## Uso storico della tailnet

- Associa il bridge a un IP tailnet: `bridge.bind: "tailnet"` in
  `~/.openclaw/openclaw.json` (solo storico; `bridge.*` non è più valido).
- I client si connettono tramite nome MagicDNS o IP tailnet.
- Bonjour **non** attraversa le reti; usa host/porta manuali o DNS-SD wide-area quando necessario.

## Versioning

Il bridge era **v1 implicito** (nessuna negoziazione min/max). Questa sezione è solo un riferimento storico; i client node/operatore attuali usano il [protocollo Gateway](/it/gateway/protocol) WebSocket.

## Correlati

- [Protocollo Gateway](/it/gateway/protocol)
- [Node](/it/nodes)
