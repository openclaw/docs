---
read_when:
    - Stai implementando o modificando il rilevamento/la pubblicazione Bonjour
    - Stai regolando le modalità di connessione remota (diretta vs SSH)
    - Stai progettando il rilevamento dei nodi + il pairing per nodi remoti
summary: Rilevamento dei nodi e trasporti (Bonjour, Tailscale, SSH) per trovare il gateway
title: Rilevamento e trasporti
x-i18n:
    generated_at: "2026-04-05T13:51:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: e76cca9279ca77b55e30d6e746f6325e5644134ef06b9c58f2cf3d793d092685
    source_path: gateway/discovery.md
    workflow: 15
---

# Rilevamento e trasporti

OpenClaw ha due problemi distinti che in superficie sembrano simili:

1. **Controllo remoto dell'operatore**: l'app per la barra dei menu di macOS che controlla un gateway in esecuzione altrove.
2. **Pairing del nodo**: iOS/Android (e futuri nodi) che trovano un gateway e si associano in modo sicuro.

L'obiettivo progettuale è mantenere tutto il rilevamento/la pubblicazione di rete nel **Node Gateway** (`openclaw gateway`) e mantenere i client (app Mac, iOS) come consumer.

## Termini

- **Gateway**: un singolo processo gateway a lunga esecuzione che possiede lo stato (sessioni, pairing, registro dei nodi) ed esegue i canali. La maggior parte delle configurazioni ne usa uno per host; sono possibili configurazioni multi-gateway isolate.
- **Gateway WS (piano di controllo)**: l'endpoint WebSocket su `127.0.0.1:18789` per impostazione predefinita; può essere associato a LAN/tailnet tramite `gateway.bind`.
- **Trasporto WS diretto**: un endpoint Gateway WS esposto verso LAN/tailnet (senza SSH).
- **Trasporto SSH (fallback)**: controllo remoto inoltrando `127.0.0.1:18789` tramite SSH.
- **Bridge TCP legacy (rimosso)**: vecchio trasporto dei nodi (vedi
  [Protocollo bridge](/gateway/bridge-protocol)); non viene più pubblicizzato per il
  rilevamento e non fa più parte delle build correnti.

Dettagli del protocollo:

- [Protocollo Gateway](/gateway/protocol)
- [Protocollo bridge (legacy)](/gateway/bridge-protocol)

## Perché manteniamo sia il "diretto" sia SSH

- **WS diretto** è la UX migliore sulla stessa rete e all'interno di una tailnet:
  - rilevamento automatico su LAN tramite Bonjour
  - token di pairing + ACL gestiti dal gateway
  - nessun accesso shell richiesto; la superficie del protocollo può restare ristretta e verificabile
- **SSH** rimane il fallback universale:
  - funziona ovunque tu abbia accesso SSH (anche tra reti non correlate)
  - resiste ai problemi di multicast/mDNS
  - non richiede nuove porte in ingresso oltre a SSH

## Input di rilevamento (come i client imparano dove si trova il gateway)

### 1) Rilevamento Bonjour / DNS-SD

Il multicast Bonjour è best effort e non attraversa le reti. OpenClaw può anche esplorare lo
stesso beacon del gateway tramite un dominio DNS-SD wide-area configurato, quindi il rilevamento può coprire:

- `local.` sulla stessa LAN
- un dominio DNS-SD unicast configurato per il rilevamento tra reti

Direzione prevista:

- Il **gateway** pubblicizza il suo endpoint WS tramite Bonjour.
- I client lo esplorano e mostrano un elenco “scegli un gateway”, quindi memorizzano l'endpoint selezionato.

Dettagli su risoluzione dei problemi e beacon: [Bonjour](/gateway/bonjour).

#### Dettagli del beacon di servizio

- Tipi di servizio:
  - `_openclaw-gw._tcp` (beacon di trasporto gateway)
