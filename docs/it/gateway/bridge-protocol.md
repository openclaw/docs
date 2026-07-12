---
read_when:
    - Analisi del vecchio codice del client Node o dei log di associazione archiviati
    - Verifica di ciò che esponeva in precedenza l'interfaccia Node legacy
summary: 'Protocollo bridge storico (nodi legacy): JSONL su TCP, associazione, RPC con ambito definito'
title: Protocollo del bridge
x-i18n:
    generated_at: "2026-07-12T07:03:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Il bridge TCP è stato **rimosso**. Le build attuali di OpenClaw non includono il listener del bridge e le chiavi di configurazione `bridge.*` non fanno più parte dello schema. Questa pagina è fornita esclusivamente come riferimento storico. Utilizza il [protocollo del Gateway](/it/gateway/protocol) per tutti i client dei Node e degli operatori.
</Warning>

## Perché esisteva

- **Confine di sicurezza**: esponeva un piccolo elenco di elementi consentiti anziché l'intera superficie API del Gateway.
- **Associazione + identità del Node**: l'ammissione dei Node era gestita dal Gateway e vincolata a un token specifico per ciascun Node.
- **Esperienza di rilevamento**: i Node potevano rilevare i Gateway tramite Bonjour sulla LAN oppure connettersi direttamente tramite una tailnet.
- **WS su local loopback**: l'intero piano di controllo WS rimaneva locale, a meno che non venisse incanalato tramite SSH.

## Trasporto

- TCP, un oggetto JSON per riga (JSONL).
- TLS facoltativo (`bridge.tls.enabled: true`).
- La porta predefinita del listener era `18790`.

Quando TLS era abilitato, i record TXT di rilevamento includevano `bridgeTls=1` e `bridgeTlsSha256` come indicazione non segreta. I record TXT Bonjour/mDNS non sono autenticati; i client non potevano considerare l'impronta digitale pubblicizzata come un pin autorevole senza un'ulteriore verifica fuori banda.

## Handshake e associazione

1. Il client invia `hello` con i metadati del Node e il token (se già associato).
2. Se non è associato, il Gateway risponde con `error` (`NOT_PAIRED` / `UNAUTHORIZED`).
3. Il client invia `pair-request`.
4. Il Gateway attende l'approvazione, quindi invia `pair-ok` e `hello-ok`.

In precedenza, `hello-ok` restituiva `serverName`; le superfici dei Plugin ospitati vengono ora annunciate tramite `pluginSurfaceUrls` nel protocollo attuale del Gateway (Canvas/A2UI utilizza `pluginSurfaceUrls.canvas`).

## Frame

Dal client al Gateway:

- `req` / `res`: RPC del Gateway con ambito limitato (chat, sessioni, configurazione, stato, attivazione vocale, skills.bins).
- `event`: segnali del Node (trascrizione vocale, richiesta dell'agente, sottoscrizione alla chat, ciclo di vita dell'esecuzione).

Dal Gateway al client:

- `invoke` / `invoke-res`: comandi del Node (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`).
- `event`: aggiornamenti della chat per le sessioni sottoscritte.
- `ping` / `pong`: mantenimento della connessione.

L'applicazione dell'elenco di elementi consentiti si trovava in `src/gateway/server-bridge.ts` (rimosso).

## Eventi del ciclo di vita dell'esecuzione

I Node emettevano `exec.finished` per rendere visibile l'attività `system.run` completata, mappata dal Gateway agli eventi di sistema (i Node precedenti potevano anche emettere `exec.started`). `exec.denied` contrassegnava un tentativo `system.run` negato come rifiuto terminale, senza accodare un evento di sistema né attivare il lavoro dell'agente.

Campi del payload (tutti facoltativi, salvo diversa indicazione):

| Campo                            | Note                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `sessionKey`                     | Obbligatorio. Sessione dell'agente per la correlazione degli eventi e, per `exec.finished`, la consegna dell'evento di sistema. |
| `runId`                          | ID di esecuzione univoco per il raggruppamento.                                                                      |
| `command`                        | Stringa del comando grezza o formattata.                                                                             |
| `exitCode`, `timedOut`, `output` | Dettagli sul completamento (solo per il completamento).                                                              |
| `reason`                         | Motivo del rifiuto (solo per il rifiuto).                                                                            |

## Utilizzo storico della tailnet

- Associa il bridge a un indirizzo IP della tailnet: `bridge.bind: "tailnet"` in `~/.openclaw/openclaw.json` (solo a fini storici; `bridge.*` non è più una configurazione valida).
- I client si connettevano tramite il nome MagicDNS o l'indirizzo IP della tailnet.
- Bonjour non attraversa le reti; in alternativa erano necessari DNS-SD su rete geografica oppure host e porta configurati manualmente.

## Controllo delle versioni

Il bridge utilizzava implicitamente la versione 1, senza negoziazione dei valori minimi e massimi. I client attuali dei Node e degli operatori utilizzano il [protocollo WebSocket del Gateway](/it/gateway/protocol), che negozia un intervallo di versioni del protocollo.

## Contenuti correlati

- [Protocollo del Gateway](/it/gateway/protocol)
- [Node](/it/nodes)
