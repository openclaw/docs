---
read_when:
    - Debug dei problemi di rilevamento Bonjour su macOS/iOS
    - Modifica dei tipi di servizio mDNS, dei record TXT o dell'esperienza utente di rilevamento
summary: Rilevamento Bonjour/mDNS e debug (beacon del Gateway, client e modalità di errore comuni)
title: Rilevamento Bonjour
x-i18n:
    generated_at: "2026-07-12T07:00:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw può usare Bonjour (mDNS/DNS-SD) per rilevare un Gateway attivo (endpoint WebSocket). La ricerca multicast `local.` è una **funzionalità pratica limitata alla LAN**: il Plugin `bonjour` incluso gestisce l'annuncio sulla LAN, avviandosi automaticamente sugli host macOS e richiedendo l'attivazione esplicita su Linux, Windows e nelle distribuzioni containerizzate del Gateway. Lo stesso beacon può inoltre essere pubblicato tramite un dominio DNS-SD ad area estesa configurato, per il rilevamento tra reti diverse. Il rilevamento avviene secondo il principio del massimo impegno e **non** sostituisce la connettività basata su SSH o Tailnet.

## Bonjour ad area estesa (DNS-SD unicast) tramite Tailscale

Se il Node e il Gateway si trovano su reti diverse, il multicast mDNS non può attraversarne il confine. Mantieni la stessa esperienza di rilevamento passando al **DNS-SD unicast** ("Bonjour ad area estesa") tramite Tailscale:

1. Esegui un server DNS sull'host del Gateway, raggiungibile tramite Tailnet.
2. Pubblica i record DNS-SD per `_openclaw-gw._tcp` in una zona dedicata (esempio: `openclaw.internal.`).
3. Configura lo **split DNS** di Tailscale affinché il dominio scelto venga risolto tramite tale server DNS per i client, incluso iOS.

`openclaw.internal.` qui sopra è solo un esempio: OpenClaw supporta qualsiasi dominio di rilevamento. I Node iOS/Android esplorano sia `local.` sia il dominio ad area estesa configurato.

### Configurazione del Gateway

