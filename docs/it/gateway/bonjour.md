---
read_when:
    - Risoluzione dei problemi di rilevamento Bonjour su macOS/iOS
    - Modifica dei tipi di servizio mDNS, dei record TXT o dell'esperienza utente di rilevamento
summary: Rilevamento + debug Bonjour/mDNS (beacon del Gateway, client e modalità di errore comuni)
title: Rilevamento Bonjour
x-i18n:
    generated_at: "2026-05-11T20:28:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03bd9403591a389c06d3131e4c110d4ccf711eee56cbe9a5c9baed2b6df8fb80
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw può usare Bonjour (mDNS / DNS-SD) per rilevare un Gateway attivo (endpoint WebSocket).
La navigazione multicast `local.` è una **comodità solo LAN**. Il plugin `bonjour`
incluso gestisce la pubblicità LAN. Si avvia automaticamente sugli host macOS ed è opzionale su
Linux, Windows e nelle distribuzioni containerizzate del Gateway. Per il rilevamento tra reti, lo stesso
beacon può anche essere pubblicato tramite un dominio DNS-SD wide-area configurato. Il rilevamento
rimane comunque best-effort e **non** sostituisce la connettività basata su SSH o Tailnet.

## Bonjour wide-area (DNS-SD unicast) su Tailscale

Se il nodo e il Gateway si trovano su reti diverse, mDNS multicast non attraverserà il
confine. Puoi mantenere la stessa UX di rilevamento passando a **DNS-SD unicast**
("Wide-Area Bonjour") su Tailscale.

Passaggi generali:

1. Esegui un server DNS sull'host del Gateway (raggiungibile tramite Tailnet).
2. Pubblica i record DNS-SD per `_openclaw-gw._tcp` sotto una zona dedicata
   (esempio: `openclaw.internal.`).
3. Configura lo **split DNS** di Tailscale in modo che il dominio scelto venga risolto tramite quel
   server DNS per i client (incluso iOS).

OpenClaw supporta qualsiasi dominio di rilevamento; `openclaw.internal.` è solo un esempio.
I nodi iOS/Android navigano sia `local.` sia il tuo dominio wide-area configurato.

### Configurazione Gateway (consigliata)

```json5
{
  gateway: { bind: "tailnet" }, // solo tailnet (consigliato)
  discovery: { wideArea: { enabled: true } }, // abilita la pubblicazione DNS-SD wide-area
}
```

### Configurazione una tantum del server DNS (host del Gateway)

```bash
openclaw dns setup --apply
```

Questo installa CoreDNS e lo configura per:

- ascoltare sulla porta 53 solo sulle interfacce Tailscale del Gateway
- servire il dominio scelto (esempio: `openclaw.internal.`) da `~/.openclaw/dns/<domain>.db`

Convalida da una macchina connessa alla tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Impostazioni DNS di Tailscale

Nella console di amministrazione Tailscale:

- Aggiungi un nameserver che punti all'IP tailnet del Gateway (UDP/TCP 53).
- Aggiungi lo split DNS in modo che il tuo dominio di rilevamento usi quel nameserver.

Quando i client accettano il DNS tailnet, i nodi iOS e il rilevamento CLI possono navigare
`_openclaw-gw._tcp` nel tuo dominio di rilevamento senza multicast.

### Sicurezza del listener Gateway (consigliata)

La porta WS del Gateway (predefinita `18789`) si associa di default a loopback. Per l'accesso LAN/tailnet,
associala esplicitamente e mantieni l'autenticazione abilitata.

Per configurazioni solo tailnet:

