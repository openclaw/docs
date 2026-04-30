---
read_when:
    - Implementazione o modifica del rilevamento/annuncio Bonjour
    - Regolare le modalità di connessione remota (diretta vs SSH)
    - Progettazione del rilevamento dei Node + abbinamento per i Node remoti
summary: Individuazione dei Node e trasporti (Bonjour, Tailscale, SSH) per trovare il Gateway
title: Rilevamento e trasporti
x-i18n:
    generated_at: "2026-04-30T08:51:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c396e6e07808e2571c6d7f539922b94443adbf39339027e6e962596c6f13deaa
    source_path: gateway/discovery.md
    workflow: 16
---

# Discovery e trasporti

OpenClaw ha due problemi distinti che in superficie sembrano simili:

1. **Controllo remoto dell'operatore**: l'app della barra dei menu di macOS che controlla un Gateway in esecuzione altrove.
2. **Abbinamento dei Node**: iOS/Android (e Node futuri) che trovano un Gateway e si abbinano in modo sicuro.

L'obiettivo di progettazione è mantenere tutta la discovery/advertising di rete nel **Node Gateway** (`openclaw gateway`) e mantenere i client (app Mac, iOS) come consumer.

## Termini

- **Gateway**: un singolo processo Gateway a lunga esecuzione che possiede lo stato (sessioni, abbinamento, registro dei Node) ed esegue i canali. La maggior parte delle configurazioni ne usa uno per host; sono possibili configurazioni multi-Gateway isolate.
- **Gateway WS (piano di controllo)**: l'endpoint WebSocket su `127.0.0.1:18789` per impostazione predefinita; può essere vincolato a LAN/tailnet tramite `gateway.bind`.
- **Trasporto WS diretto**: un endpoint Gateway WS esposto verso LAN/tailnet (senza SSH).
- **Trasporto SSH (fallback)**: controllo remoto tramite inoltro di `127.0.0.1:18789` su SSH.
- **Bridge TCP legacy (rimosso)**: trasporto Node precedente (vedi
  [Protocollo bridge](/it/gateway/bridge-protocol)); non viene più pubblicizzato per la
  discovery e non fa più parte delle build attuali.

Dettagli del protocollo:

- [Protocollo Gateway](/it/gateway/protocol)
- [Protocollo bridge (legacy)](/it/gateway/bridge-protocol)

## Perché manteniamo sia "diretto" sia SSH

- **WS diretto** offre la migliore UX sulla stessa rete e all'interno di una tailnet:
  - discovery automatica sulla LAN tramite Bonjour
  - token di abbinamento + ACL posseduti dal Gateway
  - nessun accesso shell richiesto; la superficie del protocollo può restare ristretta e verificabile
- **SSH** resta il fallback universale:
  - funziona ovunque tu abbia accesso SSH (anche tra reti non correlate)
  - resiste ai problemi multicast/mDNS
  - non richiede nuove porte in ingresso oltre a SSH

## Input di discovery (come i client apprendono dove si trova il Gateway)

### 1) Discovery Bonjour / DNS-SD

Bonjour multicast è best-effort e non attraversa le reti. OpenClaw può anche cercare lo
stesso beacon Gateway tramite un dominio DNS-SD wide-area configurato, quindi la discovery può coprire:

- `local.` sulla stessa LAN
- un dominio DNS-SD unicast configurato per la discovery tra reti

Direzione target:

- Il **Gateway** pubblicizza il suo endpoint WS tramite Bonjour.
- I client cercano e mostrano un elenco “scegli un Gateway”, quindi salvano l'endpoint scelto.

Dettagli su troubleshooting e beacon: [Bonjour](/it/gateway/bonjour).

#### Dettagli del beacon di servizio

- Tipi di servizio:
  - `_openclaw-gw._tcp` (beacon di trasporto Gateway)
