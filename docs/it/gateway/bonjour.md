---
read_when:
    - Debug di problemi di individuazione Bonjour su macOS/iOS
    - Modifica di tipi di servizio mDNS, record TXT o UX di individuazione
summary: Individuazione Bonjour/mDNS + debug (beacon Gateway, client e modalità di errore comuni)
title: Individuazione Bonjour
x-i18n:
    generated_at: "2026-04-05T13:51:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f5a7f3211c74d4d10fdc570fc102b3c949c0ded9409c54995ab8820e5787f02
    source_path: gateway/bonjour.md
    workflow: 15
---

# Individuazione Bonjour / mDNS

OpenClaw usa Bonjour (mDNS / DNS-SD) per individuare un Gateway attivo (endpoint WebSocket).
La navigazione multicast `local.` è una **comodità solo LAN**. Per l'individuazione tra reti diverse, lo
stesso beacon può anche essere pubblicato tramite un dominio DNS-SD wide-area configurato. L'individuazione
rimane comunque best-effort e **non** sostituisce la connettività basata su SSH o Tailnet.

## Bonjour wide-area (Unicast DNS-SD) su Tailscale

Se il nodo e il gateway si trovano su reti diverse, l'mDNS multicast non attraverserà il
confine. Puoi mantenere la stessa UX di individuazione passando a **unicast DNS-SD**
("Wide-Area Bonjour") su Tailscale.

Passaggi di alto livello:

1. Esegui un server DNS sull'host gateway (raggiungibile tramite Tailnet).
2. Pubblica i record DNS-SD per `_openclaw-gw._tcp` sotto una zona dedicata
   (esempio: `openclaw.internal.`).
3. Configura il **split DNS** di Tailscale in modo che il dominio scelto venga risolto tramite quel
   server DNS per i client (incluso iOS).

OpenClaw supporta qualsiasi dominio di individuazione; `openclaw.internal.` è solo un esempio.
I nodi iOS/Android esplorano sia `local.` sia il dominio wide-area configurato.

### Configurazione Gateway (consigliata)

```json5
{
  gateway: { bind: "tailnet" }, // solo tailnet (consigliato)
  discovery: { wideArea: { enabled: true } }, // abilita la pubblicazione DNS-SD wide-area
}
```

### Configurazione iniziale una tantum del server DNS (host gateway)

```bash
openclaw dns setup --apply
```

Questo installa CoreDNS e lo configura per:

- ascoltare sulla porta 53 solo sulle interfacce Tailscale del gateway
- servire il dominio scelto (esempio: `openclaw.internal.`) da `~/.openclaw/dns/<domain>.db`

Valida da una macchina connessa alla tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Impostazioni DNS di Tailscale

Nella console di amministrazione Tailscale:

- Aggiungi un nameserver che punti all'IP tailnet del gateway (UDP/TCP 53).
- Aggiungi split DNS in modo che il dominio di individuazione usi quel nameserver.

Una volta che i client accettano il DNS tailnet, i nodi iOS e l'individuazione CLI possono esplorare
`_openclaw-gw._tcp` nel dominio di individuazione senza multicast.

### Sicurezza del listener Gateway (consigliata)

La porta WS del Gateway (predefinita `18789`) è associata a loopback per impostazione predefinita. Per l'accesso LAN/tailnet,
esegui un bind esplicito e mantieni l'autenticazione abilitata.

Per configurazioni solo tailnet:

- Imposta `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json`.
- Riavvia il Gateway (oppure riavvia l'app macOS nella barra dei menu).

## Cosa viene pubblicizzato

Solo il Gateway pubblicizza `_openclaw-gw._tcp`.

## Tipi di servizio

- `_openclaw-gw._tcp` — beacon di trasporto del gateway (usato dai nodi macOS/iOS/Android).

## Chiavi TXT (indizi non segreti)

Il Gateway pubblicizza piccoli indizi non segreti per rendere comodi i flussi UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (solo quando TLS è abilitato)
- `gatewayTlsSha256=<sha256>` (solo quando TLS è abilitato e l'impronta digitale è disponibile)
- `canvasPort=<port>` (solo quando il canvas host è abilitato; attualmente è uguale a `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (indizio facoltativo quando Tailnet è disponibile)
- `sshPort=<port>` (solo modalità mDNS full; wide-area DNS-SD può ometterlo)
- `cliPath=<path>` (solo modalità mDNS full; wide-area DNS-SD lo scrive comunque come indizio per l'installazione remota)

Note di sicurezza:

- I record TXT Bonjour/mDNS sono **non autenticati**. I client non devono trattare TXT come instradamento autorevole.
- I client dovrebbero instradare usando l'endpoint del servizio risolto (SRV + A/AAAA). Tratta `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` solo come indizi.
- Anche il targeting automatico SSH dovrebbe usare l'host del servizio risolto, non indizi solo TXT.
- Il pinning TLS non deve mai permettere a un `gatewayTlsSha256` pubblicizzato di sovrascrivere un pin precedentemente memorizzato.
- I nodi iOS/Android dovrebbero trattare le connessioni dirette basate sull'individuazione come **solo TLS** e richiedere una conferma esplicita dell'utente prima di fidarsi di un'impronta digitale vista per la prima volta.

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
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Debug sul nodo iOS

Il nodo iOS usa `NWBrowser` per individuare `_openclaw-gw._tcp`.

Per acquisire i log:

- Impostazioni → Gateway → Avanzate → **Log di debug dell'individuazione**
- Impostazioni → Gateway → Avanzate → **Log di individuazione** → riproduci → **Copia**

Il log include le transizioni di stato del browser e le modifiche del set di risultati.

## Modalità di errore comuni

- **Bonjour non attraversa le reti**: usa Tailnet o SSH.
- **Multicast bloccato**: alcune reti Wi-Fi disabilitano mDNS.
- **Sleep / cambiamenti delle interfacce**: macOS può temporaneamente perdere i risultati mDNS; riprova.
- **L'esplorazione funziona ma la risoluzione fallisce**: mantieni semplici i nomi delle macchine (evita emoji o
  punteggiatura), poi riavvia il Gateway. Il nome dell'istanza del servizio deriva dal
  nome host, quindi nomi eccessivamente complessi possono confondere alcuni resolver.

## Nomi di istanza con escape (`\032`)

Bonjour/DNS-SD spesso rappresenta i byte nei nomi di istanza del servizio con sequenze decimali `\DDD`
(ad esempio gli spazi diventano `\032`).

- Questo è normale a livello di protocollo.
- Le UI dovrebbero decodificarli per la visualizzazione (iOS usa `BonjourEscapes.decode`).

## Disabilitazione / configurazione

- `OPENCLAW_DISABLE_BONJOUR=1` disabilita la pubblicazione (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` in `~/.openclaw/openclaw.json` controlla la modalità di bind del Gateway.
- `OPENCLAW_SSH_PORT` sovrascrive la porta SSH quando `sshPort` viene pubblicizzato (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` pubblica un indizio MagicDNS in TXT (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` sovrascrive il percorso CLI pubblicizzato (legacy: `OPENCLAW_CLI_PATH`).

## Documentazione correlata

- Policy di individuazione e selezione del trasporto: [Discovery](/gateway/discovery)
- Pairing + approvazioni dei nodi: [Gateway pairing](/gateway/pairing)
