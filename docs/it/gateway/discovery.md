---
read_when:
    - Implementazione o modifica del rilevamento e della pubblicizzazione Bonjour
    - Regolazione delle modalità di connessione remota (diretta o tramite SSH)
    - Progettazione del rilevamento e dell'associazione dei Node remoti
summary: Rilevamento dei Node e trasporti (Bonjour, Tailscale, SSH) per individuare il Gateway
title: Rilevamento e trasporti
x-i18n:
    generated_at: "2026-07-12T07:03:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw presenta due problemi di rilevamento correlati ma distinti:

1. **Controllo remoto dell'operatore**: l'app della barra dei menu di macOS che controlla un Gateway in esecuzione altrove.
2. **Associazione dei Node**: iOS/Android (e i futuri Node) che individuano un Gateway e vi si associano in modo sicuro.

Tutto il rilevamento e l'annuncio in rete risiedono nel **Gateway dei Node**
(`openclaw gateway`); i client (app Mac, iOS) sono solo utilizzatori.

## Terminologia

- **Gateway**: un singolo processo a esecuzione prolungata che gestisce lo stato (sessioni,
  associazione, registro dei Node) ed esegue i canali. La maggior parte delle configurazioni ne utilizza uno per host;
  sono possibili configurazioni isolate con più Gateway.
- **WS del Gateway (piano di controllo)**: l'endpoint WebSocket su `127.0.0.1:18789`
  per impostazione predefinita; collegalo alla LAN/tailnet tramite `gateway.bind`.
- **Trasporto WS diretto**: un endpoint WS del Gateway accessibile dalla LAN/tailnet (senza SSH).
- **Trasporto SSH (ripiego)**: controllo remoto tramite inoltro di
  `127.0.0.1:18789` su SSH.
- **Bridge TCP precedente (rimosso)**: trasporto dei Node meno recente (consulta
  [Protocollo Bridge](/it/gateway/bridge-protocol)); non viene più annunciato per
  il rilevamento e non fa più parte delle build attuali.

Dettagli dei protocolli: [Protocollo Gateway](/it/gateway/protocol),
[Protocollo Bridge (precedente)](/it/gateway/bridge-protocol).

## Perché esistono sia la connessione diretta sia SSH

- **WS diretto** offre la migliore esperienza utente sulla stessa rete e all'interno di una tailnet: rilevamento
  automatico sulla LAN tramite Bonjour, token di associazione e ACL gestiti dal Gateway,
  senza richiedere l'accesso alla shell.
- **SSH** è il ripiego universale: funziona ovunque sia disponibile l'accesso SSH, anche
  tra reti non correlate, non risente dei problemi di multicast/mDNS e non richiede
  nuove porte in ingresso oltre a quella SSH.

## Origini del rilevamento

### 1) Bonjour / DNS-SD

Il multicast Bonjour funziona secondo il principio del massimo sforzo e non attraversa le reti. OpenClaw
supporta inoltre la ricerca dello stesso segnale del Gateway tramite un dominio DNS-SD
ad ampio raggio configurato, consentendo al rilevamento di coprire sia `local.` sulla stessa LAN,
sia un dominio DNS-SD unicast configurato per il rilevamento tra reti diverse.

Il **Gateway** annuncia il proprio endpoint WS tramite Bonjour quando il Plugin
`bonjour` incluso è abilitato; i client effettuano la ricerca e mostrano un elenco per la scelta del Gateway,
quindi memorizzano l'endpoint selezionato.

Risoluzione dei problemi e dettagli sul segnale: [Bonjour](/it/gateway/bonjour).

#### Dettagli del segnale del servizio

- Tipo di servizio: `_openclaw-gw._tcp` (segnale del trasporto Gateway).
- Chiavi TXT (non riservate):

  | Chiave                      | Note                                                                                                                                                             |
  | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | Sempre presente.                                                                                                                                                 |
  | `transport=gateway`         | Sempre presente.                                                                                                                                                 |
  | `displayName=<name>`        | Nome visualizzato configurato dall'operatore.                                                                                                                     |
  | `lanHost=<hostname>.local`  | Solo per l'annunciatore mDNS della LAN; non viene scritto dal DNS-SD ad ampio raggio.                                                                              |
  | `gatewayPort=18789`         | Porta WS + HTTP del Gateway.                                                                                                                                     |
  | `gatewayTls=1`              | Solo quando TLS è abilitato.                                                                                                                                     |
  | `gatewayTlsSha256=<sha256>` | Solo quando TLS è abilitato ed è disponibile un'impronta digitale.                                                                                               |
  | `tailnetDns=<magicdns>`     | Indicazione facoltativa; rilevata automaticamente quando Tailscale è disponibile.                                                                                |
  | `sshPort=<port>`            | Presente solo quando `discovery.mdns.mode="full"`; omessa (SSH usa per impostazione predefinita `22`) nella modalità predefinita `"minimal"`, sia nell'annunciatore LAN sia nel DNS-SD ad ampio raggio. |
  | `cliPath=<path>`            | Stessa condizione `discovery.mdns.mode="full"` di `sshPort`; indicazione per l'installazione remota relativa al percorso della CLI.                               |

  Nel contratto di rilevamento del Plugin è definita una chiave TXT `canvasPort` per una
  futura porta host del canvas, ma nessun percorso di codice attuale imposta un valore, pertanto
  al momento non viene mai emessa.

Note sulla sicurezza:

- I record TXT Bonjour/mDNS **non sono autenticati**. I client devono considerare i valori TXT
  esclusivamente come indicazioni per l'esperienza utente.
- Per l'instradamento (host/porta) si dovrebbe preferire l'**endpoint del servizio risolto**
  (SRV + A/AAAA) rispetto a `lanHost`, `tailnetDns` o `gatewayPort` forniti tramite TXT.