- Chiavi TXT (non segrete):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nome descrittivo configurato dall'operatore)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (solo quando TLS è abilitato)
  - `gatewayTlsSha256=<sha256>` (solo quando TLS è abilitato e l'impronta digitale è disponibile)
  - `canvasPort=<port>` (porta dell'host canvas; attualmente uguale a `gatewayPort` quando l'host canvas è abilitato)
  - `tailnetDns=<magicdns>` (suggerimento facoltativo; rilevato automaticamente quando Tailscale è disponibile)
  - `sshPort=<port>` (solo modalità completa mDNS; DNS-SD wide-area può ometterlo, nel qual caso le impostazioni predefinite SSH restano `22`)
  - `cliPath=<path>` (solo modalità completa mDNS; DNS-SD wide-area lo scrive comunque come suggerimento per l'installazione remota)

Note di sicurezza:

- I record TXT Bonjour/mDNS sono **non autenticati**. I client devono trattare i valori TXT solo come suggerimenti UX.
- Il routing (host/porta) dovrebbe preferire l'**endpoint del servizio risolto** (SRV + A/AAAA) rispetto a `lanHost`, `tailnetDns` o `gatewayPort` forniti via TXT.
- Il pinning TLS non deve mai consentire a un `gatewayTlsSha256` pubblicizzato di sovrascrivere un pin memorizzato in precedenza.
- I nodi iOS/Android dovrebbero richiedere una conferma esplicita “fidati di questa impronta digitale” prima di memorizzare un pin al primo utilizzo (verifica fuori banda) ogni volta che il percorso scelto è sicuro/basato su TLS.

Disabilitazione/override:

- `OPENCLAW_DISABLE_BONJOUR=1` disabilita la pubblicazione.
- `gateway.bind` in `~/.openclaw/openclaw.json` controlla la modalità di bind del Gateway.
- `OPENCLAW_SSH_PORT` sostituisce la porta SSH pubblicizzata quando viene emesso `sshPort`.
- `OPENCLAW_TAILNET_DNS` pubblica un suggerimento `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` sostituisce il percorso CLI pubblicizzato.

### 2) Tailnet (tra reti)

Per configurazioni in stile Londra/Vienna, Bonjour non aiuta. Il target “diretto” consigliato è:

- nome Tailscale MagicDNS (preferito) o un IP tailnet stabile.

Se il gateway riesce a rilevare di essere in esecuzione sotto Tailscale, pubblica `tailnetDns` come suggerimento facoltativo per i client (inclusi i beacon wide-area).

L'app macOS ora preferisce i nomi MagicDNS agli IP Tailscale grezzi per il rilevamento del gateway. Questo migliora l'affidabilità quando gli IP tailnet cambiano (ad esempio dopo riavvii dei nodi o riassegnazioni CGNAT), perché i nomi MagicDNS si risolvono automaticamente nell'IP corrente.

Per il pairing dei nodi mobili, i suggerimenti di rilevamento non attenuano la sicurezza del trasporto sui percorsi tailnet/pubblici:

- iOS/Android richiedono comunque un percorso di prima connessione tailnet/pubblico sicuro (`wss://` o Tailscale Serve/Funnel).
- Un IP tailnet grezzo rilevato è un suggerimento di routing, non un'autorizzazione a usare `ws://` remoto in chiaro.
- La connessione diretta `ws://` sulla LAN privata resta supportata.
- Se vuoi il percorso Tailscale più semplice per i nodi mobili, usa Tailscale Serve così sia il rilevamento sia il codice di configurazione risolvono nello stesso endpoint MagicDNS sicuro.

### 3) Target manuale / SSH

Quando non esiste un percorso diretto (o il diretto è disabilitato), i client possono sempre connettersi tramite SSH inoltrando la porta loopback del gateway.

Vedi [Accesso remoto](/gateway/remote).

## Selezione del trasporto (criterio del client)

Comportamento client consigliato:

1. Se è configurato un endpoint diretto associato ed è raggiungibile, usalo.
2. Altrimenti, se il rilevamento trova un gateway su `local.` o sul dominio wide-area configurato, offri una scelta “Usa questo gateway” con un tocco e salvalo come endpoint diretto.
3. Altrimenti, se è configurato un DNS/IP tailnet, prova il diretto.
   Per i nodi mobili su percorsi tailnet/pubblici, diretto significa un endpoint sicuro, non `ws://` remoto in chiaro.
4. Altrimenti, ripiega su SSH.

## Pairing + autenticazione (trasporto diretto)

Il gateway è la fonte di verità per l'ammissione di nodi/client.

- Le richieste di pairing vengono create/approvate/rifiutate nel gateway (vedi [Pairing del Gateway](/gateway/pairing)).
- Il gateway applica:
  - autenticazione (token / coppia di chiavi)
  - scope/ACL (il gateway non è un proxy grezzo verso ogni metodo)
  - limiti di velocità

## Responsabilità per componente

- **Gateway**: pubblicizza i beacon di rilevamento, gestisce le decisioni di pairing e ospita l'endpoint WS.
- **App macOS**: ti aiuta a scegliere un gateway, mostra prompt di pairing e usa SSH solo come fallback.
- **Nodi iOS/Android**: esplorano Bonjour come comodità e si connettono al Gateway WS associato.