```json5
{
  gateway: { bind: "tailnet" }, // solo Tailnet (consigliato)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

Quando non è impostato, `discovery.wideArea.domain` accetta inoltre la variabile di ambiente `OPENCLAW_WIDE_AREA_DOMAIN` come ripiego.

### Configurazione iniziale del server DNS (host del Gateway, solo macOS)

```bash
openclaw dns setup --apply
```

Questo comando è disponibile solo su macOS e richiede Homebrew e una connessione Tailscale attiva. Installa CoreDNS (`brew install coredns`) e lo configura per:

- restare in ascolto sulla porta 53 esclusivamente sulle interfacce Tailscale del Gateway
- servire il dominio scelto (esempio: `openclaw.internal.`) da `~/.openclaw/dns/<domain>.db`

Esegui prima il comando senza `--apply` per visualizzare in anteprima il piano (dominio, percorso del file di zona, IP Tailnet rilevato, configurazione consigliata) senza installare nulla.

Esegui la convalida da una macchina connessa a Tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Impostazioni DNS di Tailscale

Nella console di amministrazione di Tailscale:

- Aggiungi un server dei nomi che punti all'IP Tailnet del Gateway (UDP/TCP 53).
- Aggiungi lo split DNS affinché il dominio di rilevamento utilizzi tale server dei nomi.

Quando i client accettano il DNS di Tailnet, i Node iOS e il rilevamento tramite CLI possono esplorare `_openclaw-gw._tcp` nel dominio di rilevamento senza multicast.

### Sicurezza del listener del Gateway

La porta WS del Gateway (predefinita: `18789`) si associa per impostazione predefinita al local loopback. Per l'accesso tramite LAN/Tailnet, configura esplicitamente l'associazione e mantieni attiva l'autenticazione. Per le configurazioni limitate a Tailnet, imposta `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json` e riavvia il Gateway (o l'app della barra dei menu di macOS).

## Elementi annunciati

Solo il Gateway annuncia `_openclaw-gw._tcp`. Quando è attivo, l'annuncio multicast sulla LAN proviene dal Plugin `bonjour` incluso; la pubblicazione DNS-SD ad area estesa resta gestita dal Gateway.

## Tipi di servizio

- `_openclaw-gw._tcp` - beacon di trasporto del Gateway, usato dai Node macOS/iOS/Android.

## Chiavi TXT (indicazioni non segrete)

| Chiave                        | Quando è presente                                                              |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | Sempre.                                                                        |
| `displayName=<friendly name>` | Sempre.                                                                        |
| `lanHost=<hostname>.local`    | Sempre.                                                                        |
| `gatewayPort=<port>`          | Sempre (WS + HTTP del Gateway).                                                |
| `transport=gateway`           | Sempre.                                                                        |
| `gatewayTls=1`                | Solo quando TLS è attivo.                                                      |
| `gatewayTlsSha256=<sha256>`   | Solo quando TLS è attivo ed è disponibile un'impronta digitale.                |
| `gatewayDirectReachable=1`    | Solo quando il Gateway è raggiungibile direttamente (non esclusivamente tramite un percorso relay/proxy). |
| `canvasPort=<port>`           | Solo quando l'host canvas è attivo; attualmente coincide con `gatewayPort`.    |
| `tailnetDns=<magicdns>`       | Solo in modalità mDNS completa; indicazione facoltativa quando Tailnet è disponibile. |
| `sshPort=<port>`              | Solo in modalità completa; omessa nelle modalità minima e disattivata.         |
| `cliPath=<path>`              | Solo in modalità completa; omessa nelle modalità minima e disattivata.         |

Note sulla sicurezza:

- I record TXT di Bonjour/mDNS **non sono autenticati**. I client non devono considerare i dati TXT autorevoli per l'instradamento.
- I client devono instradare usando l'endpoint del servizio risolto (SRV + A/AAAA). Considera `lanHost`, `tailnetDns`, `gatewayPort` e `gatewayTlsSha256` soltanto come indicazioni.
- Anche la selezione automatica della destinazione SSH deve usare l'host del servizio risolto, non indicazioni provenienti esclusivamente dai dati TXT.
- Il pinning TLS non deve mai consentire a un valore `gatewayTlsSha256` annunciato di sostituire un pin memorizzato in precedenza.
- I Node iOS/Android devono considerare le connessioni dirette basate sul rilevamento come **esclusivamente TLS** e richiedere la conferma esplicita dell'utente prima di considerare attendibile un'impronta digitale rilevata per la prima volta.

## Debug su macOS

Strumenti integrati:

```bash
# Esplora le istanze
dns-sd -B _openclaw-gw._tcp local.

# Risolvi un'istanza (sostituisci <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Se l'esplorazione funziona ma la risoluzione non riesce, in genere il problema riguarda un criterio della LAN o il resolver mDNS.

## Debug nei log del Gateway

