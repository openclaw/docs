---
read_when:
    - Risoluzione dei problemi di rilevamento Bonjour su macOS/iOS
    - Modifica dei tipi di servizio mDNS, dei record TXT o della UX di rilevamento
summary: Rilevamento e risoluzione dei problemi Bonjour/mDNS (segnali del Gateway, client e modalità di errore comuni)
title: Rilevamento Bonjour
x-i18n:
    generated_at: "2026-05-12T12:50:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05892ee8f0dc880f68f7cf024de9452b8d999ff1af3c7ca9850fb4f2d732af0c
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw può usare Bonjour (mDNS / DNS-SD) per scoprire un Gateway attivo (endpoint WebSocket).
La navigazione multicast `local.` è una **comodità solo LAN**. Il Plugin `bonjour`
incluso gestisce l'advertising LAN. Si avvia automaticamente sugli host macOS ed è opzionale su
Linux, Windows e nelle distribuzioni containerizzate del Gateway. Per la discovery tra reti diverse, lo stesso
beacon può anche essere pubblicato tramite un dominio DNS-SD wide-area configurato. La discovery
rimane comunque best-effort e **non** sostituisce la connettività basata su SSH o Tailnet.

## Bonjour wide-area (DNS-SD unicast) su Tailscale

Se il Node e il Gateway sono su reti diverse, l'mDNS multicast non attraverserà il
confine. Puoi mantenere la stessa UX di discovery passando a **DNS-SD unicast**
("Bonjour Wide-Area") su Tailscale.

Passaggi di alto livello:

1. Esegui un server DNS sull'host del Gateway (raggiungibile tramite Tailnet).
2. Pubblica record DNS-SD per `_openclaw-gw._tcp` sotto una zona dedicata
   (esempio: `openclaw.internal.`).
3. Configura lo **split DNS** di Tailscale in modo che il dominio scelto venga risolto tramite quel
   server DNS per i client (incluso iOS).

OpenClaw supporta qualsiasi dominio di discovery; `openclaw.internal.` è solo un esempio.
I Node iOS/Android esplorano sia `local.` sia il tuo dominio wide-area configurato.

### Configurazione del Gateway (consigliata)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
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

Nella console di amministrazione di Tailscale:

- Aggiungi un nameserver che punta all'IP tailnet del Gateway (UDP/TCP 53).
- Aggiungi lo split DNS in modo che il tuo dominio di discovery usi quel nameserver.

Una volta che i client accettano il DNS tailnet, i Node iOS e la discovery CLI possono esplorare
`_openclaw-gw._tcp` nel tuo dominio di discovery senza multicast.

### Sicurezza del listener del Gateway (consigliata)

La porta WS del Gateway (predefinita `18789`) si associa per impostazione predefinita al loopback. Per l'accesso LAN/tailnet,
associala esplicitamente e mantieni l'autenticazione abilitata.

Per configurazioni solo tailnet:

- Imposta `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json`.
- Riavvia il Gateway (o riavvia l'app della barra dei menu di macOS).

## Cosa fa advertising

Solo il Gateway fa advertising di `_openclaw-gw._tcp`. L'advertising multicast LAN è
fornito dal Plugin `bonjour` incluso quando il Plugin è abilitato; la pubblicazione
DNS-SD wide-area rimane di proprietà del Gateway.

## Tipi di servizio

- `_openclaw-gw._tcp` - beacon di trasporto del Gateway (usato dai Node macOS/iOS/Android).

## Chiavi TXT (suggerimenti non segreti)

Il Gateway pubblicizza piccoli suggerimenti non segreti per rendere comodi i flussi UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (solo quando TLS è abilitato)
- `gatewayTlsSha256=<sha256>` (solo quando TLS è abilitato e l'impronta digitale è disponibile)
- `canvasPort=<port>` (solo quando l'host canvas è abilitato; attualmente uguale a `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (solo modalità mDNS completa, suggerimento opzionale quando Tailnet è disponibile)
- `sshPort=<port>` (solo modalità completa; omesso nelle modalità minimale e off)
- `cliPath=<path>` (solo modalità completa; omesso nelle modalità minimale e off)

Note di sicurezza:

- I record TXT Bonjour/mDNS sono **non autenticati**. I client non devono considerare TXT come routing autoritativo.
- I client dovrebbero instradare usando l'endpoint di servizio risolto (SRV + A/AAAA). Considera `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` solo come suggerimenti.
- Anche il targeting automatico SSH dovrebbe usare l'host di servizio risolto, non suggerimenti basati solo su TXT.
- Il pinning TLS non deve mai permettere a un `gatewayTlsSha256` pubblicizzato di sovrascrivere un pin memorizzato in precedenza.
- I Node iOS/Android dovrebbero trattare le connessioni dirette basate sulla discovery come **solo TLS** e richiedere una conferma esplicita dell'utente prima di considerare affidabile un'impronta digitale alla prima connessione.

## Debug su macOS

Strumenti integrati utili:

- Esplora le istanze:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Risolvi un'istanza (sostituisci `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Se l'esplorazione funziona ma la risoluzione fallisce, di solito stai incontrando una policy LAN o
un problema del resolver mDNS.

## Debug nei log del Gateway

Il Gateway scrive un file di log a rotazione (stampato all'avvio come
`gateway log file: ...`). Cerca le righe `bonjour:`, in particolare:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Il watchdog considera gli stati attivi `probing`, `announcing` e i rinomini freschi da conflitto come
stati in corso. Se il servizio non raggiunge mai `announced`, OpenClaw alla fine
ricrea l'advertiser e, dopo errori ripetuti, disabilita Bonjour per quel
processo Gateway invece di continuare a riannunciare all'infinito.

Bonjour usa il nome host di sistema per l'host `.local` pubblicizzato quando è una
label DNS valida. Se il nome host di sistema contiene spazi, underscore o un altro
carattere non valido per una label DNS, OpenClaw ripiega su `openclaw.local`. Imposta
`OPENCLAW_MDNS_HOSTNAME=<name>` prima di avviare il Gateway quando hai bisogno di una
label host esplicita.

## Debug sul Node iOS

Il Node iOS usa `NWBrowser` per scoprire `_openclaw-gw._tcp`.

Per acquisire i log:

- Impostazioni → Gateway → Avanzate → **Log di debug della discovery**
- Impostazioni → Gateway → Avanzate → **Log della discovery** → riproduci → **Copia**

Il log include le transizioni di stato del browser e le modifiche al set dei risultati.

## Quando abilitare Bonjour

Bonjour si avvia automaticamente per l'avvio del Gateway con configurazione vuota sugli host macOS perché
l'app locale e i Node iOS/Android nelle vicinanze spesso si affidano alla discovery sulla stessa LAN.

Abilita Bonjour esplicitamente quando l'auto-discovery sulla stessa LAN è utile su Linux,
Windows o un altro host non macOS:

```bash
openclaw plugins enable bonjour
```

Quando è abilitato, Bonjour usa `discovery.mdns.mode` per decidere quanti metadati TXT
pubblicare. La stessa modalità controlla i suggerimenti TXT opzionali nei record DNS-SD wide-area.
La modalità predefinita è `minimal`; usa `full` solo quando i client hanno bisogno dei suggerimenti `cliPath` o
`sshPort`. Usa `off` per sopprimere il multicast LAN senza cambiare l'abilitazione del Plugin;
il DNS-SD wide-area può comunque pubblicare il beacon minimale del Gateway quando
`discovery.wideArea.enabled` è true.

## Quando disabilitare Bonjour

Lascia Bonjour disabilitato quando l'advertising multicast LAN è inutile, non disponibile
o dannoso. I casi comuni sono server non macOS, networking Docker bridge,
WSL o una policy di rete che blocca il multicast mDNS. In quegli ambienti il
Gateway resta raggiungibile tramite il suo URL pubblicato, SSH, Tailnet o DNS-SD
wide-area, ma l'auto-discovery LAN non è affidabile.

Preferisci l'override di ambiente esistente quando il problema è legato alla distribuzione:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Questo disabilita l'advertising multicast LAN senza cambiare la configurazione del Plugin.
È sicuro per immagini Docker, file di servizio, script di avvio e debug una tantum
perché l'impostazione scompare quando scompare l'ambiente.

Usa la configurazione del Plugin quando vuoi intenzionalmente disattivare il Plugin di discovery LAN
incluso per quella configurazione OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Problemi comuni con Docker

Il Plugin Bonjour incluso disabilita automaticamente l'advertising multicast LAN nei container
rilevati quando `OPENCLAW_DISABLE_BONJOUR` non è impostato. Le reti Docker bridge
di solito non inoltrano il multicast mDNS (`224.0.0.251:5353`) tra il container
e la LAN, quindi l'advertising dal container raramente fa funzionare la discovery.

Problemi importanti:

- Bonjour si avvia automaticamente sugli host macOS ed è opzionale altrove. Lasciarlo
  disabilitato non ferma il Gateway; salta solo l'advertising multicast LAN.
- Disabilitare Bonjour non cambia `gateway.bind`; Docker usa comunque per impostazione predefinita
  `OPENCLAW_GATEWAY_BIND=lan` così la porta host pubblicata può funzionare.
- Disabilitare Bonjour non disabilita il DNS-SD wide-area. Usa la discovery wide-area
  o Tailnet quando il Gateway e il Node non sono sulla stessa LAN.
- Riutilizzare lo stesso `OPENCLAW_CONFIG_DIR` fuori da Docker non rende persistente la
  policy di auto-disabilitazione del container.
- Imposta `OPENCLAW_DISABLE_BONJOUR=0` solo per networking host, macvlan o un'altra
  rete in cui è noto che il multicast mDNS passi; impostalo a `1` per forzare la disabilitazione.

## Risoluzione dei problemi con Bonjour disabilitato

Se un Node non scopre più automaticamente il Gateway dopo la configurazione Docker:

1. Conferma se il Gateway è in esecuzione in modalità auto, forzata attiva o forzata disattiva:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Conferma che il Gateway stesso sia raggiungibile tramite la porta pubblicata:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Usa un target diretto quando Bonjour è disabilitato:
   - UI di controllo o strumenti locali: `http://127.0.0.1:18789`
   - Client LAN: `http://<gateway-host>:18789`
   - Client tra reti diverse: Tailnet MagicDNS, IP Tailnet, tunnel SSH o
     DNS-SD wide-area

4. Se hai deliberatamente abilitato il Plugin Bonjour in Docker e forzato l'advertising
   con `OPENCLAW_DISABLE_BONJOUR=0`, testa il multicast dall'host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Se l'esplorazione è vuota o i log del Gateway mostrano ripetute cancellazioni del watchdog
   ciao, ripristina `OPENCLAW_DISABLE_BONJOUR=1` e usa una route diretta o
   Tailnet.

## Modalità di errore comuni

- **Bonjour non attraversa le reti**: usa Tailnet o SSH.
- **Multicast bloccato**: alcune reti Wi-Fi disabilitano mDNS.
- **Advertiser bloccato in probing/announcing**: host con multicast bloccato,
  bridge container, WSL o cambiamenti delle interfacce possono lasciare l'advertiser ciao in uno
  stato non annunciato. OpenClaw riprova alcune volte e poi disabilita Bonjour
  per il processo Gateway corrente invece di riavviare l'advertiser all'infinito.
- **Networking Docker bridge**: Bonjour si disabilita automaticamente nei container rilevati.
  Imposta `OPENCLAW_DISABLE_BONJOUR=0` solo per host, macvlan o un'altra
  rete compatibile con mDNS.
- **Sospensione / cambiamenti delle interfacce**: macOS può perdere temporaneamente i risultati mDNS; riprova.
- **L'esplorazione funziona ma la risoluzione fallisce**: mantieni semplici i nomi macchina (evita emoji o
  punteggiatura), quindi riavvia il Gateway. Il nome dell'istanza di servizio deriva dal
  nome host, quindi nomi troppo complessi possono confondere alcuni resolver.

## Nomi di istanza con escape (`\032`)

Bonjour/DNS-SD spesso esegue l'escape dei byte nei nomi delle istanze di servizio come sequenze decimali `\DDD`
(ad esempio gli spazi diventano `\032`).

- Questo è normale a livello di protocollo.
- Le UI dovrebbero decodificare per la visualizzazione (iOS usa `BonjourEscapes.decode`).

## Abilitazione / disabilitazione / configurazione

- Gli host macOS avviano automaticamente per impostazione predefinita il Plugin di rilevamento LAN incluso.
- `openclaw plugins enable bonjour` abilita il Plugin di rilevamento LAN incluso sugli host in cui non è abilitato per impostazione predefinita.
- `openclaw plugins disable bonjour` disabilita l'annuncio multicast LAN disabilitando il Plugin incluso.
- `OPENCLAW_DISABLE_BONJOUR=1` disabilita l'annuncio multicast LAN senza modificare la configurazione del Plugin; i valori accettati considerati veri sono `1`, `true`, `yes` e `on` (precedente: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` forza l'attivazione dell'annuncio multicast LAN, anche all'interno dei container rilevati; i valori accettati considerati falsi sono `0`, `false`, `no` e `off`.
- Quando il Plugin Bonjour è abilitato e `OPENCLAW_DISABLE_BONJOUR` non è impostato, Bonjour effettua l'annuncio sugli host normali e si disabilita automaticamente all'interno dei container rilevati.
- `gateway.bind` in `~/.openclaw/openclaw.json` controlla la modalità di associazione del Gateway.
- `OPENCLAW_SSH_PORT` sovrascrive la porta SSH quando viene annunciato `sshPort` (precedente: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` pubblica un suggerimento MagicDNS in TXT quando la modalità completa mDNS è abilitata (precedente: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` sovrascrive il percorso CLI annunciato (precedente: `OPENCLAW_CLI_PATH`).

## Documentazione correlata

- Criteri di rilevamento e selezione del trasporto: [Rilevamento](/it/gateway/discovery)
- Associazione Node + approvazioni: [Associazione Gateway](/it/gateway/pairing)
