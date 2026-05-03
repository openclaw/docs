---
read_when:
    - Implementazione o modifica del rilevamento/annuncio Bonjour
    - Regolazione delle modalità di connessione remota (diretta vs SSH)
    - Progettazione dell'individuazione dei Node + associazione per Node remoti
summary: Individuazione dei Node e trasporti (Bonjour, Tailscale, SSH) per trovare il Gateway
title: Rilevamento e trasporti
x-i18n:
    generated_at: "2026-05-03T21:33:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41a5ed7a910ae4bbdfa21a81882c3b1af0c16622fa20a5e616b666390dccdc9c
    source_path: gateway/discovery.md
    workflow: 16
---

# Discovery e trasporti

OpenClaw ha due problemi distinti che in superficie sembrano simili:

1. **Controllo remoto dell’operatore**: l’app della barra dei menu di macOS che controlla un Gateway in esecuzione altrove.
2. **Associazione dei Node**: iOS/Android (e Node futuri) che trovano un Gateway e si associano in modo sicuro.

L’obiettivo del design è mantenere tutto il rilevamento/la pubblicità di rete nel **Node Gateway** (`openclaw gateway`) e mantenere i client (app Mac, iOS) come consumer.

## Termini

- **Gateway**: un singolo processo Gateway a esecuzione prolungata che possiede lo stato (sessioni, associazione, registro dei Node) ed esegue i canali. La maggior parte delle configurazioni ne usa uno per host; sono possibili configurazioni isolate con più Gateway.
- **Gateway WS (piano di controllo)**: l’endpoint WebSocket su `127.0.0.1:18789` per impostazione predefinita; può essere associato a LAN/tailnet tramite `gateway.bind`.
- **Trasporto WS diretto**: un endpoint Gateway WS esposto a LAN/tailnet (senza SSH).
- **Trasporto SSH (fallback)**: controllo remoto tramite forwarding di `127.0.0.1:18789` su SSH.
- **Bridge TCP legacy (rimosso)**: trasporto dei Node precedente (vedi
  [Protocollo bridge](/it/gateway/bridge-protocol)); non viene più pubblicizzato per
  il rilevamento e non fa più parte delle build correnti.

Dettagli del protocollo:

- [Protocollo Gateway](/it/gateway/protocol)
- [Protocollo bridge (legacy)](/it/gateway/bridge-protocol)

## Perché manteniamo sia "diretto" sia SSH

- **WS diretto** offre la migliore UX sulla stessa rete e all’interno di una tailnet:
  - rilevamento automatico sulla LAN tramite Bonjour
  - token di associazione + ACL posseduti dal Gateway
  - nessun accesso shell richiesto; la superficie del protocollo può restare ristretta e verificabile
- **SSH** resta il fallback universale:
  - funziona ovunque tu abbia accesso SSH (anche tra reti non correlate)
  - resiste ai problemi multicast/mDNS
  - non richiede nuove porte in ingresso oltre a SSH

## Input di rilevamento (come i client apprendono dove si trova il Gateway)

### 1) Rilevamento Bonjour / DNS-SD

Bonjour multicast è best-effort e non attraversa le reti. OpenClaw può anche sfogliare lo
stesso beacon del Gateway tramite un dominio DNS-SD wide-area configurato, quindi il rilevamento può coprire:

- `local.` sulla stessa LAN
- un dominio DNS-SD unicast configurato per il rilevamento cross-network

Direzione prevista:

- Il **Gateway** pubblicizza il proprio endpoint WS tramite Bonjour quando il Plugin
  `bonjour` incluso è abilitato. Il Plugin si avvia automaticamente sugli host macOS ed è
  opt-in altrove.
- I client sfogliano e mostrano un elenco “scegli un Gateway”, quindi memorizzano l’endpoint scelto.

Risoluzione dei problemi e dettagli del beacon: [Bonjour](/it/gateway/bonjour).

#### Dettagli del beacon di servizio

- Tipi di servizio:
  - `_openclaw-gw._tcp` (beacon del trasporto Gateway)
- Chiavi TXT (non segrete):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nome visualizzato configurato dall’operatore)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (solo quando TLS è abilitato)
  - `gatewayTlsSha256=<sha256>` (solo quando TLS è abilitato e l’impronta è disponibile)
  - `canvasPort=<port>` (porta dell’host canvas; attualmente uguale a `gatewayPort` quando l’host canvas è abilitato)
  - `tailnetDns=<magicdns>` (suggerimento opzionale; rilevato automaticamente quando Tailscale è disponibile)
  - `sshPort=<port>` (solo modalità completa mDNS; DNS-SD wide-area può ometterla, nel qual caso i valori predefiniti SSH restano `22`)
  - `cliPath=<path>` (solo modalità completa mDNS; DNS-SD wide-area la scrive comunque come suggerimento di installazione remota)

Note di sicurezza:

- I record TXT Bonjour/mDNS sono **non autenticati**. I client devono trattare i valori TXT solo come suggerimenti UX.
- Il routing (host/porta) dovrebbe preferire l’**endpoint di servizio risolto** (SRV + A/AAAA) rispetto a `lanHost`, `tailnetDns` o `gatewayPort` forniti da TXT.
- Il pinning TLS non deve mai consentire a un `gatewayTlsSha256` pubblicizzato di sostituire un pin memorizzato in precedenza.
- I Node iOS/Android dovrebbero richiedere una conferma esplicita “considera affidabile questa impronta” prima di memorizzare un primo pin (verifica out-of-band) ogni volta che la route scelta è basata su TLS/sicura.

Abilitare/disabilitare/sovrascrivere:

- `openclaw plugins enable bonjour` abilita la pubblicità multicast LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` disabilita la pubblicità.
- Quando il Plugin Bonjour è abilitato e `OPENCLAW_DISABLE_BONJOUR` non è impostato,
  Bonjour pubblicizza sugli host normali e si disabilita automaticamente dentro i container rilevati.
  L’avvio del Gateway macOS con configurazione vuota abilita automaticamente il Plugin; i deployment Linux,
  Windows e containerizzati richiedono l’abilitazione esplicita.
  Usa `0` solo su host, macvlan o un’altra rete compatibile con mDNS; usa `1` per
  forzare la disabilitazione.
- `gateway.bind` in `~/.openclaw/openclaw.json` controlla la modalità di bind del Gateway.
- `OPENCLAW_SSH_PORT` sovrascrive la porta SSH pubblicizzata quando viene emesso `sshPort`.
- `OPENCLAW_TAILNET_DNS` pubblica un suggerimento `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` sovrascrive il percorso CLI pubblicizzato.

### 2) Tailnet (cross-network)

Per configurazioni in stile Londra/Vienna, Bonjour non aiuta. Il target “diretto” consigliato è:

- nome Tailscale MagicDNS (preferito) oppure un IP tailnet stabile.

Se il Gateway può rilevare che è in esecuzione sotto Tailscale, pubblica `tailnetDns` come suggerimento opzionale per i client (inclusi i beacon wide-area).

L’app macOS ora preferisce i nomi MagicDNS agli IP Tailscale grezzi per il rilevamento del Gateway. Questo migliora l’affidabilità quando gli IP tailnet cambiano (per esempio dopo riavvii dei Node o riassegnazione CGNAT), perché i nomi MagicDNS risolvono automaticamente all’IP corrente.

Per l’associazione dei Node mobili, i suggerimenti di rilevamento non allentano la sicurezza del trasporto sulle route tailnet/pubbliche:

- iOS/Android richiedono comunque un percorso di connessione sicuro al primo utilizzo su tailnet/pubblico (`wss://` o Tailscale Serve/Funnel).
- Un IP tailnet grezzo rilevato è un suggerimento di routing, non un’autorizzazione a usare `ws://` remoto in chiaro.
- La connessione diretta `ws://` su LAN privata resta supportata.
- Se vuoi il percorso Tailscale più semplice per i Node mobili, usa Tailscale Serve in modo che rilevamento e codice di configurazione risolvano entrambi allo stesso endpoint MagicDNS sicuro.

### 3) Target manuale / SSH

Quando non c’è una route diretta (o il diretto è disabilitato), i client possono sempre connettersi tramite SSH inoltrando la porta del Gateway di loopback.

Vedi [Accesso remoto](/it/gateway/remote).

## Selezione del trasporto (criterio del client)

Comportamento consigliato del client:

1. Se un endpoint diretto associato è configurato e raggiungibile, usalo.
2. Altrimenti, se il rilevamento trova un Gateway su `local.` o sul dominio wide-area configurato, offri una scelta “Usa questo Gateway” con un solo tocco e salvala come endpoint diretto.
3. Altrimenti, se è configurato un DNS/IP tailnet, prova il diretto.
   Per i Node mobili su route tailnet/pubbliche, diretto significa un endpoint sicuro, non `ws://` remoto in chiaro.
4. Altrimenti, passa a SSH come fallback.

## Associazione + autenticazione (trasporto diretto)

Il Gateway è la fonte di verità per l’ammissione di Node/client.

- Le richieste di associazione vengono create/approvate/rifiutate nel Gateway (vedi [Associazione Gateway](/it/gateway/pairing)).
- Il Gateway applica:
  - autenticazione (token / coppia di chiavi)
  - ambiti/ACL (il Gateway non è un proxy grezzo verso ogni metodo)
  - limiti di frequenza

## Responsabilità per componente

- **Gateway**: pubblicizza beacon di rilevamento, possiede le decisioni di associazione e ospita l’endpoint WS.
- **App macOS**: ti aiuta a scegliere un Gateway, mostra prompt di associazione e usa SSH solo come fallback.
- **Node iOS/Android**: sfogliano Bonjour per comodità e si connettono al Gateway WS associato.

## Correlati

- [Accesso remoto](/it/gateway/remote)
- [Tailscale](/it/gateway/tailscale)
- [Rilevamento Bonjour](/it/gateway/bonjour)