- Imposta `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json`.
- Riavvia il Gateway (o riavvia l'app della barra dei menu macOS).

## Cosa annuncia

Solo il Gateway annuncia `_openclaw-gw._tcp`. La pubblicità multicast LAN è
fornita dal plugin `bonjour` incluso quando il plugin è abilitato; la pubblicazione
DNS-SD wide-area rimane di proprietà del Gateway.

## Tipi di servizio

- `_openclaw-gw._tcp` - beacon di trasporto del Gateway (usato dai nodi macOS/iOS/Android).

## Chiavi TXT (suggerimenti non segreti)

Il Gateway annuncia piccoli suggerimenti non segreti per rendere comodi i flussi UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (solo quando TLS è abilitato)
- `gatewayTlsSha256=<sha256>` (solo quando TLS è abilitato e l'impronta è disponibile)
- `canvasPort=<port>` (solo quando l'host canvas è abilitato; attualmente uguale a `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (solo modalità mDNS completa, suggerimento opzionale quando Tailnet è disponibile)
- `sshPort=<port>` (solo modalità mDNS completa; DNS-SD wide-area può ometterlo)
- `cliPath=<path>` (solo modalità mDNS completa; DNS-SD wide-area lo scrive comunque come suggerimento per installazione remota)

Note di sicurezza:

- I record TXT Bonjour/mDNS **non sono autenticati**. I client non devono trattare TXT come routing autorevole.
- I client dovrebbero instradare usando l'endpoint di servizio risolto (SRV + A/AAAA). Tratta `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` solo come suggerimenti.
- Anche il targeting automatico SSH dovrebbe usare l'host del servizio risolto, non suggerimenti solo TXT.
- Il pinning TLS non deve mai consentire a un `gatewayTlsSha256` annunciato di sovrascrivere un pin precedentemente memorizzato.
- I nodi iOS/Android dovrebbero trattare le connessioni dirette basate sul rilevamento come **solo TLS** e richiedere una conferma esplicita dell'utente prima di considerare affidabile un'impronta vista per la prima volta.

## Debug su macOS

Strumenti integrati utili:

- Naviga le istanze:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Risolvi un'istanza (sostituisci `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Se la navigazione funziona ma la risoluzione non riesce, di solito stai incontrando una policy LAN o
un problema del resolver mDNS.

## Debug nei log del Gateway

Il Gateway scrive un file di log a rotazione (stampato all'avvio come
`gateway log file: ...`). Cerca le righe `bonjour:`, in particolare:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Il watchdog tratta gli stati attivi `probing`, `announcing` e le ridenominazioni recenti per conflitto come
stati in corso. Se il servizio non raggiunge mai `announced`, OpenClaw alla fine
ricrea l'advertiser e, dopo fallimenti ripetuti, disabilita Bonjour per quel
processo Gateway invece di ripubblicare l'annuncio all'infinito.

Bonjour usa l'hostname di sistema per l'host `.local` annunciato quando è una
label DNS valida. Se l'hostname di sistema contiene spazi, underscore o un altro
carattere non valido per una label DNS, OpenClaw ripiega su `openclaw.local`. Imposta
`OPENCLAW_MDNS_HOSTNAME=<name>` prima di avviare il Gateway quando ti serve una
label host esplicita.

## Debug sul nodo iOS

Il nodo iOS usa `NWBrowser` per rilevare `_openclaw-gw._tcp`.

Per acquisire i log:

- Settings → Gateway → Advanced → **Log di debug rilevamento**
- Settings → Gateway → Advanced → **Log di rilevamento** → riproduci → **Copia**

Il log include le transizioni di stato del browser e le modifiche del set di risultati.

## Quando abilitare Bonjour

Bonjour si avvia automaticamente per l'avvio del Gateway con configurazione vuota sugli host macOS perché
l'app locale e i nodi iOS/Android nelle vicinanze si basano comunemente sul rilevamento nella stessa LAN.

Abilita Bonjour esplicitamente quando il rilevamento automatico nella stessa LAN è utile su Linux,
Windows o un altro host non macOS:

```bash
openclaw plugins enable bonjour
```

Quando è abilitato, Bonjour usa `discovery.mdns.mode` per decidere quanti metadati TXT
pubblicare. La modalità predefinita è `minimal`; usa `full` solo quando i client locali hanno bisogno
dei suggerimenti `cliPath` o `sshPort`, e usa `off` per sopprimere il multicast LAN senza
modificare l'abilitazione del plugin.

## Quando disabilitare Bonjour

Lascia Bonjour disabilitato quando la pubblicità multicast LAN non è necessaria, non è disponibile
o è dannosa. I casi comuni sono server non macOS, networking bridge Docker,
WSL o una policy di rete che scarta il multicast mDNS. In questi ambienti il
Gateway è comunque raggiungibile tramite il suo URL pubblicato, SSH, Tailnet o DNS-SD
wide-area, ma il rilevamento automatico LAN non è affidabile.

Preferisci l'override di ambiente esistente quando il problema è circoscritto alla distribuzione:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Questo disabilita la pubblicità multicast LAN senza modificare la configurazione del plugin.
È sicuro per immagini Docker, file di servizio, script di avvio e debug una tantum
perché l'impostazione scompare quando lo fa l'ambiente.

Usa la configurazione del plugin quando vuoi intenzionalmente disattivare il plugin di rilevamento LAN
incluso per quella configurazione OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Insidie Docker

Il plugin Bonjour incluso disabilita automaticamente la pubblicità multicast LAN nei container rilevati
quando `OPENCLAW_DISABLE_BONJOUR` non è impostato. Le reti bridge Docker
di solito non inoltrano il multicast mDNS (`224.0.0.251:5353`) tra il container
e la LAN, quindi annunciare dal container raramente fa funzionare il rilevamento.

Insidie importanti:

- Bonjour si avvia automaticamente sugli host macOS ed è opzionale altrove. Lasciarlo
  disabilitato non arresta il Gateway; salta solo la pubblicità multicast LAN.
- Disabilitare Bonjour non modifica `gateway.bind`; Docker usa ancora di default
  `OPENCLAW_GATEWAY_BIND=lan` in modo che la porta host pubblicata possa funzionare.
- Disabilitare Bonjour non disabilita DNS-SD wide-area. Usa il rilevamento wide-area
  o Tailnet quando il Gateway e il nodo non sono sulla stessa LAN.
- Riutilizzare lo stesso `OPENCLAW_CONFIG_DIR` fuori da Docker non persiste la
  policy di disabilitazione automatica del container.
- Imposta `OPENCLAW_DISABLE_BONJOUR=0` solo per host networking, macvlan o un'altra
  rete in cui è noto che il multicast mDNS passa; impostalo a `1` per forzare la disabilitazione.

## Risoluzione dei problemi con Bonjour disabilitato

Se un nodo non rileva più automaticamente il Gateway dopo la configurazione Docker:

1. Conferma se il Gateway è in esecuzione in modalità automatica, forzata attiva o forzata disattiva:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Conferma che il Gateway stesso sia raggiungibile tramite la porta pubblicata:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Usa una destinazione diretta quando Bonjour è disabilitato:
   - UI di controllo o strumenti locali: `http://127.0.0.1:18789`
   - Client LAN: `http://<gateway-host>:18789`
   - Client tra reti: Tailnet MagicDNS, IP Tailnet, tunnel SSH o
     DNS-SD wide-area

4. Se hai abilitato deliberatamente il plugin Bonjour in Docker e forzato la pubblicità
   con `OPENCLAW_DISABLE_BONJOUR=0`, testa il multicast dall'host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Se la navigazione è vuota o i log del Gateway mostrano annullamenti ripetuti del watchdog ciao,
   ripristina `OPENCLAW_DISABLE_BONJOUR=1` e usa una route diretta o
   Tailnet.

## Modalità di errore comuni

- **Bonjour non attraversa le reti**: usa Tailnet o SSH.
- **Multicast bloccato**: alcune reti Wi-Fi disabilitano mDNS.
- **Advertiser bloccato in probing/announcing**: host con multicast bloccato,
  bridge container, WSL o churn delle interfacce possono lasciare l'advertiser ciao in uno
  stato non annunciato. OpenClaw riprova alcune volte e poi disabilita Bonjour
  per il processo Gateway corrente invece di riavviare l'advertiser all'infinito.
- **Networking bridge Docker**: Bonjour si disabilita automaticamente nei container rilevati.
  Imposta `OPENCLAW_DISABLE_BONJOUR=0` solo per host, macvlan o un'altra
  rete compatibile con mDNS.
- **Sospensione / churn delle interfacce**: macOS può perdere temporaneamente i risultati mDNS; riprova.
- **La navigazione funziona ma la risoluzione fallisce**: mantieni semplici i nomi delle macchine (evita emoji o
  punteggiatura), poi riavvia il Gateway. Il nome dell'istanza di servizio deriva dal
  nome host, quindi nomi eccessivamente complessi possono confondere alcuni resolver.

## Nomi di istanza con escape (`\032`)

Bonjour/DNS-SD spesso applica escape ai byte nei nomi delle istanze di servizio come sequenze decimali `\DDD`
(ad es. gli spazi diventano `\032`).

- Questo è normale a livello di protocollo.
- Le UI dovrebbero decodificare per la visualizzazione (iOS usa `BonjourEscapes.decode`).

## Abilitazione / disabilitazione / configurazione

- Gli host macOS avviano automaticamente per impostazione predefinita il plugin di rilevamento LAN incluso.
- `openclaw plugins enable bonjour` abilita il plugin di rilevamento LAN incluso sugli host in cui non è abilitato per impostazione predefinita.
- `openclaw plugins disable bonjour` disabilita la pubblicità multicast LAN disabilitando il plugin incluso.
- `OPENCLAW_DISABLE_BONJOUR=1` disabilita la pubblicità multicast LAN senza modificare la configurazione del plugin; i valori considerati veri accettati sono `1`, `true`, `yes` e `on` (precedente: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` forza l'attivazione della pubblicità multicast LAN, anche all'interno dei container rilevati; i valori considerati falsi accettati sono `0`, `false`, `no` e `off`.
- Quando il plugin Bonjour è abilitato e `OPENCLAW_DISABLE_BONJOUR` non è impostato, Bonjour pubblicizza sugli host normali e si disabilita automaticamente all'interno dei container rilevati.
- `gateway.bind` in `~/.openclaw/openclaw.json` controlla la modalità di bind del Gateway.
- `OPENCLAW_SSH_PORT` sovrascrive la porta SSH quando `sshPort` viene pubblicizzata (precedente: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` pubblica un suggerimento MagicDNS in TXT quando la modalità completa mDNS è abilitata (precedente: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` sovrascrive il percorso CLI pubblicizzato (precedente: `OPENCLAW_CLI_PATH`).

## Documentazione correlata

- Criteri di rilevamento e selezione del trasporto: [Rilevamento](/it/gateway/discovery)
- Abbinamento Node + approvazioni: [Abbinamento Gateway](/it/gateway/pairing)
