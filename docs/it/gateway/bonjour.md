---
read_when:
    - Debug dei problemi di scoperta Bonjour su macOS/iOS
    - Modifica dei tipi di servizio mDNS, dei record TXT o della UX di scoperta
summary: Scoperta e debug Bonjour/mDNS (beacon Gateway, client e modalità di errore comuni)
title: Scoperta Bonjour
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:27:48Z"
  model: gpt-5.4
  provider: openai
  source_hash: b055021bdcd92740934823dea2acf758c6ec991a15c0a315426dc359a7eea093
  source_path: gateway/bonjour.md
  workflow: 15
---

# Scoperta Bonjour / mDNS

OpenClaw usa Bonjour (mDNS / DNS‑SD) per scoprire un Gateway attivo (endpoint WebSocket).
La navigazione multicast `local.` è una **comodità solo LAN**. Il Plugin `bonjour`
incluso nel bundle gestisce l'annuncio LAN ed è abilitato per impostazione predefinita. Per la scoperta tra reti,
lo stesso beacon può essere pubblicato anche tramite un dominio DNS-SD wide-area configurato.
La scoperta resta comunque best-effort e **non** sostituisce la connettività basata su SSH o Tailnet.

## Bonjour wide-area (Unicast DNS-SD) su Tailscale

Se il Node e il Gateway si trovano su reti diverse, l'mDNS multicast non attraverserà il
confine. Puoi mantenere la stessa UX di scoperta passando a **unicast DNS‑SD**
("Bonjour wide-area") su Tailscale.

Passaggi di alto livello:

1. Esegui un server DNS sull'host del Gateway (raggiungibile tramite Tailnet).
2. Pubblica i record DNS‑SD per `_openclaw-gw._tcp` sotto una zona dedicata
   (esempio: `openclaw.internal.`).
3. Configura il **split DNS** di Tailscale in modo che il dominio scelto venga risolto tramite quel
   server DNS per i client (incluso iOS).

OpenClaw supporta qualsiasi dominio di scoperta; `openclaw.internal.` è solo un esempio.
I Node iOS/Android navigano sia `local.` sia il dominio wide-area configurato.

### Configurazione Gateway (consigliata)

```json5
{
  gateway: { bind: "tailnet" }, // solo tailnet (consigliato)
  discovery: { wideArea: { enabled: true } }, // abilita la pubblicazione DNS-SD wide-area
}
```

### Configurazione una tantum del server DNS (host Gateway)

```bash
openclaw dns setup --apply
```

Questo installa CoreDNS e lo configura per:

- ascoltare sulla porta 53 solo sulle interfacce Tailscale del Gateway
- servire il dominio scelto (esempio: `openclaw.internal.`) da `~/.openclaw/dns/<domain>.db`

Valida da una macchina connessa alla tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Impostazioni DNS di Tailscale

Nella console di amministrazione Tailscale:

- Aggiungi un nameserver che punti all'IP tailnet del Gateway (UDP/TCP 53).
- Aggiungi lo split DNS in modo che il tuo dominio di scoperta usi quel nameserver.

Una volta che i client accettano il DNS tailnet, i Node iOS e la scoperta CLI possono navigare
`_openclaw-gw._tcp` nel tuo dominio di scoperta senza multicast.

### Sicurezza del listener Gateway (consigliata)

La porta WS del Gateway (predefinita `18789`) è associata al loopback per impostazione predefinita. Per l'accesso LAN/tailnet,
esegui un bind esplicito e mantieni l'autenticazione abilitata.

Per configurazioni solo tailnet:

