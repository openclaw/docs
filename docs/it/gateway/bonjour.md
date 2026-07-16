---
read_when:
    - Debug dei problemi di rilevamento Bonjour su macOS/iOS
    - Modifica dei tipi di servizio mDNS, dei record TXT o dell'esperienza utente di rilevamento
summary: Rilevamento Bonjour/mDNS + debug (beacon del Gateway, client e modalità di errore comuni)
title: Rilevamento Bonjour
x-i18n:
    generated_at: "2026-07-16T14:11:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 42a46dc34e94dc86ee0432b12fcb59b3855371c745d79825a00aa557e1369160
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw può usare Bonjour (mDNS/DNS-SD) per rilevare un Gateway attivo (endpoint WebSocket). La ricerca multicast `local.` è una **funzionalità di praticità limitata alla LAN**: il Plugin `bonjour` incluso gestisce l'annuncio sulla LAN, avviandosi automaticamente sugli host macOS e su richiesta nelle distribuzioni del Gateway su Linux, Windows e container. Lo stesso beacon può anche essere pubblicato tramite un dominio DNS-SD geografico configurato per il rilevamento tra reti diverse. Il rilevamento avviene in modalità best effort e **non** sostituisce la connettività basata su SSH o Tailnet.

## Bonjour geografico (DNS-SD unicast) tramite Tailscale

Se il Node e il Gateway si trovano su reti diverse, mDNS multicast non può attraversare il confine. Per mantenere la stessa esperienza di rilevamento, passare a **DNS-SD unicast** ("Wide-Area Bonjour") tramite Tailscale:

1. Eseguire un server DNS sull'host del Gateway, raggiungibile tramite Tailnet.
2. Pubblicare i record DNS-SD per `_openclaw-gw._tcp` in una zona dedicata (esempio: `openclaw.internal.`).
3. Configurare lo **split DNS** di Tailscale affinché il dominio scelto venga risolto tramite tale server DNS per i client, incluso iOS.

`openclaw.internal.` riportato sopra è solo un esempio: OpenClaw supporta qualsiasi dominio di rilevamento. I Node iOS/Android esplorano sia `local.` sia il dominio geografico configurato.

### Configurazione del Gateway

```json5
{
  gateway: { bind: "tailnet" }, // solo tailnet (consigliato)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain` accetta anche la variabile d'ambiente `OPENCLAW_WIDE_AREA_DOMAIN` come soluzione di riserva quando non è impostato.

### Configurazione una tantum del server DNS (host del Gateway, solo macOS)

```bash
openclaw dns setup --apply
```

Questo comando è disponibile solo su macOS e richiede Homebrew e una connessione Tailscale attiva. Installa CoreDNS (`brew install coredns`) e lo configura per:

- ascoltare sulla porta 53 solo sulle interfacce Tailscale del Gateway
- servire il dominio scelto (esempio: `openclaw.internal.`) da `~/.openclaw/dns/<domain>.db`

Eseguire prima il comando senza `--apply` per visualizzare in anteprima il piano (dominio, percorso del file di zona, IP Tailnet rilevato, configurazione consigliata) senza installare nulla.

Verificare da una macchina connessa a Tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Impostazioni DNS di Tailscale

Nella console di amministrazione di Tailscale:

- Aggiungere un nameserver che punti all'IP Tailnet del Gateway (UDP/TCP 53).
- Aggiungere lo split DNS affinché il dominio di rilevamento usi tale nameserver.

Dopo che i client accettano il DNS Tailnet, i Node iOS e il rilevamento tramite CLI possono esplorare `_openclaw-gw._tcp` nel dominio di rilevamento senza multicast.

### Sicurezza del listener del Gateway

La porta WS del Gateway (predefinita `18789`) viene associata a loopback per impostazione predefinita. Per l'accesso tramite LAN/Tailnet, configurare esplicitamente l'associazione e mantenere abilitata l'autenticazione. Per le configurazioni limitate a Tailnet, impostare `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json` e riavviare il Gateway (o l'app della barra dei menu di macOS).

## Cosa viene annunciato

Solo il Gateway annuncia `_openclaw-gw._tcp`. Quando è abilitato, l'annuncio multicast sulla LAN proviene dal Plugin `bonjour` incluso; la pubblicazione DNS-SD geografica rimane gestita dal Gateway.

