---
read_when:
    - Implementare o modificare la discovery/l'annuncio Bonjour
    - Regolare le modalità di connessione remota (diretta vs SSH)
    - Progettare discovery + abbinamento dei Node per Node remoti
summary: Discovery dei Node e trasporti (Bonjour, Tailscale, SSH) per trovare il gateway
title: Discovery e trasporti
x-i18n:
    generated_at: "2026-04-24T08:40:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 684e5aeb1f74a90bf8689f8b25830be2c9e497fcdeda390d98f204d7cb4134b8
    source_path: gateway/discovery.md
    workflow: 15
---

# Discovery e trasporti

OpenClaw ha due problemi distinti che in superficie sembrano simili:

1. **Controllo remoto dell'operatore**: l'app macOS della barra dei menu che controlla un gateway in esecuzione altrove.
2. **Abbinamento dei Node**: iOS/Android (e futuri Node) che trovano un gateway e si abbinano in modo sicuro.

L'obiettivo del design è mantenere tutta la discovery/pubblicità di rete nel **Node Gateway** (`openclaw gateway`) e mantenere i client (app Mac, iOS) come consumer.

## Termini

- **Gateway**: un singolo processo gateway a lunga esecuzione che possiede lo stato (sessioni, abbinamento, registro Node) ed esegue i canali. La maggior parte delle configurazioni ne usa uno per host; sono possibili configurazioni isolate con più gateway.
- **Gateway WS (control plane)**: endpoint WebSocket su `127.0.0.1:18789` per impostazione predefinita; può essere bindato a LAN/tailnet tramite `gateway.bind`.
- **Trasporto WS diretto**: endpoint Gateway WS esposto verso LAN/tailnet (senza SSH).
- **Trasporto SSH (fallback)**: controllo remoto inoltrando `127.0.0.1:18789` tramite SSH.
- **Bridge TCP legacy (rimosso)**: vecchio trasporto dei Node (vedi
  [Protocollo Bridge](/it/gateway/bridge-protocol)); non viene più annunciato per la
  discovery e non fa più parte delle build attuali.

Dettagli del protocollo:

- [Protocollo del Gateway](/it/gateway/protocol)
- [Protocollo Bridge (legacy)](/it/gateway/bridge-protocol)

## Perché manteniamo sia il "diretto" sia SSH

- **WS diretto** è la UX migliore sulla stessa rete e all'interno di una tailnet:
  - auto-discovery sulla LAN tramite Bonjour
  - token di abbinamento + ACL di proprietà del gateway
  - nessun accesso shell richiesto; la superficie del protocollo può restare ristretta e verificabile
- **SSH** resta il fallback universale:
  - funziona ovunque tu abbia accesso SSH (anche attraverso reti non correlate)
  - sopravvive ai problemi di multicast/mDNS
  - non richiede nuove porte in ingresso oltre a SSH

## Input di discovery (come i client imparano dove si trova il gateway)

### 1) Discovery Bonjour / DNS-SD

Il Bonjour multicast è best-effort e non attraversa le reti. OpenClaw può anche navigare lo
stesso beacon del gateway tramite un dominio DNS-SD wide-area configurato, così la discovery può coprire:

- `local.` sulla stessa LAN
- un dominio DNS-SD unicast configurato per la discovery cross-network

Direzione del target:

- Il **gateway** annuncia il suo endpoint WS tramite Bonjour.
- I client navigano e mostrano un elenco “scegli un gateway”, poi memorizzano l'endpoint scelto.

Dettagli del beacon e risoluzione dei problemi: [Bonjour](/it/gateway/bonjour).

#### Dettagli del beacon di servizio

- Tipi di servizio:
  - `_openclaw-gw._tcp` (beacon di trasporto del gateway)