Il Gateway scrive un file di log a rotazione (indicato all'avvio come `gateway log file: ...`). Cerca le righe contenenti `bonjour:`, in particolare:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Il watchdog considera gli stati attivi `probing`, `announcing` e le ridenominazioni recenti dovute a conflitti come stati in corso. Se il servizio non raggiunge mai lo stato `announced`, OpenClaw ricrea l'istanza di annuncio e, dopo errori ripetuti, disattiva Bonjour per quel processo del Gateway anziché continuare a ripubblicare l'annuncio indefinitamente.

Bonjour usa il nome host di sistema per l'host `.local` annunciato quando si tratta di un'etichetta DNS valida. Se il nome host di sistema contiene spazi, trattini bassi o un altro carattere non valido per un'etichetta DNS, OpenClaw usa come ripiego `openclaw.local`. Imposta `OPENCLAW_MDNS_HOSTNAME=<name>` prima di avviare il Gateway quando ti occorre un'etichetta host esplicita.

## Debug sul Node iOS

Il Node iOS usa `NWBrowser` per rilevare `_openclaw-gw._tcp`.

Per acquisire i log: Settings -> Gateway -> Advanced -> **Discovery Debug Logs**, quindi Settings -> Gateway -> Advanced -> **Discovery Logs** -> riproduci il problema -> **Copy**. Il log include le transizioni di stato del browser e le modifiche all'insieme dei risultati.

## Quando attivare Bonjour

Bonjour si avvia automaticamente quando il Gateway viene avviato con una configurazione vuota su host macOS, poiché l'app locale e i Node iOS/Android nelle vicinanze usano comunemente il rilevamento sulla stessa LAN.

Attivalo esplicitamente quando il rilevamento automatico sulla stessa LAN è utile su Linux, Windows o un altro host non macOS:

```bash
openclaw plugins enable bonjour
```

Quando è attivo, Bonjour usa `discovery.mdns.mode` per determinare quanti metadati TXT pubblicare; la stessa modalità controlla le indicazioni TXT facoltative nei record DNS-SD ad area estesa. Modalità:

| Modalità            | Comportamento                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (predefinita) | Solo le chiavi TXT principali; omette `sshPort`, `cliPath`, `tailnetDns`.                                                                                  |
| `full`              | Aggiunge `sshPort`, `cliPath`, `tailnetDns`: usala quando i client necessitano di queste indicazioni.                                                         |
| `off`               | Sopprime il multicast sulla LAN senza modificare l'attivazione del Plugin; il DNS-SD ad area estesa può comunque pubblicare il beacon minimo quando `discovery.wideArea.enabled` è true. |

## Quando disattivare Bonjour

Lascia Bonjour disattivato quando l'annuncio multicast sulla LAN è superfluo, non disponibile o dannoso; casi comuni sono server non macOS, reti bridge Docker, WSL o criteri di rete che bloccano il multicast mDNS. Il Gateway rimane raggiungibile tramite l'URL pubblicato, SSH, Tailnet o DNS-SD ad area estesa; soltanto il rilevamento automatico sulla LAN risulta inaffidabile.

Usa la sostituzione tramite variabile di ambiente per problemi circoscritti alla distribuzione (sicura per immagini Docker, file di servizio, script di avvio e debug occasionale: scompare insieme all'ambiente):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Usa la configurazione del Plugin quando intendi disattivare deliberatamente il Plugin di rilevamento sulla LAN incluso per quella configurazione di OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Aspetti insidiosi di Docker

Il Plugin Bonjour incluso disattiva automaticamente l'annuncio multicast sulla LAN nei container rilevati quando `OPENCLAW_DISABLE_BONJOUR` non è impostata. Le reti bridge Docker in genere non inoltrano il multicast mDNS (`224.0.0.251:5353`) tra il container e la LAN, quindi l'annuncio dal container raramente rende operativo il rilevamento.

Aspetti insidiosi:

- Bonjour si avvia automaticamente sugli host macOS e richiede l'attivazione esplicita altrove. Lasciarlo disattivato non arresta il Gateway: evita soltanto l'annuncio multicast sulla LAN.
- La disattivazione di Bonjour non modifica `gateway.bind`; Docker usa comunque per impostazione predefinita `OPENCLAW_GATEWAY_BIND=lan`, affinché la porta host pubblicata funzioni.
- La disattivazione di Bonjour non disattiva il DNS-SD ad area estesa. Usa il rilevamento ad area estesa o Tailnet quando il Gateway e il Node non si trovano sulla stessa LAN.
- Il riutilizzo della stessa `OPENCLAW_CONFIG_DIR` all'esterno di Docker non rende persistente il criterio di disattivazione automatica del container.
- Imposta `OPENCLAW_DISABLE_BONJOUR=0` solo per la rete host, macvlan o un'altra rete in cui è noto che il multicast mDNS transiti; impostala su `1` per forzare la disattivazione.

## Risoluzione dei problemi con Bonjour disattivato

Se un Node non rileva più automaticamente il Gateway dopo la configurazione di Docker:

1. Verifica se il Gateway è in modalità automatica, forzatamente attiva o forzatamente disattiva:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Verifica che il Gateway sia raggiungibile tramite la porta pubblicata:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Usa una destinazione diretta quando Bonjour è disattivato:
   - Interfaccia di controllo o strumenti locali: `http://127.0.0.1:18789`
   - Client LAN: `http://<gateway-host>:18789`
   - Client su reti diverse: MagicDNS di Tailnet, IP Tailnet, tunnel SSH o DNS-SD ad area estesa

4. Se hai attivato deliberatamente il Plugin Bonjour in Docker e forzato l'annuncio con `OPENCLAW_DISABLE_BONJOUR=0`, verifica il multicast dall'host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Se l'esplorazione non restituisce risultati o i log del Gateway mostrano ripetute cancellazioni del watchdog ciao, ripristina `OPENCLAW_DISABLE_BONJOUR=1` e usa un percorso diretto o tramite Tailnet.

## Modalità di errore comuni

- **Bonjour non attraversa le reti**: usa Tailnet o SSH.
- **Multicast bloccato**: alcune reti Wi-Fi disabilitano mDNS.
- **L'annunciatore rimane bloccato durante il rilevamento o l'annuncio**: host con multicast bloccato, bridge di container, WSL o frequenti cambi di interfaccia possono lasciare l'annunciatore ciao in uno stato non annunciato. OpenClaw riprova alcune volte, quindi disabilita Bonjour per il processo Gateway corrente anziché riavviare indefinitamente l'annunciatore.
- **Rete bridge di Docker**: Bonjour si disabilita automaticamente nei container rilevati. Imposta `OPENCLAW_DISABLE_BONJOUR=0` solo per reti host, macvlan o altre reti compatibili con mDNS.
- **Sospensione o cambi di interfaccia**: macOS può perdere temporaneamente i risultati mDNS; riprova.
- **La ricerca funziona, ma la risoluzione non riesce**: usa nomi macchina semplici (evita emoji o segni di punteggiatura), quindi riavvia il Gateway. Il nome dell'istanza del servizio deriva dal nome host, pertanto nomi eccessivamente complessi possono confondere alcuni resolver.

## Nomi di istanza con caratteri di escape (`\032`)

Bonjour/DNS-SD spesso rappresenta i byte nei nomi delle istanze di servizio tramite sequenze decimalii `\DDD` (gli spazi diventano `\032`). Ciò è normale a livello di protocollo; le interfacce utente dovrebbero decodificarle per la visualizzazione (iOS usa `BonjourEscapes.decode`).

## Attivazione / disattivazione / configurazione

| Impostazione                                         | Effetto                                                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `openclaw plugins enable bonjour`                    | Attiva il Plugin integrato di rilevamento LAN sugli host in cui non è attivo per impostazione predefinita.    |
| `openclaw plugins disable bonjour`                   | Disattiva l'annuncio multicast LAN disabilitando il Plugin integrato.                                        |
| `OPENCLAW_DISABLE_BONJOUR=1` (o `true`/`yes`/`on`)   | Disattiva l'annuncio multicast LAN senza modificare la configurazione del Plugin.                            |
| `OPENCLAW_DISABLE_BONJOUR=0` (o `false`/`no`/`off`)  | Forza l'attivazione dell'annuncio multicast LAN, anche all'interno dei container rilevati.                   |
| `discovery.mdns.mode`                                | `off` \| `minimal` (impostazione predefinita) \| `full` — consulta le modalità descritte sopra.              |
| `gateway.bind`                                       | Controlla la modalità di associazione del Gateway in `~/.openclaw/openclaw.json`.                            |
| `OPENCLAW_SSH_PORT`                                  | Sostituisce la porta SSH quando viene annunciato `sshPort` (modalità completa).                              |
| `OPENCLAW_TAILNET_DNS`                               | Pubblica un suggerimento MagicDNS nel record TXT quando è attiva la modalità completa di mDNS.               |
| `OPENCLAW_CLI_PATH`                                  | Sostituisce il percorso CLI annunciato (modalità completa).                                                  |

Per impostazione predefinita, gli host macOS avviano automaticamente il Plugin integrato di rilevamento LAN. Quando il Plugin Bonjour è attivato e `OPENCLAW_DISABLE_BONJOUR` non è impostata, Bonjour effettua l'annuncio sugli host normali e si disabilita automaticamente all'interno dei container rilevati (Docker, macchine Fly.io e runtime per container comuni).

## Documentazione correlata

- Criteri di rilevamento e selezione del trasporto: [Rilevamento](/it/gateway/discovery)
- Associazione dei Node e approvazioni: [Associazione del Gateway](/it/gateway/pairing)