## Tipi di servizio

- `_openclaw-gw._tcp` - beacon del trasporto del Gateway, usato dai Node macOS/iOS/Android.

## Chiavi TXT (indicazioni non segrete)

| Chiave                           | Quando è presente                                                             |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | Sempre.                                                                        |
| `displayName=<friendly name>` | Sempre.                                                                        |
| `lanHost=<hostname>.local`    | Sempre.                                                                        |
| `gatewayPort=<port>`          | Sempre (WS + HTTP del Gateway).                                                |
| `transport=gateway`           | Sempre.                                                                        |
| `gatewayTls=1`                | Solo quando TLS è abilitato.                                                   |
| `gatewayTlsSha256=<sha256>`   | Solo quando TLS è abilitato ed è disponibile un'impronta digitale.             |
| `gatewayDirectReachable=1`    | Solo quando il Gateway è direttamente raggiungibile (non esclusivamente tramite un percorso relay/proxy). |
| `canvasPort=<port>`           | Solo quando l'host canvas è abilitato; attualmente coincide con `gatewayPort`. |
| `tailnetDns=<magicdns>`       | Solo modalità mDNS completa; indicazione facoltativa quando Tailnet è disponibile. |
| `sshPort=<port>`              | Solo modalità completa; omessa nelle modalità minima e disattivata.            |
| `cliPath=<path>`              | Solo modalità completa; omessa nelle modalità minima e disattivata.            |

Note sulla sicurezza:

- I record TXT Bonjour/mDNS **non sono autenticati**. I client non devono considerare TXT una fonte autorevole per l'instradamento.
- I client devono effettuare l'instradamento usando l'endpoint del servizio risolto (SRV + A/AAAA). Considerare `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` esclusivamente come indicazioni.
- Anche la selezione automatica della destinazione SSH deve usare l'host del servizio risolto, non indicazioni provenienti esclusivamente da TXT.
- Il pinning TLS non deve mai consentire a un `gatewayTlsSha256` annunciato di sostituire un pin memorizzato in precedenza.
- I Node iOS/Android devono considerare le connessioni dirette basate sul rilevamento come **esclusivamente TLS** e richiedere la conferma esplicita dell'utente prima di considerare attendibile un'impronta digitale rilevata per la prima volta.

## Debug su macOS

Strumenti integrati:

```bash
# Esplora le istanze
dns-sd -B _openclaw-gw._tcp local.

# Risolvi un'istanza (sostituire <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Se l'esplorazione funziona ma la risoluzione non riesce, in genere si tratta di un problema relativo ai criteri della LAN o al resolver mDNS.

## Debug nei log del Gateway

Il Gateway scrive un file di log a rotazione (indicato all'avvio come `gateway log file: ...`). Cercare le righe `bonjour:`, in particolare:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao netmask assertion ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`

OpenClaw avvia una sola volta ogni servizio Bonjour e delega al responder mDNS il probing, i nuovi tentativi, la risoluzione dei conflitti di nome e la nuova pubblicazione in seguito alle modifiche delle interfacce. Ciò evita tentativi di pubblicazione sovrapposti durante le normali variazioni della rete. I messaggi interni ripetuti di self-probe vengono soppressi affinché non possano inondare il log del Gateway.

Quando più Gateway OpenClaw effettuano annunci dallo stesso host, Bonjour può aggiungere suffissi come `(2)` o `(3)` per mantenere univoci i nomi delle istanze del servizio. Questi suffissi sono il normale risultato della risoluzione dei conflitti e non indicano una supervisione OCM duplicata.

Bonjour usa il nome host di sistema per l'host `.local` annunciato quando costituisce un'etichetta DNS valida. Se il nome host di sistema contiene spazi, caratteri di sottolineatura o un altro carattere non valido per un'etichetta DNS, OpenClaw usa `openclaw.local` come soluzione di riserva. Impostare `OPENCLAW_MDNS_HOSTNAME=<name>` prima di avviare il Gateway quando è necessaria un'etichetta host esplicita.

## Debug sul Node iOS

Il Node iOS usa `NWBrowser` per rilevare `_openclaw-gw._tcp`.

