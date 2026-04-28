---
read_when:
    - Implementazione o modifica della scoperta/pubblicità Bonjour
    - Regolazione delle modalità di connessione remota (diretta vs SSH)
    - Progettazione della scoperta e dell'abbinamento del Node per Node remoti
summary: Scoperta del Node e trasporti (Bonjour, Tailscale, SSH) per trovare il gateway
title: Scoperta e trasporti
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:28:32Z"
  model: gpt-5.4
  provider: openai
  source_hash: 615be0f501470772c257beb8e798c522c108b09081a603f44218404277fdf269
  source_path: gateway/discovery.md
  workflow: 15
---

# Scoperta e trasporti

OpenClaw ha due problemi distinti che in superficie sembrano simili:

1. **Controllo remoto dell'operatore**: l'app menubar macOS che controlla un gateway in esecuzione altrove.
2. **Abbinamento del Node**: iOS/Android (e Node futuri) che trovano un gateway e si abbinano in modo sicuro.

L'obiettivo di progettazione è mantenere tutta la scoperta/pubblicità di rete nel **Node Gateway** (`openclaw gateway`) e mantenere i client (app Mac, iOS) come consumatori.

## Termini

- **Gateway**: un singolo processo gateway a lunga esecuzione che possiede lo stato (sessioni, abbinamento, registro Node) ed esegue i canali. La maggior parte delle configurazioni ne usa uno per host; sono possibili configurazioni isolate con più gateway.
- **Gateway WS (control plane)**: l'endpoint WebSocket su `127.0.0.1:18789` per impostazione predefinita; può essere associato a LAN/tailnet tramite `gateway.bind`.
- **Trasporto WS diretto**: un endpoint Gateway WS esposto su LAN/tailnet (senza SSH).
- **Trasporto SSH (fallback)**: controllo remoto inoltrando `127.0.0.1:18789` tramite SSH.
- **Legacy TCP bridge (rimosso)**: vecchio trasporto Node (vedi
  [Protocollo Bridge](/it/gateway/bridge-protocol)); non viene più annunciato per la
  scoperta e non fa più parte delle build attuali.

Dettagli del protocollo:

- [Protocollo Gateway](/it/gateway/protocol)
- [Protocollo Bridge (legacy)](/it/gateway/bridge-protocol)

## Perché manteniamo sia il "diretto" sia SSH

- **WS diretto** offre la UX migliore sulla stessa rete e all'interno di una tailnet:
  - auto-scoperta su LAN tramite Bonjour
  - token di abbinamento + ACL gestiti dal gateway
  - non richiede accesso shell; la superficie del protocollo può restare ristretta e verificabile
- **SSH** resta il fallback universale:
  - funziona ovunque tu abbia accesso SSH (anche tra reti non correlate)
  - sopravvive ai problemi di multicast/mDNS
  - non richiede nuove porte in ingresso oltre a SSH

## Input di scoperta (come i client apprendono dove si trova il gateway)

### 1) Scoperta Bonjour / DNS-SD

Il Bonjour multicast è best-effort e non attraversa le reti. OpenClaw può anche navigare lo
stesso beacon gateway tramite un dominio DNS-SD wide-area configurato, quindi la scoperta può coprire:

- `local.` sulla stessa LAN
- un dominio unicast DNS-SD configurato per la scoperta tra reti

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
  - `displayName=<friendly name>` (friendly name configurato dall'operatore)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (solo quando TLS è abilitato)
  - `gatewayTlsSha256=<sha256>` (solo quando TLS è abilitato e l'impronta digitale è disponibile)
  - `canvasPort=<port>` (porta host canvas; attualmente coincide con `gatewayPort` quando l'host canvas è abilitato)
  - `tailnetDns=<magicdns>` (hint facoltativo; rilevato automaticamente quando Tailscale è disponibile)
  - `sshPort=<port>` (solo modalità mDNS full; il DNS-SD wide-area può ometterlo, nel qual caso i valori predefiniti SSH restano `22`)
  - `cliPath=<path>` (solo modalità mDNS full; il DNS-SD wide-area continua a scriverlo come hint per l'installazione remota)

Note di sicurezza:

- I record TXT di Bonjour/mDNS sono **non autenticati**. I client devono trattare i valori TXT solo come hint UX.
- L'instradamento (host/porta) dovrebbe preferire l'**endpoint del servizio risolto** (SRV + A/AAAA) rispetto a `lanHost`, `tailnetDns` o `gatewayPort` forniti via TXT.
- Il pinning TLS non deve mai consentire a un `gatewayTlsSha256` annunciato di sovrascrivere un pin memorizzato in precedenza.
- I Node iOS/Android dovrebbero richiedere una conferma esplicita “fidati di questa fingerprint” prima di memorizzare un pin visto per la prima volta (verifica fuori banda) ogni volta che il percorso scelto è sicuro/basato su TLS.

Disabilitazione/override:

- `OPENCLAW_DISABLE_BONJOUR=1` disabilita l'annuncio.
- Docker Compose usa per impostazione predefinita `OPENCLAW_DISABLE_BONJOUR=1` perché le reti bridge di solito non trasportano il multicast mDNS in modo affidabile; usa `0` solo su host, macvlan o un'altra rete compatibile con mDNS.
- `gateway.bind` in `~/.openclaw/openclaw.json` controlla la modalità bind del Gateway.
- `OPENCLAW_SSH_PORT` sovrascrive la porta SSH annunciata quando viene emesso `sshPort`.
- `OPENCLAW_TAILNET_DNS` pubblica un hint `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` sovrascrive il percorso CLI annunciato.

### 2) Tailnet (tra reti)

Per configurazioni in stile Londra/Vienna, Bonjour non aiuta. Il target “diretto” consigliato è:

- nome Tailscale MagicDNS (preferito) o IP tailnet stabile.

Se il gateway riesce a rilevare di essere in esecuzione sotto Tailscale, pubblica `tailnetDns` come hint facoltativo per i client (inclusi i beacon wide-area).

L'app macOS ora preferisce i nomi MagicDNS agli IP Tailscale grezzi per la scoperta del gateway. Questo migliora l'affidabilità quando gli IP tailnet cambiano (ad esempio dopo riavvii del Node o riassegnazione CGNAT), perché i nomi MagicDNS si risolvono automaticamente all'IP corrente.

Per l'abbinamento dei Node mobili, gli hint di scoperta non allentano la sicurezza del trasporto sui percorsi tailnet/pubblici:

- iOS/Android richiedono comunque un percorso sicuro per la prima connessione tailnet/pubblica (`wss://` o Tailscale Serve/Funnel).
- Un IP tailnet grezzo scoperto è un hint di instradamento, non un'autorizzazione a usare `ws://` remoto in chiaro.
- Il collegamento diretto privato su LAN tramite `ws://` resta supportato.
- Se vuoi il percorso Tailscale più semplice per i Node mobili, usa Tailscale Serve così che la scoperta e il codice di configurazione si risolvano entrambi sullo stesso endpoint MagicDNS sicuro.

### 3) Target manuale / SSH

Quando non esiste un percorso diretto (o il diretto è disabilitato), i client possono sempre connettersi via SSH inoltrando la porta loopback del gateway.

Vedi [Accesso remoto](/it/gateway/remote).

## Selezione del trasporto (policy client)

Comportamento client consigliato:

1. Se è configurato un endpoint diretto abbinato ed è raggiungibile, usalo.
2. Altrimenti, se la scoperta trova un gateway su `local.` o nel dominio wide-area configurato, offri una scelta “Usa questo gateway” con un tocco e salvalo come endpoint diretto.
3. Altrimenti, se è configurato un DNS/IP tailnet, prova il diretto.
   Per i Node mobili su percorsi tailnet/pubblici, diretto significa un endpoint sicuro, non `ws://` remoto in chiaro.
4. Altrimenti, usa SSH come fallback.

## Abbinamento + autenticazione (trasporto diretto)

Il gateway è la fonte di verità per l'ammissione di Node/client.

- Le richieste di abbinamento vengono create/approvate/rifiutate nel gateway (vedi [Abbinamento Gateway](/it/gateway/pairing)).
- Il gateway applica:
  - autenticazione (token / coppia di chiavi)
  - scope/ACL (il gateway non è un proxy grezzo verso ogni metodo)
  - rate limit

## Responsabilità per componente

- **Gateway**: annuncia i beacon di scoperta, gestisce le decisioni di abbinamento e ospita l'endpoint WS.
- **App macOS**: aiuta a scegliere un gateway, mostra i prompt di abbinamento e usa SSH solo come fallback.
- **Node iOS/Android**: navigano Bonjour come comodità e si connettono al Gateway WS abbinato.

## Correlati

- [Accesso remoto](/it/gateway/remote)
- [Tailscale](/it/gateway/tailscale)
- [Scoperta Bonjour](/it/gateway/bonjour)
