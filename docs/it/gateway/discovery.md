---
read_when:
    - Implementazione o modifica della scoperta/dell'annuncio Bonjour
    - Regolazione delle modalità di connessione remota (diretta vs SSH)
    - Progettazione del rilevamento dei Node + abbinamento per i Node remoti
summary: Rilevamento dei Node e trasporti (Bonjour, Tailscale, SSH) per trovare il Gateway
title: Individuazione e trasporti
x-i18n:
    generated_at: "2026-05-06T08:50:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f53e1292d9e5b402186c48c777e7e665c790981a64679c783ae8d8a1f170ee1
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw ha due problemi distinti che in superficie sembrano simili:

1. **Controllo remoto dell'operatore**: l'app della barra dei menu di macOS che controlla un Gateway in esecuzione altrove.
2. **Associazione Node**: iOS/Android (e i Node futuri) che trovano un Gateway e si associano in modo sicuro.

L'obiettivo del design è mantenere tutta la discovery/pubblicizzazione di rete nel **Node Gateway** (`openclaw gateway`) e mantenere i client (app Mac, iOS) come consumer.

## Termini

- **Gateway**: un singolo processo Gateway a esecuzione prolungata che possiede lo stato (sessioni, associazione, registro dei Node) ed esegue i canali. La maggior parte delle configurazioni ne usa uno per host; sono possibili configurazioni isolate con più Gateway.
- **Gateway WS (piano di controllo)**: l'endpoint WebSocket su `127.0.0.1:18789` per impostazione predefinita; può essere associato alla LAN/tailnet tramite `gateway.bind`.
- **Trasporto WS diretto**: un endpoint Gateway WS esposto verso LAN/tailnet (senza SSH).
- **Trasporto SSH (fallback)**: controllo remoto tramite inoltro di `127.0.0.1:18789` su SSH.
- **Bridge TCP legacy (rimosso)**: trasporto Node precedente (vedi
  [Protocollo bridge](/it/gateway/bridge-protocol)); non viene più pubblicizzato per
  la discovery e non fa più parte delle build attuali.

Dettagli del protocollo:

- [Protocollo Gateway](/it/gateway/protocol)
- [Protocollo bridge (legacy)](/it/gateway/bridge-protocol)

## Perché manteniamo sia diretto sia SSH

- **WS diretto** offre la migliore UX sulla stessa rete e all'interno di una tailnet:
  - discovery automatica sulla LAN tramite Bonjour
  - token di associazione + ACL di proprietà del Gateway
  - nessun accesso shell richiesto; la superficie del protocollo può restare limitata e verificabile
- **SSH** resta il fallback universale:
  - funziona ovunque tu abbia accesso SSH (anche tra reti non correlate)
  - sopravvive ai problemi di multicast/mDNS
  - non richiede nuove porte in ingresso oltre a SSH

## Input di discovery (come i client apprendono dove si trova il Gateway)

### 1) Discovery Bonjour / DNS-SD

Bonjour multicast è best-effort e non attraversa le reti. OpenClaw può anche esplorare lo
stesso beacon del Gateway tramite un dominio DNS-SD wide-area configurato, quindi la discovery può coprire:

- `local.` sulla stessa LAN
- un dominio DNS-SD unicast configurato per la discovery tra reti

Direzione target:

- Il **Gateway** pubblicizza il proprio endpoint WS tramite Bonjour quando il Plugin
  `bonjour` in bundle è abilitato. Il Plugin si avvia automaticamente sugli host macOS ed è
  opt-in altrove.
- I client esplorano e mostrano un elenco "scegli un Gateway", quindi memorizzano l'endpoint scelto.

Risoluzione dei problemi e dettagli del beacon: [Bonjour](/it/gateway/bonjour).

#### Dettagli del beacon del servizio

- Tipi di servizio:
  - `_openclaw-gw._tcp` (beacon del trasporto Gateway)