Per acquisire i log: Settings -> Gateway -> Advanced -> **Discovery Debug Logs**, quindi Settings -> Gateway -> Advanced -> **Discovery Logs** -> riprodurre il problema -> **Copy**. Il log include le transizioni di stato del browser e le modifiche all'insieme dei risultati.

## Quando abilitare Bonjour

Bonjour si avvia automaticamente quando il Gateway viene avviato con una configurazione vuota su host macOS, poiché l'app locale e i Node iOS/Android nelle vicinanze si affidano comunemente al rilevamento sulla stessa LAN.

Abilitarlo esplicitamente quando il rilevamento automatico sulla stessa LAN è utile su Linux, Windows o un altro host non macOS:

```bash
openclaw plugins enable bonjour
```

Quando è abilitato, Bonjour usa `discovery.mdns.mode` per determinare quanti metadati TXT pubblicare; la stessa modalità controlla le indicazioni TXT facoltative nei record DNS-SD geografici. Modalità:

| Modalità                | Comportamento                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (predefinita) | Solo chiavi TXT di base; omette `sshPort`, `cliPath`, `tailnetDns`.                                                                                          |
| `full`              | Aggiunge `sshPort`, `cliPath`, `tailnetDns`: usare quando i client necessitano di tali indicazioni.                                                          |
| `off`               | Sopprime il multicast LAN senza modificare l'abilitazione del Plugin; DNS-SD geografico può comunque pubblicare il beacon minimo quando `discovery.wideArea.enabled` è true. |

## Quando disabilitare Bonjour

Lasciare Bonjour disabilitato quando l'annuncio multicast sulla LAN non è necessario, non è disponibile o è dannoso; i casi comuni includono server non macOS, reti bridge Docker, WSL o criteri di rete che bloccano il multicast mDNS. Il Gateway rimane raggiungibile tramite l'URL pubblicato, SSH, Tailnet o DNS-SD geografico; solo il rilevamento automatico sulla LAN risulta inaffidabile.

Usare la sostituzione tramite variabile d'ambiente per problemi limitati alla distribuzione (sicura per immagini Docker, file di servizio, script di avvio e debug una tantum: scompare insieme all'ambiente):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Usare la configurazione del Plugin quando si intende disattivare il Plugin di rilevamento LAN incluso per quella configurazione di OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Insidie di Docker

Il Plugin Bonjour incluso disabilita automaticamente l'annuncio multicast sulla LAN nei container rilevati quando `OPENCLAW_DISABLE_BONJOUR` non è impostato. Le reti bridge Docker in genere non inoltrano il multicast mDNS (`224.0.0.251:5353`) tra il container e la LAN, pertanto l'annuncio dal container raramente consente il funzionamento del rilevamento.

Insidie:

- Bonjour si avvia automaticamente sugli host macOS ed è su richiesta altrove. Lasciarlo disabilitato non arresta il Gateway: evita soltanto l'annuncio multicast sulla LAN.
- La disabilitazione di Bonjour non modifica `gateway.bind`; Docker continua a usare `OPENCLAW_GATEWAY_BIND=lan` per impostazione predefinita, consentendo il funzionamento della porta host pubblicata.
- La disabilitazione di Bonjour non disabilita DNS-SD geografico. Usare il rilevamento geografico o Tailnet quando il Gateway e il Node non si trovano sulla stessa LAN.
- Il riutilizzo dello stesso `OPENCLAW_CONFIG_DIR` al di fuori di Docker non mantiene il criterio di disabilitazione automatica del container.
- Impostare `OPENCLAW_DISABLE_BONJOUR=0` solo per reti host, macvlan o un'altra rete in cui sia noto che il multicast mDNS viene trasmesso; impostarlo su `1` per forzare la disabilitazione.

## Risoluzione dei problemi con Bonjour disabilitato

Se un Node non rileva più automaticamente il Gateway dopo la configurazione di Docker:

1. Verificare se il Gateway è in esecuzione in modalità automatica, forzatamente attiva o forzatamente disattiva:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Verificare che il Gateway stesso sia raggiungibile tramite la porta pubblicata:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Usare una destinazione diretta quando Bonjour è disabilitato:
   - Control UI o strumenti locali: `http://127.0.0.1:18789`
   - Client LAN: `http://<gateway-host>:18789`
   - Client tra reti diverse: Tailnet MagicDNS, IP Tailnet, tunnel SSH o DNS-SD geografico

