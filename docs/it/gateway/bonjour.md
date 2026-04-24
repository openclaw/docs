---
read_when:
    - Debug dei problemi di discovery Bonjour su macOS/iOS
    - Modificare tipi di servizio mDNS, record TXT o UX della discovery
summary: Discovery Bonjour/mDNS + debug (beacon del Gateway, client e modalità di errore comuni)
title: Discovery Bonjour
x-i18n:
    generated_at: "2026-04-24T08:38:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62961714a0c9880be457c254e1cfc1701020ea51b89f2582757cddc8b3dd2113
    source_path: gateway/bonjour.md
    workflow: 15
---

# Discovery Bonjour / mDNS

OpenClaw usa Bonjour (mDNS / DNS-SD) per individuare un Gateway attivo (endpoint WebSocket).
La navigazione multicast `local.` è una **comodità solo LAN**. Il
Plugin `bonjour` incluso gestisce l'annuncio sulla LAN ed è abilitato per impostazione predefinita. Per la discovery cross-network,
lo stesso beacon può anche essere pubblicato tramite un dominio DNS-SD wide-area configurato.
La discovery resta comunque best-effort e **non** sostituisce la connettività basata su SSH o Tailnet.

## Bonjour wide-area (DNS-SD unicast) su Tailscale

Se il node e il gateway si trovano su reti diverse, l'mDNS multicast non attraverserà
quel confine. Puoi mantenere la stessa UX di discovery passando a **DNS-SD unicast**
("Wide-Area Bonjour") su Tailscale.

Passaggi di alto livello:

1. Esegui un server DNS sull'host del gateway (raggiungibile tramite Tailnet).
2. Pubblica i record DNS-SD per `_openclaw-gw._tcp` sotto una zona dedicata
   (esempio: `openclaw.internal.`).
3. Configura **split DNS** di Tailscale in modo che il dominio scelto venga risolto tramite quel
   server DNS per i client (incluso iOS).

OpenClaw supporta qualsiasi dominio di discovery; `openclaw.internal.` è solo un esempio.
I Node iOS/Android navigano sia in `local.` sia nel dominio wide-area configurato.

### Configurazione del Gateway (consigliata)

```json5
{
  gateway: { bind: "tailnet" }, // solo tailnet (consigliato)
  discovery: { wideArea: { enabled: true } }, // abilita la pubblicazione DNS-SD wide-area
}
```

### Configurazione una tantum del server DNS (host gateway)

```bash
openclaw dns setup --apply
```

Questo installa CoreDNS e lo configura per:

- ascoltare sulla porta 53 solo sulle interfacce Tailscale del gateway
- servire il dominio scelto (esempio: `openclaw.internal.`) da `~/.openclaw/dns/<domain>.db`

Verifica da una macchina connessa alla tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Impostazioni DNS di Tailscale

Nella console di amministrazione di Tailscale:

- Aggiungi un nameserver che punti all'IP tailnet del gateway (UDP/TCP 53).
- Aggiungi split DNS in modo che il tuo dominio di discovery usi quel nameserver.

Una volta che i client accettano il DNS tailnet, i Node iOS e la discovery da CLI possono navigare
`_openclaw-gw._tcp` nel tuo dominio di discovery senza multicast.

### Sicurezza del listener Gateway (consigliata)

La porta WS del Gateway (predefinita `18789`) usa per impostazione predefinita il bind su loopback. Per l'accesso LAN/tailnet,
esegui esplicitamente il bind e mantieni l'autenticazione abilitata.

Per configurazioni solo tailnet:

- Imposta `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json`.
- Riavvia il Gateway (o riavvia l'app menubar di macOS).

## Cosa viene annunciato

Solo il Gateway annuncia `_openclaw-gw._tcp`. L'annuncio multicast LAN è
fornito dal Plugin `bonjour` incluso; la pubblicazione DNS-SD wide-area resta
di proprietà del Gateway.

## Tipi di servizio

- `_openclaw-gw._tcp` — beacon di trasporto del gateway (usato dai Node macOS/iOS/Android).

## Chiavi TXT (suggerimenti non segreti)

Il Gateway annuncia piccoli suggerimenti non segreti per rendere pratici i flussi UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (solo quando TLS è abilitato)
- `gatewayTlsSha256=<sha256>` (solo quando TLS è abilitato e il fingerprint è disponibile)
- `canvasPort=<port>` (solo quando l'host canvas è abilitato; attualmente è lo stesso di `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (solo modalità mDNS full, suggerimento facoltativo quando Tailnet è disponibile)
- `sshPort=<port>` (solo modalità mDNS full; il DNS-SD wide-area può ometterlo)
- `cliPath=<path>` (solo modalità mDNS full; il DNS-SD wide-area lo scrive comunque come suggerimento per l'installazione remota)

Note di sicurezza:

- I record TXT Bonjour/mDNS sono **non autenticati**. I client non devono trattare i TXT come instradamento autorevole.
- I client dovrebbero instradare usando l'endpoint del servizio risolto (SRV + A/AAAA). Tratta `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` solo come suggerimenti.
- Anche il targeting automatico SSH dovrebbe usare l'host di servizio risolto, non suggerimenti solo-TXT.
- Il pinning TLS non deve mai consentire che un `gatewayTlsSha256` annunciato sovrascriva un pin precedentemente memorizzato.
- I Node iOS/Android dovrebbero trattare le connessioni dirette basate sulla discovery come **solo TLS** e richiedere una conferma esplicita dell'utente prima di fidarsi di un fingerprint visto per la prima volta.

## Debug su macOS

Strumenti integrati utili:

- Navigare tra le istanze:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Risolvere una singola istanza (sostituisci `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Se la navigazione funziona ma la risoluzione fallisce, di solito stai incontrando un criterio LAN o
un problema del resolver mDNS.

## Debug nei log del Gateway

Il Gateway scrive un file di log rotante (stampato all'avvio come
`gateway log file: ...`). Cerca le righe `bonjour:`, in particolare:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Debug sul Node iOS

Il Node iOS usa `NWBrowser` per individuare `_openclaw-gw._tcp`.

Per acquisire i log:

- Impostazioni → Gateway → Avanzate → **Log di debug della discovery**
- Impostazioni → Gateway → Avanzate → **Log della discovery** → riproduci → **Copia**

Il log include le transizioni di stato del browser e le modifiche del set di risultati.

## Modalità di errore comuni

- **Bonjour non attraversa le reti**: usa Tailnet o SSH.
- **Multicast bloccato**: alcune reti Wi-Fi disabilitano mDNS.
- **Sleep / churn delle interfacce**: macOS può perdere temporaneamente i risultati mDNS; riprova.
- **La navigazione funziona ma la risoluzione fallisce**: mantieni semplici i nomi delle macchine (evita emoji o
  punteggiatura), poi riavvia il Gateway. Il nome dell'istanza del servizio deriva dal
  nome host, quindi nomi eccessivamente complessi possono confondere alcuni resolver.

## Nomi di istanza con escape (`\032`)

Bonjour/DNS-SD spesso esegue l'escape dei byte nei nomi di istanza del servizio come sequenze decimali `\DDD`
(ad es. gli spazi diventano `\032`).

- Questo è normale a livello di protocollo.
- Le UI dovrebbero decodificarli per la visualizzazione (iOS usa `BonjourEscapes.decode`).

## Disabilitazione / configurazione

- `openclaw plugins disable bonjour` disabilita l'annuncio multicast LAN disabilitando il Plugin incluso.
- `openclaw plugins enable bonjour` ripristina il Plugin di discovery LAN predefinito.
- `OPENCLAW_DISABLE_BONJOUR=1` disabilita l'annuncio multicast LAN senza modificare la configurazione del Plugin; i valori truthy accettati sono `1`, `true`, `yes` e `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` in `~/.openclaw/openclaw.json` controlla la modalità di bind del Gateway.
- `OPENCLAW_SSH_PORT` sovrascrive la porta SSH quando `sshPort` viene annunciato (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` pubblica un suggerimento MagicDNS in TXT quando la modalità mDNS full è abilitata (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` sovrascrive il percorso CLI annunciato (legacy: `OPENCLAW_CLI_PATH`).

## Documenti correlati

- Criteri di discovery e selezione del trasporto: [Discovery](/it/gateway/discovery)
- Abbinamento + approvazioni dei Node: [Abbinamento del Gateway](/it/gateway/pairing)