- Chiavi TXT (non segrete):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nome visualizzato configurato dall'operatore)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (solo quando TLS è abilitato)
  - `gatewayTlsSha256=<sha256>` (solo quando TLS è abilitato e l'impronta è disponibile)
  - `canvasPort=<port>` (porta dell'host canvas; attualmente uguale a `gatewayPort` quando l'host canvas è abilitato)
  - `tailnetDns=<magicdns>` (suggerimento opzionale; rilevato automaticamente quando Tailscale è disponibile)
  - `sshPort=<port>` (solo modalità mDNS completa; il DNS-SD wide-area può ometterlo, nel qual caso i valori predefiniti SSH restano a `22`)
  - `cliPath=<path>` (solo modalità mDNS completa; il DNS-SD wide-area lo scrive comunque come suggerimento per l'installazione remota)

Note di sicurezza:

- I record TXT Bonjour/mDNS sono **non autenticati**. I client devono trattare i valori TXT solo come suggerimenti UX.
- Il routing (host/porta) dovrebbe preferire l'**endpoint del servizio risolto** (SRV + A/AAAA) rispetto a `lanHost`, `tailnetDns` o `gatewayPort` forniti da TXT.
- Il pinning TLS non deve mai consentire a un `gatewayTlsSha256` pubblicizzato di sovrascrivere un pin memorizzato in precedenza.
- I Node iOS/Android dovrebbero richiedere una conferma esplicita "fidati di questa impronta" prima di memorizzare un pin per la prima volta (verifica fuori banda) ogni volta che la route scelta è sicura/basata su TLS.

Abilita/disabilita/sovrascrivi:

- `openclaw plugins enable bonjour` abilita la pubblicizzazione multicast LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` disabilita la pubblicizzazione.
- Quando il Plugin Bonjour è abilitato e `OPENCLAW_DISABLE_BONJOUR` non è impostato,
  Bonjour pubblicizza sugli host normali e si disabilita automaticamente all'interno dei container rilevati.
  L'avvio del Gateway macOS con configurazione vuota abilita automaticamente il Plugin; le distribuzioni Linux,
  Windows e containerizzate richiedono l'abilitazione esplicita.
  Usa `0` solo su host, macvlan o un'altra rete compatibile con mDNS; usa `1` per
  forzare la disabilitazione.
- `gateway.bind` in `~/.openclaw/openclaw.json` controlla la modalità di bind del Gateway.
- `OPENCLAW_SSH_PORT` sovrascrive la porta SSH pubblicizzata quando viene emesso `sshPort`.
- `OPENCLAW_TAILNET_DNS` pubblica un suggerimento `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` sovrascrive il percorso CLI pubblicizzato.

### 2) Tailnet (tra reti)

Per configurazioni in stile Londra/Vienna, Bonjour non aiuterà. Il target "diretto" consigliato è:

- nome MagicDNS Tailscale (preferito) o un IP tailnet stabile.

Se il Gateway può rilevare che è in esecuzione sotto Tailscale, pubblica `tailnetDns` come suggerimento opzionale per i client (inclusi i beacon wide-area).

L'app macOS ora preferisce i nomi MagicDNS rispetto agli IP Tailscale grezzi per la discovery del Gateway. Questo migliora l'affidabilità quando gli IP tailnet cambiano (per esempio dopo riavvii dei Node o riassegnazione CGNAT), perché i nomi MagicDNS risolvono automaticamente all'IP corrente.

Per l'associazione dei Node mobili, i suggerimenti di discovery non allentano la sicurezza del trasporto sulle route tailnet/pubbliche:

- iOS/Android richiedono comunque un percorso di connessione tailnet/pubblico sicuro al primo utilizzo (`wss://` o Tailscale Serve/Funnel).
- Un IP tailnet grezzo scoperto è un suggerimento di routing, non un permesso per usare `ws://` remoto in chiaro.
- La connessione diretta `ws://` su LAN privata resta supportata.
- Se vuoi il percorso Tailscale più semplice per i Node mobili, usa Tailscale Serve in modo che la discovery e il codice di configurazione risolvano entrambi allo stesso endpoint MagicDNS sicuro.

### 3) Target manuale / SSH

Quando non c'è una route diretta (o la diretta è disabilitata), i client possono sempre connettersi tramite SSH inoltrando la porta Gateway su local loopback.

Vedi [Accesso remoto](/it/gateway/remote).

## Selezione del trasporto (policy del client)

Comportamento consigliato del client:

1. Se è configurato e raggiungibile un endpoint diretto associato, usalo.
2. Altrimenti, se la discovery trova un Gateway su `local.` o sul dominio wide-area configurato, offri una scelta "Usa questo Gateway" con un tocco e salvala come endpoint diretto.
3. Altrimenti, se è configurato un DNS/IP tailnet, prova la connessione diretta.
   Per i Node mobili su route tailnet/pubbliche, diretto significa un endpoint sicuro, non `ws://` remoto in chiaro.
4. Altrimenti, ripiega su SSH.

## Associazione + auth (trasporto diretto)

Il Gateway è la fonte di verità per l'ammissione di Node/client.

- Le richieste di associazione vengono create/approvate/rifiutate nel Gateway (vedi [Associazione Gateway](/it/gateway/pairing)).
- Il Gateway applica:
  - auth (token / coppia di chiavi)
  - ambiti/ACL (il Gateway non è un proxy grezzo verso ogni metodo)
  - rate limit

## Responsabilità per componente

- **Gateway**: pubblicizza beacon di discovery, possiede le decisioni di associazione e ospita l'endpoint WS.
- **App macOS**: ti aiuta a scegliere un Gateway, mostra le richieste di associazione e usa SSH solo come fallback.
- **Node iOS/Android**: esplorano Bonjour per comodità e si connettono al Gateway WS associato.

## Correlati

- [Accesso remoto](/it/gateway/remote)
- [Tailscale](/it/gateway/tailscale)
- [Discovery Bonjour](/it/gateway/bonjour)