4. Se il Plugin Bonjour è stato abilitato intenzionalmente in Docker e l'annuncio è stato forzato con `OPENCLAW_DISABLE_BONJOUR=0`, verificare il multicast dall'host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Se l'esplorazione non restituisce risultati o i log del Gateway mostrano ripetuti errori di probing di ciao, ripristinare `OPENCLAW_DISABLE_BONJOUR=1` e usare un percorso diretto o Tailnet.

## Modalità di errore comuni

- **Bonjour non attraversa le reti**: usare Tailnet o SSH.
- **Multicast bloccato**: alcune reti Wi-Fi disabilitano mDNS.
- **Advertiser bloccato nella fase di probing/annuncio**: host con multicast bloccato, bridge di container, WSL o frequenti cambiamenti delle interfacce possono lasciare il responder in uno stato non annunciato. Il Gateway rimane disponibile tramite connessioni dirette, SSH, Tailnet o percorsi DNS-SD geografici; disabilitare Bonjour sulla LAN con `discovery.mdns.mode: "off"` o `OPENCLAW_DISABLE_BONJOUR=1` quando il multicast non è disponibile.
- **Rete bridge di Docker**: Bonjour si disabilita automaticamente nei container rilevati. Impostare `OPENCLAW_DISABLE_BONJOUR=0` solo per reti host, macvlan o altre reti compatibili con mDNS.
- **Sospensione/cambiamenti delle interfacce**: macOS può perdere temporaneamente i risultati mDNS; riprovare.
- **La ricerca funziona ma la risoluzione non riesce**: mantenere semplici i nomi delle macchine (evitare emoji o punteggiatura), quindi riavviare il Gateway. Il nome dell'istanza del servizio deriva dal nome host, quindi nomi eccessivamente complessi possono confondere alcuni resolver.

## Nomi delle istanze con sequenze di escape (`\032`)

Bonjour/DNS-SD spesso rappresenta i byte nei nomi delle istanze dei servizi tramite sequenze decimali `\DDD` (gli spazi diventano `\032`). È normale a livello di protocollo; le interfacce utente dovrebbero decodificarle per la visualizzazione (iOS usa `BonjourEscapes.decode`).

## Attivazione / disattivazione / configurazione

| Impostazione                                         | Effetto                                                                           |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Attiva il Plugin integrato per il rilevamento LAN sugli host in cui non è attivo per impostazione predefinita. |
| `openclaw plugins disable bonjour`                   | Disattiva l'annuncio multicast sulla LAN disabilitando il Plugin integrato.       |
| `OPENCLAW_DISABLE_BONJOUR=1` (o `true`/`yes`/`on`)  | Disattiva l'annuncio multicast sulla LAN senza modificare la configurazione del Plugin. |
| `OPENCLAW_DISABLE_BONJOUR=0` (o `false`/`no`/`off`) | Forza l'attivazione dell'annuncio multicast sulla LAN, anche all'interno dei container rilevati. |
| `discovery.mdns.mode`                                | `off` \| `minimal` (impostazione predefinita) \| `full` — vedere le modalità sopra. |
| `gateway.bind`                                       | Controlla la modalità di associazione del Gateway in `~/.openclaw/openclaw.json`.          |
| `OPENCLAW_SSH_PORT`                                  | Sostituisce la porta SSH quando viene annunciato `sshPort` (modalità completa). |
| `OPENCLAW_TAILNET_DNS`                               | Pubblica un suggerimento MagicDNS in TXT quando è attiva la modalità mDNS completa. |
| `OPENCLAW_CLI_PATH`                                  | Sostituisce il percorso CLI annunciato (modalità completa).                       |

Per impostazione predefinita, gli host macOS avviano automaticamente il Plugin integrato per il rilevamento LAN. Quando il Plugin Bonjour è attivo e `OPENCLAW_DISABLE_BONJOUR` non è impostato, Bonjour effettua l'annuncio sugli host normali e si disabilita automaticamente all'interno dei container rilevati (Docker, macchine Fly.io e runtime di container comuni).

## Documentazione correlata

- Criteri di rilevamento e selezione del trasporto: [Rilevamento](/it/gateway/discovery)
- Associazione dei Node e approvazioni: [Associazione del Gateway](/it/gateway/pairing)
