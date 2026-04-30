---
read_when:
    - Debug dei problemi di rilevamento Bonjour su macOS/iOS
    - Modifica dei tipi di servizio mDNS, dei record TXT o dell'esperienza utente di rilevamento
summary: Rilevamento Bonjour/mDNS + risoluzione dei problemi (segnali del Gateway, client e modalità di errore comuni)
title: Rilevamento Bonjour
x-i18n:
    generated_at: "2026-04-30T08:49:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0720451843aae0509949324e51f3a23dc69e366e68de851c595ce76c8ab0eec9
    source_path: gateway/bonjour.md
    workflow: 16
---

# Rilevamento Bonjour / mDNS

OpenClaw usa Bonjour (mDNS / DNS‑SD) per rilevare un Gateway attivo (endpoint WebSocket).
La navigazione multicast `local.` è una **comodità solo LAN**. Il Plugin `bonjour`
incluso gestisce l’advertising LAN ed è abilitato per impostazione predefinita. Per il rilevamento tra reti diverse,
lo stesso beacon può anche essere pubblicato tramite un dominio DNS-SD geografico configurato.
Il rilevamento resta comunque best-effort e **non** sostituisce la connettività basata su SSH o Tailnet.

## Bonjour geografico (DNS-SD unicast) su Tailscale

Se il nodo e il Gateway sono su reti diverse, mDNS multicast non attraverserà il
confine. Puoi mantenere la stessa UX di rilevamento passando a **DNS‑SD unicast**
("Bonjour geografico") su Tailscale.

Passaggi generali:

1. Esegui un server DNS sull’host del Gateway (raggiungibile tramite Tailnet).
2. Pubblica record DNS‑SD per `_openclaw-gw._tcp` sotto una zona dedicata
   (esempio: `openclaw.internal.`).
3. Configura lo **split DNS** di Tailscale in modo che il dominio scelto venga risolto tramite quel
   server DNS per i client (incluso iOS).

OpenClaw supporta qualsiasi dominio di rilevamento; `openclaw.internal.` è solo un esempio.
I nodi iOS/Android navigano sia `local.` sia il dominio geografico configurato.

### Configurazione Gateway (consigliata)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Configurazione una tantum del server DNS (host Gateway)

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

- Aggiungi un nameserver che punti all’IP tailnet del Gateway (UDP/TCP 53).
- Aggiungi lo split DNS in modo che il dominio di rilevamento usi quel nameserver.

Quando i client accettano il DNS tailnet, i nodi iOS e il rilevamento CLI possono navigare
`_openclaw-gw._tcp` nel dominio di rilevamento senza multicast.

### Sicurezza del listener Gateway (consigliata)

La porta WS del Gateway (predefinita `18789`) si associa a loopback per impostazione predefinita. Per l’accesso LAN/tailnet,
associala esplicitamente e mantieni l’autenticazione abilitata.

Per configurazioni solo tailnet:

- Imposta `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json`.
- Riavvia il Gateway (o riavvia l’app della barra dei menu di macOS).

## Cosa effettua l’advertising

Solo il Gateway effettua l’advertising di `_openclaw-gw._tcp`. L’advertising multicast LAN è
fornito dal Plugin `bonjour` incluso; la pubblicazione DNS-SD geografica resta
di proprietà del Gateway.

## Tipi di servizio

- `_openclaw-gw._tcp` — beacon di trasporto del Gateway (usato dai nodi macOS/iOS/Android).

## Chiavi TXT (suggerimenti non segreti)