- Imposta `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json`.
- Riavvia il Gateway (oppure riavvia l'app menubar macOS).

## Cosa viene annunciato

Solo il Gateway annuncia `_openclaw-gw._tcp`. L'annuncio multicast LAN è
fornito dal Plugin `bonjour` incluso nel bundle; la pubblicazione DNS-SD wide-area resta
di proprietà del Gateway.

## Tipi di servizio

- `_openclaw-gw._tcp` — beacon di trasporto del gateway (usato dai Node macOS/iOS/Android).

## Chiavi TXT (hint non segreti)

Il Gateway annuncia piccoli hint non segreti per rendere comodi i flussi UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (solo quando TLS è abilitato)
- `gatewayTlsSha256=<sha256>` (solo quando TLS è abilitato e l'impronta digitale è disponibile)
- `canvasPort=<port>` (solo quando l'host canvas è abilitato; attualmente coincide con `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (solo modalità mDNS full, hint facoltativo quando Tailnet è disponibile)
- `sshPort=<port>` (solo modalità mDNS full; il DNS-SD wide-area può ometterlo)
- `cliPath=<path>` (solo modalità mDNS full; il DNS-SD wide-area continua a scriverlo come hint per l'installazione remota)

Note di sicurezza:

- I record TXT di Bonjour/mDNS sono **non autenticati**. I client non devono trattare TXT come instradamento autorevole.
- I client dovrebbero instradare usando l'endpoint del servizio risolto (SRV + A/AAAA). Tratta `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` solo come hint.
- Anche il targeting automatico SSH dovrebbe usare l'host del servizio risolto, non hint solo TXT.
- Il pinning TLS non deve mai consentire a un `gatewayTlsSha256` annunciato di sovrascrivere un pin memorizzato in precedenza.
- I Node iOS/Android dovrebbero trattare le connessioni dirette basate sulla scoperta come **solo TLS** e richiedere una conferma esplicita dell'utente prima di fidarsi di una fingerprint vista per la prima volta.

## Debug su macOS

Strumenti integrati utili:

- Naviga tra le istanze:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Risolvi un'istanza (sostituisci `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Se la navigazione funziona ma la risoluzione fallisce, di solito si tratta di una policy LAN o
di un problema del resolver mDNS.

## Debug nei log Gateway

Il Gateway scrive un file di log a rotazione (stampato all'avvio come
`gateway log file: ...`). Cerca le righe `bonjour:`, in particolare:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

## Debug sul Node iOS

Il Node iOS usa `NWBrowser` per scoprire `_openclaw-gw._tcp`.

Per acquisire i log:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → riproduci il problema → **Copy**

Il log include le transizioni di stato del browser e le modifiche del set di risultati.

## Quando disabilitare Bonjour

Disabilita Bonjour solo quando l'annuncio multicast LAN non è disponibile o è dannoso.
Il caso comune è un Gateway in esecuzione dietro networking Docker bridge, WSL o una
policy di rete che blocca il multicast mDNS. In questi ambienti il Gateway è
comunque raggiungibile tramite il suo URL pubblicato, SSH, Tailnet o DNS-SD wide-area,
ma l'auto-scoperta LAN non è affidabile.

Preferisci l'override di ambiente esistente quando il problema è limitato al deployment:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Questo disabilita l'annuncio multicast LAN senza modificare la configurazione del Plugin.
È sicuro per immagini Docker, file di servizio, script di avvio e debug una tantum
perché l'impostazione scompare quando scompare l'ambiente.

Usa la configurazione del Plugin solo quando vuoi intenzionalmente disattivare il
Plugin di scoperta LAN incluso nel bundle per quella configurazione OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Problemi tipici con Docker

Docker Compose incluso nel bundle imposta `OPENCLAW_DISABLE_BONJOUR=1` per il servizio Gateway
per impostazione predefinita. Le reti Docker bridge di solito non inoltrano il multicast mDNS
(`224.0.0.251:5353`) tra il container e la LAN, quindi lasciare Bonjour attivo può
produrre ripetuti errori ciao `probing` o `announcing` senza far funzionare la scoperta.

Problemi importanti da conoscere:

- Disabilitare Bonjour non arresta il Gateway. Interrompe solo l'annuncio multicast LAN.
- Disabilitare Bonjour non modifica `gateway.bind`; Docker continua a usare per impostazione predefinita
  `OPENCLAW_GATEWAY_BIND=lan` così che la porta host pubblicata possa funzionare.
- Disabilitare Bonjour non disabilita il DNS-SD wide-area. Usa la scoperta wide-area
  o Tailnet quando il Gateway e il Node non si trovano sulla stessa LAN.
- Riutilizzare la stessa `OPENCLAW_CONFIG_DIR` fuori da Docker non eredita il valore predefinito
  di Compose a meno che l'ambiente non imposti ancora `OPENCLAW_DISABLE_BONJOUR`.
- Imposta `OPENCLAW_DISABLE_BONJOUR=0` solo per host networking, macvlan o un'altra
  rete in cui il multicast mDNS è noto per funzionare.

## Risoluzione dei problemi di Bonjour disabilitato

Se un Node non scopre più automaticamente il Gateway dopo la configurazione Docker:

1. Conferma se il Gateway sta sopprimendo intenzionalmente l'annuncio LAN:

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
   - Client tra reti: Tailnet MagicDNS, IP Tailnet, tunnel SSH o
     DNS-SD wide-area

4. Se hai deliberatamente abilitato Bonjour in Docker con
   `OPENCLAW_DISABLE_BONJOUR=0`, testa il multicast dall'host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Se la navigazione è vuota o i log Gateway mostrano ripetute cancellazioni del
   watchdog ciao, ripristina `OPENCLAW_DISABLE_BONJOUR=1` e usa un percorso diretto o
   Tailnet.

## Modalità di errore comuni

- **Bonjour non attraversa le reti**: usa Tailnet o SSH.
- **Multicast bloccato**: alcune reti Wi‑Fi disabilitano mDNS.
- **Advertiser bloccato in probing/announcing**: host con multicast bloccato,
  bridge di container, WSL o churn delle interfacce possono lasciare l'advertiser ciao in uno
  stato non annunciato. OpenClaw ritenta alcune volte e poi disabilita Bonjour
  per il processo Gateway corrente invece di riavviare l'advertiser all'infinito.
- **Networking Docker bridge**: Docker Compose incluso nel bundle disabilita Bonjour per
  impostazione predefinita con `OPENCLAW_DISABLE_BONJOUR=1`. Impostalo su `0` solo per host,
  macvlan o un'altra rete compatibile con mDNS.
- **Sleep / churn delle interfacce**: macOS può eliminare temporaneamente i risultati mDNS; riprova.
- **La navigazione funziona ma la risoluzione fallisce**: mantieni semplici i nomi delle macchine (evita emoji o
  punteggiatura), poi riavvia il Gateway. Il nome dell'istanza del servizio deriva dal
  nome host, quindi nomi troppo complessi possono confondere alcuni resolver.

## Nomi istanza con escape (`\032`)

Bonjour/DNS‑SD spesso esegue l'escape dei byte nei nomi delle istanze di servizio come sequenze decimali `\DDD`
(ad esempio gli spazi diventano `\032`).

- Questo è normale a livello di protocollo.
- Le UI dovrebbero decodificare per la visualizzazione (iOS usa `BonjourEscapes.decode`).

## Disabilitazione / configurazione

- `openclaw plugins disable bonjour` disabilita l'annuncio multicast LAN disabilitando il Plugin incluso nel bundle.
- `openclaw plugins enable bonjour` ripristina il Plugin di scoperta LAN predefinito.
- `OPENCLAW_DISABLE_BONJOUR=1` disabilita l'annuncio multicast LAN senza modificare la configurazione del Plugin; i valori truthy accettati sono `1`, `true`, `yes` e `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- Docker Compose imposta `OPENCLAW_DISABLE_BONJOUR=1` per impostazione predefinita per il networking bridge; esegui l'override con `OPENCLAW_DISABLE_BONJOUR=0` solo quando il multicast mDNS è disponibile.
- `gateway.bind` in `~/.openclaw/openclaw.json` controlla la modalità bind del Gateway.
- `OPENCLAW_SSH_PORT` sovrascrive la porta SSH quando `sshPort` viene annunciato (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` pubblica un hint MagicDNS in TXT quando la modalità mDNS full è abilitata (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` sovrascrive il percorso CLI annunciato (legacy: `OPENCLAW_CLI_PATH`).

## Documenti correlati

- Policy di scoperta e selezione del trasporto: [Scoperta](/it/gateway/discovery)
- Abbinamento Node + approvazioni: [Abbinamento Gateway](/it/gateway/pairing)