- Chiavi TXT (non segrete):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nome visualizzato configurato dall'operatore)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (solo quando TLS è abilitato)
  - `gatewayTlsSha256=<sha256>` (solo quando TLS è abilitato e il fingerprint è disponibile)
  - `canvasPort=<port>` (porta dell'host canvas; attualmente coincide con `gatewayPort` quando l'host canvas è abilitato)
  - `tailnetDns=<magicdns>` (suggerimento facoltativo; rilevato automaticamente quando Tailscale è disponibile)
  - `sshPort=<port>` (solo modalità mDNS full; il DNS-SD wide-area può ometterlo, nel qual caso i valori predefiniti SSH restano `22`)
  - `cliPath=<path>` (solo modalità mDNS full; il DNS-SD wide-area lo scrive comunque come suggerimento per l'installazione remota)

Note di sicurezza:

- I record TXT Bonjour/mDNS sono **non autenticati**. I client devono trattare i valori TXT solo come suggerimenti UX.
- L'instradamento (host/porta) dovrebbe preferire l'**endpoint del servizio risolto** (SRV + A/AAAA) rispetto ai valori `lanHost`, `tailnetDns` o `gatewayPort` forniti dai TXT.
- Il pinning TLS non deve mai consentire che un `gatewayTlsSha256` annunciato sovrascriva un pin memorizzato in precedenza.
- I Node iOS/Android dovrebbero richiedere una conferma esplicita “fidati di questo fingerprint” prima di memorizzare un pin visto per la prima volta (verifica out-of-band) ogni volta che il percorso scelto è sicuro/basato su TLS.

Disabilitazione/override:

- `OPENCLAW_DISABLE_BONJOUR=1` disabilita l'annuncio.
- `gateway.bind` in `~/.openclaw/openclaw.json` controlla la modalità di bind del Gateway.
- `OPENCLAW_SSH_PORT` sovrascrive la porta SSH annunciata quando viene emesso `sshPort`.
- `OPENCLAW_TAILNET_DNS` pubblica un suggerimento `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` sovrascrive il percorso CLI annunciato.

### 2) Tailnet (cross-network)

Per configurazioni in stile Londra/Vienna, Bonjour non aiuterà. Il target “diretto” consigliato è:

- nome Tailscale MagicDNS (preferito) o un IP tailnet stabile.

Se il gateway può rilevare di essere in esecuzione sotto Tailscale, pubblica `tailnetDns` come suggerimento facoltativo per i client (inclusi i beacon wide-area).

L'app macOS ora preferisce i nomi MagicDNS agli IP Tailscale raw per la discovery del gateway. Questo migliora l'affidabilità quando gli IP tailnet cambiano (ad esempio dopo il riavvio dei Node o la riassegnazione CGNAT), perché i nomi MagicDNS si risolvono automaticamente nell'IP corrente.

Per l'abbinamento dei Node mobili, i suggerimenti di discovery non allentano la sicurezza del trasporto su percorsi tailnet/pubblici:

- iOS/Android continuano a richiedere un percorso sicuro per la prima connessione tailnet/pubblica (`wss://` o Tailscale Serve/Funnel).
- Un IP tailnet raw rilevato è un suggerimento di instradamento, non un permesso a usare `ws://` remoto in chiaro.
- `ws://` in connessione diretta su LAN privata resta supportato.
- Se vuoi il percorso Tailscale più semplice per i Node mobili, usa Tailscale Serve così discovery e codice di configurazione si risolvono entrambi nello stesso endpoint MagicDNS sicuro.

### 3) Target manuale / SSH

Quando non esiste un percorso diretto (o il diretto è disabilitato), i client possono sempre connettersi tramite SSH inoltrando la porta loopback del gateway.

Vedi [Accesso remoto](/it/gateway/remote).

## Selezione del trasporto (policy del client)

Comportamento client consigliato:

1. Se è configurato un endpoint diretto già abbinato ed è raggiungibile, usalo.
2. Altrimenti, se la discovery trova un gateway su `local.` o nel dominio wide-area configurato, offri una scelta “Usa questo gateway” con un tocco e salvalo come endpoint diretto.
3. Altrimenti, se è configurato un DNS/IP tailnet, prova il diretto.
   Per i Node mobili su percorsi tailnet/pubblici, diretto significa un endpoint sicuro, non `ws://` remoto in chiaro.
4. Altrimenti, usa il fallback a SSH.

## Abbinamento + autenticazione (trasporto diretto)

Il gateway è la fonte di verità per l'ammissione di node/client.

- Le richieste di abbinamento vengono create/approvate/rifiutate nel gateway (vedi [Abbinamento del Gateway](/it/gateway/pairing)).
- Il gateway applica:
  - autenticazione (token / keypair)
  - scope/ACL (il gateway non è un proxy raw per ogni metodo)
  - rate limit

## Responsabilità per componente

- **Gateway**: annuncia beacon di discovery, possiede le decisioni di abbinamento e ospita l'endpoint WS.
- **App macOS**: ti aiuta a scegliere un gateway, mostra prompt di abbinamento e usa SSH solo come fallback.
- **Node iOS/Android**: navigano Bonjour come comodità e si connettono al Gateway WS abbinato.

## Correlati

- [Accesso remoto](/it/gateway/remote)
- [Tailscale](/it/gateway/tailscale)
- [Discovery Bonjour](/it/gateway/bonjour)