- Il blocco TLS non deve mai consentire a un valore `gatewayTlsSha256` annunciato di sostituire
  un blocco memorizzato in precedenza.
- I Node iOS/Android dovrebbero richiedere una conferma esplicita "considera attendibile questa impronta digitale"
  prima di memorizzare un blocco per la prima volta (verifica fuori banda)
  ogni volta che il percorso selezionato è sicuro/basato su TLS.

Abilitazione, disabilitazione e sostituzione:

- `openclaw plugins enable bonjour` abilita l'annuncio multicast sulla LAN.
- `discovery.mdns.mode` in `openclaw.json` controlla la trasmissione mDNS:
  `"minimal"` (impostazione predefinita), `"full"` (aggiunge `cliPath`/`sshPort` sia al segnale
  LAN sia a qualsiasi zona DNS-SD ad ampio raggio) oppure `"off"` (disabilita mDNS).
- `OPENCLAW_DISABLE_BONJOUR=1` forza la disabilitazione dell'annuncio; `discovery.mdns.mode="off"`
  lo disabilita indipendentemente. `OPENCLAW_DISABLE_BONJOUR=0` è un'abilitazione
  esplicita che prevale sulla disabilitazione automatica del Plugin all'interno di un container rilevato
  (Docker, containerd, Kubernetes, LXC); non prevale su
  `discovery.mdns.mode="off"`. Il Plugin `bonjour` incluso si avvia automaticamente sugli
  host macOS (`enabledByDefaultOnPlatforms: ["darwin"]`) e si disabilita automaticamente
  all'interno dei container rilevati; le distribuzioni Linux, Windows e altre distribuzioni
  containerizzate richiedono l'esecuzione esplicita di `plugins enable bonjour`.
- `gateway.bind` in `~/.openclaw/openclaw.json` controlla la modalità di associazione del Gateway.
- `OPENCLAW_SSH_PORT` sostituisce la porta SSH annunciata (ha effetto solo
  quando `discovery.mdns.mode="full"`).
- `OPENCLAW_TAILNET_DNS` pubblica un'indicazione `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` sostituisce il percorso della CLI annunciato.

### 2) Tailnet (tra reti diverse)

Per i Gateway su reti fisiche diverse, Bonjour non è utile. La destinazione diretta
consigliata è un nome MagicDNS di Tailscale (preferibile) o un
IP stabile della tailnet.

Se il Gateway rileva di essere in esecuzione sotto Tailscale, pubblica
`tailnetDns` come indicazione facoltativa per i client (inclusi i segnali ad ampio raggio).
L'app macOS preferisce i nomi MagicDNS agli indirizzi IP Tailscale non elaborati per il
rilevamento del Gateway, che rimane affidabile quando cambiano gli IP della tailnet (riavvii dei Node,
riassegnazione CGNAT), poiché MagicDNS risolve automaticamente l'IP corrente.

Per l'associazione dei Node mobili, le indicazioni di rilevamento non riducono mai la sicurezza del trasporto sui
percorsi tailnet/pubblici:

- iOS/Android richiedono comunque un percorso di connessione tailnet/pubblico iniziale sicuro
  (`wss://` o Tailscale Serve/Funnel).
- Un IP tailnet non elaborato rilevato è un'indicazione di instradamento, non un'autorizzazione a utilizzare
  `ws://` remoto non cifrato.
- La connessione diretta `ws://` sulla LAN privata rimane supportata.
- Per il percorso Tailscale più semplice sui Node mobili, usa Tailscale Serve affinché
  sia il rilevamento sia la configurazione vengano risolti nello stesso endpoint MagicDNS sicuro.

### 3) Destinazione manuale / SSH

Quando non esiste un percorso diretto (o la connessione diretta è disabilitata), i client possono sempre
connettersi tramite SSH inoltrando la porta del Gateway su local loopback. Consulta
[Accesso remoto](/it/gateway/remote).

## Selezione del trasporto (criterio del client)

1. Se è configurato e raggiungibile un endpoint diretto associato, utilizzalo.
2. Altrimenti, se il rilevamento individua un Gateway su `local.` o nel dominio ad ampio raggio
   configurato, proponi una scelta "Usa questo Gateway" con un solo tocco e salvalo come
   endpoint diretto.
3. Altrimenti, se è configurato un DNS/IP della tailnet, prova la connessione diretta. Per i Node mobili sui
   percorsi tailnet/pubblici, connessione diretta significa un endpoint sicuro, non
   `ws://` remoto non cifrato.
4. Altrimenti, ripiega su SSH.

## Associazione e autenticazione (trasporto diretto)

Il Gateway è la fonte autorevole per l'ammissione di Node/client:

- Le richieste di associazione vengono create/approvate/rifiutate nel Gateway (consulta
  [Associazione del Gateway](/it/gateway/pairing)).
- Il Gateway applica l'autenticazione (token/coppia di chiavi), gli ambiti/le ACL (non è un proxy
  non elaborato verso ogni metodo) e i limiti di frequenza.

## Responsabilità per componente

- **Gateway**: annuncia i segnali di rilevamento, gestisce le decisioni di associazione, ospita
  l'endpoint WS.
- **App macOS**: aiuta a scegliere un Gateway, mostra le richieste di associazione, usa SSH
  solo come ripiego.
- **Node iOS/Android**: cercano Bonjour per comodità e si connettono al
  WS del Gateway associato.

## Contenuti correlati

- [Accesso remoto](/it/gateway/remote)
- [Tailscale](/it/gateway/tailscale)
- [Rilevamento Bonjour](/it/gateway/bonjour)
