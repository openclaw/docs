---
read_when:
    - Risoluzione dei problemi di rilevamento Bonjour su macOS/iOS
    - Modifica dei tipi di servizio mDNS, dei record TXT o della UX di rilevamento
summary: Rilevamento Bonjour/mDNS e risoluzione dei problemi (annunci del Gateway, client e modalità di errore comuni)
title: Rilevamento Bonjour
x-i18n:
    generated_at: "2026-05-06T08:49:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7b7d029e6eb6bee90eb96e7ea169ecadf3bda6d969b2450349c5716a950e205
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw può usare Bonjour (mDNS / DNS-SD) per individuare un Gateway attivo (endpoint WebSocket).
La navigazione multicast `local.` è una **comodità solo LAN**. Il Plugin `bonjour`
incluso gestisce l'annuncio LAN. Si avvia automaticamente sugli host macOS ed è opzionale su
Linux, Windows e nelle distribuzioni Gateway containerizzate. Per l'individuazione tra reti diverse, lo stesso
beacon può anche essere pubblicato tramite un dominio DNS-SD wide-area configurato. L'individuazione
resta comunque best-effort e **non** sostituisce la connettività basata su SSH o Tailnet.

## Bonjour wide-area (DNS-SD unicast) su Tailscale

Se il nodo e il gateway sono su reti diverse, il multicast mDNS non oltrepasserà il
confine. Puoi mantenere la stessa esperienza di individuazione passando a **DNS-SD unicast**
("Wide-Area Bonjour") su Tailscale.

Passaggi ad alto livello:

1. Esegui un server DNS sull'host del gateway (raggiungibile tramite Tailnet).
2. Pubblica record DNS-SD per `_openclaw-gw._tcp` sotto una zona dedicata
   (esempio: `openclaw.internal.`).
3. Configura lo **split DNS** di Tailscale in modo che il dominio scelto venga risolto tramite quel
   server DNS per i client (incluso iOS).

OpenClaw supporta qualsiasi dominio di individuazione; `openclaw.internal.` è solo un esempio.
I nodi iOS/Android navigano sia `local.` sia il dominio wide-area configurato.

### Configurazione Gateway (consigliata)

```json5
{
  gateway: { bind: "tailnet" }, // solo tailnet (consigliato)
  discovery: { wideArea: { enabled: true } }, // abilita la pubblicazione DNS-SD wide-area
}
```

### Configurazione una tantum del server DNS (host del gateway)

```bash
openclaw dns setup --apply
```

Questo installa CoreDNS e lo configura per:

- ascoltare sulla porta 53 solo sulle interfacce Tailscale del gateway
- servire il dominio scelto (esempio: `openclaw.internal.`) da `~/.openclaw/dns/<domain>.db`

Convalida da una macchina connessa alla tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Impostazioni DNS di Tailscale

Nella console di amministrazione Tailscale:

- Aggiungi un nameserver che punti all'IP tailnet del gateway (UDP/TCP 53).
- Aggiungi lo split DNS in modo che il dominio di individuazione usi quel nameserver.

Quando i client accettano il DNS tailnet, i nodi iOS e l'individuazione CLI possono navigare
`_openclaw-gw._tcp` nel dominio di individuazione senza multicast.

### Sicurezza del listener Gateway (consigliata)

La porta WS del Gateway (predefinita `18789`) si associa a loopback per impostazione predefinita. Per l'accesso LAN/tailnet,
imposta esplicitamente il bind e mantieni l'autenticazione abilitata.

Per configurazioni solo tailnet:

- Imposta `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json`.
- Riavvia il Gateway (o riavvia l'app della barra menu macOS).

## Cosa annuncia

Solo il Gateway annuncia `_openclaw-gw._tcp`. L'annuncio multicast LAN è
fornito dal Plugin `bonjour` incluso quando il Plugin è abilitato; la pubblicazione
DNS-SD wide-area resta di proprietà del Gateway.

## Tipi di servizio

- `_openclaw-gw._tcp` - beacon di trasporto gateway (usato dai nodi macOS/iOS/Android).

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
- `sshPort=<port>` (solo modalità mDNS completa; DNS-SD wide-area potrebbe ometterlo)
- `cliPath=<path>` (solo modalità mDNS completa; DNS-SD wide-area lo scrive comunque come suggerimento per installazione remota)

Note di sicurezza:

- I record TXT Bonjour/mDNS sono **non autenticati**. I client non devono trattare TXT come routing autorevole.
- I client dovrebbero instradare usando l'endpoint di servizio risolto (SRV + A/AAAA). Tratta `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` solo come suggerimenti.
- Anche il targeting automatico SSH dovrebbe usare l'host di servizio risolto, non suggerimenti solo TXT.
- Il pinning TLS non deve mai permettere a un `gatewayTlsSha256` annunciato di sovrascrivere un pin memorizzato in precedenza.
- I nodi iOS/Android dovrebbero trattare le connessioni dirette basate sull'individuazione come **solo TLS** e richiedere una conferma esplicita dell'utente prima di fidarsi di una prima impronta.

## Debug su macOS

Strumenti integrati utili:

- Sfoglia le istanze:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Risolvi un'istanza (sostituisci `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Se la navigazione funziona ma la risoluzione fallisce, di solito stai incontrando un criterio LAN o
un problema del resolver mDNS.

## Debug nei log del Gateway

Il Gateway scrive un file di log a rotazione (stampato all'avvio come
`gateway log file: ...`). Cerca le righe `bonjour:`, in particolare:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour usa il nome host di sistema per l'host `.local` annunciato quando è una
label DNS valida. Se il nome host di sistema contiene spazi, underscore o un altro
carattere non valido per una label DNS, OpenClaw ripiega su `openclaw.local`. Imposta
`OPENCLAW_MDNS_HOSTNAME=<name>` prima di avviare il Gateway quando ti serve una
label host esplicita.

## Debug su nodo iOS

Il nodo iOS usa `NWBrowser` per individuare `_openclaw-gw._tcp`.

Per acquisire i log:

- Impostazioni → Gateway → Avanzate → **Log di debug dell'individuazione**
- Impostazioni → Gateway → Avanzate → **Log di individuazione** → riproduci → **Copia**

Il log include le transizioni di stato del browser e le modifiche del set di risultati.

## Quando abilitare Bonjour

Bonjour si avvia automaticamente per l'avvio del Gateway con configurazione vuota sugli host macOS perché
l'app locale e i nodi iOS/Android vicini si basano comunemente sull'individuazione sulla stessa LAN.

Abilita Bonjour esplicitamente quando l'individuazione automatica sulla stessa LAN è utile su Linux,
Windows o un altro host non macOS:

```bash
openclaw plugins enable bonjour
```

Quando è abilitato, Bonjour usa `discovery.mdns.mode` per decidere quanti metadati TXT
pubblicare. La modalità predefinita è `minimal`; usa `full` solo quando i client locali hanno bisogno dei
suggerimenti `cliPath` o `sshPort`, e usa `off` per sopprimere il multicast LAN senza
modificare l'abilitazione del Plugin.

## Quando disabilitare Bonjour

Lascia Bonjour disabilitato quando l'annuncio multicast LAN non è necessario, non disponibile
o dannoso. I casi comuni sono server non macOS, rete bridge Docker,
WSL o un criterio di rete che scarta il multicast mDNS. In questi ambienti il
Gateway resta raggiungibile tramite il suo URL pubblicato, SSH, Tailnet o DNS-SD
wide-area, ma l'individuazione automatica LAN non è affidabile.

Preferisci l'override d'ambiente esistente quando il problema è circoscritto alla distribuzione:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Questo disabilita l'annuncio multicast LAN senza cambiare la configurazione del Plugin.
È sicuro per immagini Docker, file di servizio, script di avvio e debug una tantum
perché l'impostazione scompare quando lo fa l'ambiente.

Usa la configurazione del Plugin quando vuoi intenzionalmente disattivare il Plugin di
individuazione LAN incluso per quella configurazione OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Insidie Docker

Il Plugin Bonjour incluso disabilita automaticamente l'annuncio multicast LAN nei
container rilevati quando `OPENCLAW_DISABLE_BONJOUR` non è impostato. Le reti bridge Docker
di solito non inoltrano il multicast mDNS (`224.0.0.251:5353`) tra il container
e la LAN, quindi l'annuncio dal container raramente rende funzionante l'individuazione.

Insidie importanti:

- Bonjour si avvia automaticamente sugli host macOS ed è opzionale altrove. Lasciarlo
  disabilitato non arresta il Gateway; salta solo l'annuncio multicast LAN.
- Disabilitare Bonjour non cambia `gateway.bind`; Docker usa comunque per impostazione predefinita
  `OPENCLAW_GATEWAY_BIND=lan` affinché la porta host pubblicata possa funzionare.
- Disabilitare Bonjour non disabilita DNS-SD wide-area. Usa l'individuazione wide-area
  o Tailnet quando il Gateway e il nodo non sono sulla stessa LAN.
- Riutilizzare lo stesso `OPENCLAW_CONFIG_DIR` fuori da Docker non rende persistente il
  criterio di disabilitazione automatica del container.
- Imposta `OPENCLAW_DISABLE_BONJOUR=0` solo per host networking, macvlan o un'altra
  rete in cui è noto che il multicast mDNS passi; impostalo a `1` per forzare la disabilitazione.

## Risoluzione dei problemi con Bonjour disabilitato

Se un nodo non individua più automaticamente il Gateway dopo la configurazione Docker:

1. Conferma se il Gateway è in modalità automatica, forzata attiva o forzata disattiva:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Conferma che il Gateway stesso sia raggiungibile tramite la porta pubblicata:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Usa una destinazione diretta quando Bonjour è disabilitato:
   - Control UI o strumenti locali: `http://127.0.0.1:18789`
   - Client LAN: `http://<gateway-host>:18789`
   - Client tra reti diverse: MagicDNS Tailnet, IP Tailnet, tunnel SSH o
     DNS-SD wide-area

4. Se hai deliberatamente abilitato il Plugin Bonjour in Docker e forzato l'annuncio
   con `OPENCLAW_DISABLE_BONJOUR=0`, testa il multicast dall'host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Se la navigazione è vuota o i log del Gateway mostrano ripetute cancellazioni
   del watchdog ciao, ripristina `OPENCLAW_DISABLE_BONJOUR=1` e usa una rotta diretta o
   Tailnet.

## Modalità di errore comuni

- **Bonjour non attraversa le reti**: usa Tailnet o SSH.
- **Multicast bloccato**: alcune reti Wi-Fi disabilitano mDNS.
- **Advertiser bloccato in probing/announcing**: host con multicast bloccato,
  bridge container, WSL o variazioni delle interfacce possono lasciare l'advertiser ciao in uno
  stato non annunciato. OpenClaw riprova alcune volte e poi disabilita Bonjour
  per il processo Gateway corrente invece di riavviare l'advertiser per sempre.
- **Rete bridge Docker**: Bonjour si disabilita automaticamente nei container rilevati.
  Imposta `OPENCLAW_DISABLE_BONJOUR=0` solo per host, macvlan o un'altra
  rete compatibile con mDNS.
- **Sospensione / variazioni delle interfacce**: macOS può perdere temporaneamente i risultati mDNS; riprova.
- **La navigazione funziona ma la risoluzione fallisce**: mantieni semplici i nomi delle macchine (evita emoji o
  punteggiatura), poi riavvia il Gateway. Il nome dell'istanza di servizio deriva dal
  nome host, quindi nomi troppo complessi possono confondere alcuni resolver.

## Nomi di istanza con escape (`\032`)

Bonjour/DNS-SD spesso esegue l'escape dei byte nei nomi delle istanze di servizio come sequenze
decimali `\DDD` (ad esempio gli spazi diventano `\032`).

- Questo è normale a livello di protocollo.
- Le UI dovrebbero decodificare per la visualizzazione (iOS usa `BonjourEscapes.decode`).

## Abilitazione / disabilitazione / configurazione

- Gli host macOS avviano automaticamente per impostazione predefinita il Plugin di individuazione LAN incluso.
- `openclaw plugins enable bonjour` abilita il Plugin di individuazione LAN incluso sugli host in cui non è abilitato per impostazione predefinita.
- `openclaw plugins disable bonjour` disabilita l'annuncio multicast LAN disabilitando il Plugin incluso.
- `OPENCLAW_DISABLE_BONJOUR=1` disabilita l'annuncio multicast LAN senza cambiare la configurazione del Plugin; i valori truthy accettati sono `1`, `true`, `yes` e `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` forza l'attivazione dell'annuncio multicast LAN, anche dentro i container rilevati; i valori falsy accettati sono `0`, `false`, `no` e `off`.
- Quando il Plugin Bonjour è abilitato e `OPENCLAW_DISABLE_BONJOUR` non è impostato, Bonjour annuncia sugli host normali e si disabilita automaticamente dentro i container rilevati.
- `gateway.bind` in `~/.openclaw/openclaw.json` controlla la modalità di bind del Gateway.
- `OPENCLAW_SSH_PORT` sovrascrive la porta SSH quando `sshPort` è annunciata (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` pubblica un suggerimento MagicDNS in TXT quando la modalità mDNS completa è abilitata (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` sovrascrive il percorso CLI annunciato (legacy: `OPENCLAW_CLI_PATH`).

## Documenti correlati

- Criterio di individuazione e selezione del trasporto: [Individuazione](/it/gateway/discovery)
- Associazione nodo + approvazioni: [Associazione Gateway](/it/gateway/pairing)