Il Gateway annuncia piccoli suggerimenti non segreti per rendere comodi i flussi UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (solo quando TLS è abilitato)
- `gatewayTlsSha256=<sha256>` (solo quando TLS è abilitato e l’impronta è disponibile)
- `canvasPort=<port>` (solo quando l’host canvas è abilitato; attualmente uguale a `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (solo modalità mDNS completa, suggerimento facoltativo quando Tailnet è disponibile)
- `sshPort=<port>` (solo modalità mDNS completa; DNS-SD geografico può ometterlo)
- `cliPath=<path>` (solo modalità mDNS completa; DNS-SD geografico lo scrive comunque come suggerimento di installazione remota)

Note di sicurezza:

- I record TXT Bonjour/mDNS **non sono autenticati**. I client non devono trattare TXT come routing autorevole.
- I client dovrebbero instradare usando l’endpoint di servizio risolto (SRV + A/AAAA). Tratta `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` solo come suggerimenti.
- Anche il targeting automatico SSH dovrebbe usare l’host di servizio risolto, non suggerimenti solo TXT.
- Il pinning TLS non deve mai consentire a un `gatewayTlsSha256` annunciato di sovrascrivere un pin memorizzato in precedenza.
- I nodi iOS/Android dovrebbero trattare le connessioni dirette basate sul rilevamento come **solo TLS** e richiedere una conferma esplicita dell’utente prima di fidarsi di una nuova impronta.

## Debug su macOS

Strumenti integrati utili:

- Naviga le istanze:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Risolvi un’istanza (sostituisci `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Se la navigazione funziona ma la risoluzione fallisce, di solito c’è un problema di policy LAN o
del resolver mDNS.

## Debug nei log del Gateway

Il Gateway scrive un file di log a rotazione (stampato all’avvio come
`gateway log file: ...`). Cerca le righe `bonjour:`, in particolare:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour usa il nome host di sistema per l’host `.local` annunciato quando è una
etichetta DNS valida. Se il nome host di sistema contiene spazi, underscore o un altro
carattere non valido per le etichette DNS, OpenClaw ripiega su `openclaw.local`. Imposta
`OPENCLAW_MDNS_HOSTNAME=<name>` prima di avviare il Gateway quando hai bisogno di
un’etichetta host esplicita.

## Debug sul nodo iOS

Il nodo iOS usa `NWBrowser` per rilevare `_openclaw-gw._tcp`.

Per acquisire i log:

- Impostazioni → Gateway → Avanzate → **Log di debug del rilevamento**
- Impostazioni → Gateway → Avanzate → **Log di rilevamento** → riproduci → **Copia**

Il log include le transizioni di stato del browser e le modifiche del set di risultati.

## Quando disabilitare Bonjour

Disabilita Bonjour solo quando l’advertising multicast LAN non è disponibile o è dannoso.
Il caso comune è un Gateway in esecuzione dietro rete bridge Docker, WSL o una
policy di rete che elimina il multicast mDNS. In questi ambienti il Gateway è
comunque raggiungibile tramite il suo URL pubblicato, SSH, Tailnet o DNS-SD geografico,
ma il rilevamento automatico LAN non è affidabile.

Preferisci l’override d’ambiente esistente quando il problema è limitato al deployment:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Questo disabilita l’advertising multicast LAN senza modificare la configurazione del Plugin.
È sicuro per immagini Docker, file di servizio, script di avvio e debug una tantum
perché l’impostazione scompare quando scompare l’ambiente.

Usa la configurazione del Plugin solo quando vuoi intenzionalmente disattivare il
Plugin di rilevamento LAN incluso per quella configurazione OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Insidie di Docker

Il Plugin Bonjour incluso disabilita automaticamente l’advertising multicast LAN nei
container rilevati quando `OPENCLAW_DISABLE_BONJOUR` non è impostato. Le reti bridge Docker
di solito non inoltrano il multicast mDNS (`224.0.0.251:5353`) tra il container
e la LAN, quindi l’advertising dal container raramente fa funzionare il rilevamento.

Insidie importanti:

- Disabilitare Bonjour non arresta il Gateway. Arresta solo l’advertising multicast
  LAN.
- Disabilitare Bonjour non modifica `gateway.bind`; Docker resta predefinito a
  `OPENCLAW_GATEWAY_BIND=lan` così la porta host pubblicata può funzionare.
- Disabilitare Bonjour non disabilita DNS-SD geografico. Usa il rilevamento geografico
  o Tailnet quando il Gateway e il nodo non sono sulla stessa LAN.
- Riutilizzare lo stesso `OPENCLAW_CONFIG_DIR` fuori da Docker non mantiene la
  policy di disabilitazione automatica del container.
- Imposta `OPENCLAW_DISABLE_BONJOUR=0` solo per networking host, macvlan o un’altra
  rete in cui è noto che il multicast mDNS passa; impostalo a `1` per forzare la disabilitazione.

## Risoluzione dei problemi di Bonjour disabilitato

Se un nodo non rileva più automaticamente il Gateway dopo la configurazione Docker:

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
   - Client tra reti diverse: Tailnet MagicDNS, IP Tailnet, tunnel SSH o
     DNS-SD geografico

4. Se hai abilitato deliberatamente Bonjour in Docker con
   `OPENCLAW_DISABLE_BONJOUR=0`, testa il multicast dall’host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Se la navigazione è vuota o i log del Gateway mostrano cancellazioni ripetute del watchdog ciao,
   ripristina `OPENCLAW_DISABLE_BONJOUR=1` e usa una route diretta o
   Tailnet.

## Modalità di errore comuni

- **Bonjour non attraversa le reti**: usa Tailnet o SSH.
- **Multicast bloccato**: alcune reti Wi‑Fi disabilitano mDNS.
- **Advertiser bloccato in probing/announcing**: host con multicast bloccato,
  bridge di container, WSL o cambiamenti delle interfacce possono lasciare l’advertiser ciao in uno
  stato non annunciato. OpenClaw riprova alcune volte e poi disabilita Bonjour
  per il processo Gateway corrente invece di riavviare l’advertiser all’infinito.
- **Rete bridge Docker**: Bonjour si disabilita automaticamente nei container rilevati.
  Imposta `OPENCLAW_DISABLE_BONJOUR=0` solo per host, macvlan o un’altra
  rete compatibile con mDNS.
- **Sospensione / cambiamenti delle interfacce**: macOS può eliminare temporaneamente i risultati mDNS; riprova.
- **La navigazione funziona ma la risoluzione fallisce**: mantieni semplici i nomi delle macchine (evita emoji o
  punteggiatura), poi riavvia il Gateway. Il nome dell’istanza di servizio deriva dal
  nome host, quindi nomi troppo complessi possono confondere alcuni resolver.

## Nomi di istanze con escape (`\032`)

Bonjour/DNS‑SD spesso effettua l’escape dei byte nei nomi delle istanze di servizio come sequenze decimali `\DDD`
(ad esempio gli spazi diventano `\032`).

- Questo è normale a livello di protocollo.
- Le UI dovrebbero decodificare per la visualizzazione (iOS usa `BonjourEscapes.decode`).

## Disabilitazione / configurazione

- `openclaw plugins disable bonjour` disabilita l’advertising multicast LAN disabilitando il Plugin incluso.
- `openclaw plugins enable bonjour` ripristina il Plugin di rilevamento LAN predefinito.
- `OPENCLAW_DISABLE_BONJOUR=1` disabilita l’advertising multicast LAN senza modificare la configurazione del Plugin; i valori truthy accettati sono `1`, `true`, `yes` e `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` forza l’attivazione dell’advertising multicast LAN, anche dentro i container rilevati; i valori falsy accettati sono `0`, `false`, `no` e `off`.
- Quando `OPENCLAW_DISABLE_BONJOUR` non è impostato, Bonjour effettua l’advertising su host normali e si disabilita automaticamente dentro i container rilevati.
- `gateway.bind` in `~/.openclaw/openclaw.json` controlla la modalità di bind del Gateway.
- `OPENCLAW_SSH_PORT` sovrascrive la porta SSH quando `sshPort` viene annunciato (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` pubblica un suggerimento MagicDNS in TXT quando la modalità mDNS completa è abilitata (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` sovrascrive il percorso CLI annunciato (legacy: `OPENCLAW_CLI_PATH`).

## Documentazione correlata

- Policy di rilevamento e selezione del trasporto: [Rilevamento](/it/gateway/discovery)
- Associazione del nodo + approvazioni: [Associazione Gateway](/it/gateway/pairing)