- Chiavi TXT (non segrete):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nome visualizzato configurato dall'operatore)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (solo quando TLS è abilitato)
  - `gatewayTlsSha256=<sha256>` (solo quando TLS è abilitato e l'impronta digitale è disponibile)
  - `canvasPort=<port>` (porta del canvas host; attualmente la stessa di `gatewayPort` quando il canvas host è abilitato)
  - `tailnetDns=<magicdns>` (suggerimento opzionale; rilevato automaticamente quando Tailscale è disponibile)
  - `sshPort=<port>` (solo modalità mDNS completa; DNS-SD wide-area può ometterlo, nel qual caso i valori predefiniti SSH restano a `22`)
  - `cliPath=<path>` (solo modalità mDNS completa; DNS-SD wide-area lo scrive comunque come suggerimento per l'installazione remota)

Note di sicurezza:

- I record TXT Bonjour/mDNS sono **non autenticati**. I client devono trattare i valori TXT solo come suggerimenti UX.
- Il routing (host/porta) dovrebbe preferire l'**endpoint del servizio risolto** (SRV + A/AAAA) rispetto a `lanHost`, `tailnetDns` o `gatewayPort` forniti da TXT.
- Il pinning TLS non deve mai consentire a un `gatewayTlsSha256` pubblicizzato di sovrascrivere un pin salvato in precedenza.
- I Node iOS/Android dovrebbero richiedere una conferma esplicita “considera attendibile questa impronta digitale” prima di salvare un pin per la prima volta (verifica out-of-band) ogni volta che la route scelta è sicura/basata su TLS.

Disabilitazione/sovrascrittura:

- `OPENCLAW_DISABLE_BONJOUR=1` disabilita l'advertising.
- Quando `OPENCLAW_DISABLE_BONJOUR` non è impostato, Bonjour pubblicizza sugli host normali
  e si disabilita automaticamente dentro i container rilevati. Usa `0` solo su host, macvlan
  o un'altra rete compatibile con mDNS; usa `1` per forzare la disabilitazione.
- `gateway.bind` in `~/.openclaw/openclaw.json` controlla la modalità di bind del Gateway.
- `OPENCLAW_SSH_PORT` sovrascrive la porta SSH pubblicizzata quando viene emesso `sshPort`.
- `OPENCLAW_TAILNET_DNS` pubblica un suggerimento `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` sovrascrive il percorso CLI pubblicizzato.

### 2) Tailnet (tra reti)

Per configurazioni in stile Londra/Vienna, Bonjour non aiuta. Il target “diretto” consigliato è:

- nome MagicDNS Tailscale (preferito) o un IP tailnet stabile.

Se il Gateway riesce a rilevare che è in esecuzione sotto Tailscale, pubblica `tailnetDns` come suggerimento opzionale per i client (inclusi i beacon wide-area).

L'app macOS ora preferisce i nomi MagicDNS agli IP Tailscale grezzi per la discovery del Gateway. Questo migliora l'affidabilità quando gli IP tailnet cambiano (ad esempio dopo riavvii dei Node o riassegnazione CGNAT), perché i nomi MagicDNS si risolvono automaticamente nell'IP corrente.

Per l'abbinamento dei Node mobili, i suggerimenti di discovery non allentano la sicurezza del trasporto su route tailnet/pubbliche:

- iOS/Android richiedono comunque un percorso di connessione tailnet/pubblico sicuro per la prima volta (`wss://` o Tailscale Serve/Funnel).
- Un IP tailnet grezzo scoperto è un suggerimento di routing, non un permesso per usare `ws://` remoto in chiaro.
- La connessione diretta LAN privata `ws://` resta supportata.
- Se vuoi il percorso Tailscale più semplice per i Node mobili, usa Tailscale Serve in modo che discovery e codice di configurazione si risolvano entrambi nello stesso endpoint MagicDNS sicuro.

### 3) Target manuale / SSH

Quando non esiste una route diretta (o la modalità diretta è disabilitata), i client possono sempre connettersi tramite SSH inoltrando la porta Gateway di local loopback.

Vedi [Accesso remoto](/it/gateway/remote).

## Selezione del trasporto (criterio del client)

Comportamento consigliato del client:

1. Se è configurato e raggiungibile un endpoint diretto abbinato, usalo.
2. Altrimenti, se la discovery trova un Gateway su `local.` o sul dominio wide-area configurato, offri una scelta “Usa questo Gateway” con un tocco e salvala come endpoint diretto.
3. Altrimenti, se è configurato un DNS/IP tailnet, prova il collegamento diretto.
   Per i Node mobili su route tailnet/pubbliche, diretto significa un endpoint sicuro, non `ws://` remoto in chiaro.
4. Altrimenti, ripiega su SSH.

## Abbinamento + autenticazione (trasporto diretto)

Il Gateway è la fonte di verità per l'ammissione di Node/client.

- Le richieste di abbinamento vengono create/approvate/rifiutate nel Gateway (vedi [Abbinamento Gateway](/it/gateway/pairing)).
- Il Gateway applica:
  - autenticazione (token / coppia di chiavi)
  - ambiti/ACL (il Gateway non è un proxy grezzo verso ogni metodo)
  - limiti di frequenza

## Responsabilità per componente

- **Gateway**: pubblicizza beacon di discovery, possiede le decisioni di abbinamento e ospita l'endpoint WS.
- **App macOS**: ti aiuta a scegliere un Gateway, mostra prompt di abbinamento e usa SSH solo come fallback.
- **Node iOS/Android**: cercano Bonjour per comodità e si connettono al Gateway WS abbinato.

## Correlati

- [Accesso remoto](/it/gateway/remote)
- [Tailscale](/it/gateway/tailscale)
- [Discovery Bonjour](/it/gateway/bonjour)
