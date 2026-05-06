---
read_when:
    - Vuoi una difesa in profondità contro gli attacchi SSRF e di DNS rebinding
    - Configurazione di un proxy forward esterno per il traffico di runtime di OpenClaw
summary: Come instradare il traffico HTTP e WebSocket di runtime di OpenClaw attraverso un proxy di filtraggio gestito dall'operatore
title: Proxy di rete
x-i18n:
    generated_at: "2026-05-06T09:08:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: d733c690b5f86ef62fe7a35d38fbfcd07910970bca12ca6f74fdb26c8ec4557b
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy di rete

OpenClaw può instradare il traffico HTTP e WebSocket di runtime attraverso un proxy forward gestito dall’operatore. Questa è una difesa opzionale a più livelli per distribuzioni che vogliono controllo centralizzato dell’egress, protezione SSRF più forte e migliore verificabilità della rete.

OpenClaw non include, scarica, avvia, configura o certifica un proxy. Esegui la tecnologia proxy adatta al tuo ambiente, e OpenClaw instrada attraverso di essa i normali client HTTP e WebSocket locali al processo.

## Perché usare un proxy?

Un proxy offre agli operatori un unico punto di controllo di rete per il traffico HTTP e WebSocket in uscita. Può essere utile anche oltre all’irrobustimento contro SSRF:

- Policy centralizzata: mantieni una sola policy di egress invece di affidarti a ogni punto di chiamata HTTP dell’applicazione perché applichi correttamente le regole di rete.
- Controlli al momento della connessione: valuta la destinazione dopo la risoluzione DNS e subito prima che il proxy apra la connessione upstream.
- Difesa dal DNS rebinding: riduci il divario tra un controllo DNS a livello applicativo e la connessione in uscita effettiva.
- Copertura JavaScript più ampia: instrada normali client `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch e simili attraverso lo stesso percorso.
- Verificabilità: registra le destinazioni consentite e negate al perimetro di egress.
- Controllo operativo: applica regole di destinazione, segmentazione di rete, limiti di frequenza o allowlist in uscita senza ricompilare OpenClaw.

L’instradamento proxy è una protezione a livello di processo per il normale egress HTTP e WebSocket. Offre agli operatori un percorso fail-closed per instradare i client HTTP JavaScript supportati attraverso il proprio proxy di filtraggio, ma non è una sandbox di rete a livello di sistema operativo e non fa sì che OpenClaw certifichi la policy di destinazione del proxy.

## Come OpenClaw instrada il traffico

Quando `proxy.enabled=true` e un URL proxy è configurato, i processi di runtime protetti come `openclaw gateway run`, `openclaw node run` e `openclaw agent --local` instradano il normale egress HTTP e WebSocket attraverso il proxy configurato:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Il contratto pubblico è il comportamento di instradamento, non gli hook interni di Node usati per implementarlo. I client WebSocket del piano di controllo del Gateway di OpenClaw usano un percorso diretto ristretto per il traffico RPC del Gateway local loopback quando l’URL del Gateway usa `localhost` o un IP loopback letterale come `127.0.0.1` o `[::1]`. Quel percorso del piano di controllo deve poter raggiungere i Gateway loopback anche quando il proxy dell’operatore blocca le destinazioni loopback. Le normali richieste HTTP e WebSocket di runtime continuano a usare il proxy configurato.

Internamente, OpenClaw usa due hook di instradamento a livello di processo per questa funzionalità:

- L’instradamento del dispatcher Undici copre `fetch`, i client basati su undici e i transport che forniscono il proprio dispatcher undici.
- L’instradamento `global-agent` copre i chiamanti Node core `node:http` e `node:https`, incluse molte librerie basate su `http.request`, `https.request`, `http.get` e `https.get`. La modalità proxy gestita forza quell’agent globale, così gli agent HTTP Node espliciti non aggirano accidentalmente il proxy dell’operatore.

Alcuni plugin possiedono transport personalizzati che richiedono un cablaggio esplicito del proxy anche quando esiste l’instradamento a livello di processo. Per esempio, il transport Bot API di Telegram usa il proprio dispatcher undici HTTP/1 e quindi rispetta l’ambiente proxy di processo più il fallback gestito `OPENCLAW_PROXY_URL` in quel percorso di transport specifico del proprietario.

L’URL del proxy deve usare `http://`. Le destinazioni HTTPS sono comunque supportate attraverso il proxy con HTTP `CONNECT`; questo significa solo che OpenClaw si aspetta un listener proxy forward HTTP in chiaro, come `http://127.0.0.1:3128`.

Mentre il proxy è attivo, OpenClaw cancella `no_proxy`, `NO_PROXY` e `GLOBAL_AGENT_NO_PROXY`. Queste liste di bypass sono basate sulla destinazione, quindi lasciare lì `localhost` o `127.0.0.1` consentirebbe a target SSRF ad alto rischio di saltare il proxy di filtraggio.

All’arresto, OpenClaw ripristina l’ambiente proxy precedente e reimposta lo stato di instradamento del processo memorizzato nella cache.

## Termini correlati al proxy

- `proxy.enabled` / `proxy.proxyUrl`: instradamento tramite proxy forward in uscita per l’egress di runtime di OpenClaw. Questa pagina documenta tale funzionalità.
- `gateway.auth.mode: "trusted-proxy"`: autenticazione in ingresso tramite reverse proxy consapevole dell’identità per l’accesso al Gateway. Consulta [Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy di debug locale e ispettore di cattura per sviluppo e supporto. Consulta [openclaw proxy](/it/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opt-in per `web_fetch` che consente a un proxy env HTTP(S) controllato dall’operatore di risolvere il DNS mantenendo il pinning DNS rigoroso predefinito e la policy sui nomi host. Consulta [Web fetch](/it/tools/web-fetch#trusted-env-proxy).
- Impostazioni proxy specifiche del canale o del provider: override specifici del proprietario per un determinato transport. Preferisci il proxy di rete gestito quando l’obiettivo è il controllo centralizzato dell’egress in tutto il runtime.

## Configurazione

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Puoi anche fornire l’URL tramite l’ambiente, mantenendo `proxy.enabled=true` nella configurazione:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` ha la precedenza su `OPENCLAW_PROXY_URL`.

### Modalità loopback del Gateway

I client locali del piano di controllo del Gateway di solito si connettono a un WebSocket loopback come `ws://127.0.0.1:18789`. Usa `proxy.loopbackMode` per scegliere come si comporta quel traffico mentre il proxy gestito è attivo:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (predefinito): OpenClaw registra l’autorità loopback del Gateway nel controller `NO_PROXY` `global-agent` attivo, così il traffico WebSocket del Gateway locale può connettersi direttamente. Le porte Gateway loopback personalizzate funzionano perché host e porta dell’URL del Gateway attivo vengono registrati.
- `proxy`: OpenClaw non registra un’autorità `NO_PROXY` loopback del Gateway, quindi il traffico Gateway locale viene inviato attraverso il proxy gestito. Se il proxy è remoto, deve fornire un instradamento speciale per il servizio loopback dell’host OpenClaw, ad esempio mappandolo a un nome host, IP o tunnel raggiungibile dal proxy. I proxy remoti standard risolvono `127.0.0.1` e `localhost` dall’host del proxy, non dall’host OpenClaw.
- `block`: OpenClaw nega le connessioni del piano di controllo del Gateway loopback prima di aprire un socket.

Se `enabled=true` ma non è configurato alcun URL proxy valido, i comandi protetti falliscono all’avvio invece di ripiegare sull’accesso diretto alla rete.

Per i servizi gateway gestiti avviati con `openclaw gateway start`, preferisci archiviare l’URL nella configurazione:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Il fallback dell’ambiente è più adatto alle esecuzioni in primo piano. Se lo usi con un servizio installato, inserisci `OPENCLAW_PROXY_URL` nell’ambiente persistente del servizio, come `$OPENCLAW_STATE_DIR/.env` o `~/.openclaw/.env`, quindi reinstalla il servizio in modo che launchd, systemd o Scheduled Tasks avvii il gateway con quel valore.

Per i comandi `openclaw --container ...`, OpenClaw inoltra `OPENCLAW_PROXY_URL` alla CLI figlia destinata al container quando è impostato. L’URL deve essere raggiungibile dall’interno del container; `127.0.0.1` si riferisce al container stesso, non all’host. OpenClaw rifiuta gli URL proxy loopback per i comandi destinati al container a meno che tu non ignori esplicitamente quel controllo di sicurezza.

## Requisiti del proxy

La policy del proxy è il confine di sicurezza. OpenClaw non può verificare che il proxy blocchi i target corretti.

Configura il proxy per:

- Effettuare il bind solo al loopback o a un’interfaccia privata attendibile.
- Limitare l’accesso in modo che solo il processo, l’host, il container o l’account di servizio OpenClaw possa usarlo.
- Risolvere autonomamente le destinazioni e bloccare gli IP di destinazione dopo la risoluzione DNS.
- Applicare la policy al momento della connessione sia per le richieste HTTP in chiaro sia per i tunnel HTTPS `CONNECT`.
- Rifiutare bypass basati sulla destinazione per intervalli loopback, privati, link-local, metadata, multicast, riservati o di documentazione.
- Evitare allowlist di nomi host a meno che tu non ritenga completamente attendibile il percorso di risoluzione DNS.
- Registrare destinazione, decisione, stato e motivo senza registrare corpi delle richieste, header di autorizzazione, cookie o altri segreti.
- Mantenere la policy del proxy sotto controllo versione ed esaminare le modifiche come configurazione sensibile alla sicurezza.

## Destinazioni bloccate consigliate

Usa questa denylist come punto di partenza per qualsiasi proxy forward, firewall o policy di egress.

La logica del classificatore a livello applicativo di OpenClaw vive in `src/infra/net/ssrf.ts` e `src/shared/net/ip.ts`. Gli hook di parità rilevanti sono `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` e la gestione sentinel IPv4 incorporata per NAT64, 6to4, Teredo, ISATAP e forme IPv4-mapped. Questi file sono riferimenti utili quando mantieni una policy proxy esterna, ma OpenClaw non esporta né applica automaticamente quelle regole nel tuo proxy.

| Intervallo o host                                                                    | Perché bloccarlo                                      |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                        |
| `::1/128`                                                                            | Loopback IPv6                                        |
| `0.0.0.0/8`, `::/128`                                                                | Indirizzi non specificati e di questa rete            |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Reti private RFC1918                                 |
| `169.254.0.0/16`, `fe80::/10`                                                        | Indirizzi link-local e percorsi comuni di metadata cloud |
| `169.254.169.254`, `metadata.google.internal`                                        | Servizi di metadata cloud                            |
| `100.64.0.0/10`                                                                      | Spazio di indirizzi condiviso NAT carrier-grade       |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Intervalli di benchmarking                           |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Intervalli special-use e di documentazione            |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | IPv4 riservato                                       |
| `fc00::/7`, `fec0::/10`                                                              | Intervalli IPv6 locali/privati                       |
| `100::/64`, `2001:20::/28`                                                           | Intervalli IPv6 discard e ORCHIDv2                   |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefissi NAT64 con IPv4 incorporato                  |
| `2002::/16`, `2001::/32`                                                             | 6to4 e Teredo con IPv4 incorporato                   |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatibile con IPv4 e IPv6 IPv4-mapped         |

Se il tuo cloud provider o la tua piattaforma di rete documenta host di metadata o intervalli riservati aggiuntivi, aggiungi anche quelli.

## Convalida

Convalida il proxy dallo stesso host, container o account di servizio che esegue OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Per impostazione predefinita, quando non vengono fornite destinazioni personalizzate, il comando verifica che `https://example.com/` riesca e avvia un canary di loopback temporaneo che il proxy non deve raggiungere. Il controllo negato predefinito riesce quando il proxy restituisce una risposta di negazione non 2xx o blocca il canary con un errore di trasporto; fallisce se una risposta riuscita raggiunge il canary. Se nessun proxy è abilitato e configurato, la convalida segnala un problema di configurazione; usa `--proxy-url` per una verifica preliminare una tantum prima di modificare la configurazione. Usa `--allowed-url` e `--denied-url` per testare aspettative specifiche della distribuzione. Aggiungi `--apns-reachable` per verificare anche che la consegna diretta APNs HTTP/2 possa aprire un tunnel CONNECT attraverso il proxy e ricevere una risposta APNs sandbox; il probe usa un token provider intenzionalmente non valido, quindi `403 InvalidProviderToken` è atteso e conta come raggiungibile. Le destinazioni negate personalizzate sono fail-closed: qualsiasi risposta HTTP significa che la destinazione era raggiungibile attraverso il proxy, e qualsiasi errore di trasporto viene segnalato come inconcludente perché OpenClaw non può dimostrare che il proxy abbia bloccato un'origine raggiungibile. In caso di errore di convalida, il comando termina con codice 1.

Usa `--json` per l'automazione. L'output JSON contiene il risultato complessivo, l'origine effettiva della configurazione del proxy, eventuali errori di configurazione e ogni controllo di destinazione. Le credenziali dell'URL del proxy sono redatte nell'output testuale e JSON:

```json
{
  "ok": true,
  "config": {
    "enabled": true,
    "proxyUrl": "http://127.0.0.1:3128/",
    "source": "override",
    "errors": []
  },
  "checks": [
    {
      "kind": "allowed",
      "url": "https://example.com/",
      "ok": true,
      "status": 200
    },
    {
      "kind": "apns",
      "url": "https://api.sandbox.push.apple.com",
      "ok": true,
      "status": 403
    }
  ]
}
```

Puoi anche convalidare manualmente con `curl`:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

La richiesta pubblica dovrebbe riuscire. Le richieste di loopback e di metadati dovrebbero essere bloccate dal proxy. Per `openclaw proxy validate`, il canary di loopback integrato può distinguere una negazione del proxy da un'origine raggiungibile. I controlli `--denied-url` personalizzati non dispongono di quel canary, quindi tratta sia le risposte HTTP sia gli errori di trasporto ambigui come errori di convalida, a meno che il tuo proxy non esponga un segnale di negazione specifico della distribuzione che puoi verificare separatamente.

Quindi abilita l'instradamento proxy di OpenClaw:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

oppure imposta:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## Limiti

- Il proxy migliora la copertura per i client JavaScript HTTP e WebSocket locali al processo, ma non è una sandbox di rete a livello di sistema operativo.
- Il traffico del piano di controllo di loopback del Gateway passa per impostazione predefinita tramite bypass locale diretto con `proxy.loopbackMode: "gateway-only"`. OpenClaw implementa quel bypass registrando l'autorità di loopback del Gateway attivo nel controller `NO_PROXY` `global-agent` gestito. Gli operatori possono impostare `proxy.loopbackMode: "proxy"` per inviare il traffico di loopback del Gateway attraverso il proxy gestito, oppure `proxy.loopbackMode: "block"` per negare le connessioni di loopback del Gateway. Vedi [Modalità loopback del Gateway](#gateway-loopback-mode) per l'avvertenza sul proxy remoto.
- Socket `net`, `tls` e `http2` grezzi, addon nativi e processi figli non OpenClaw possono aggirare l'instradamento proxy a livello Node, a meno che ereditino e rispettino le variabili d'ambiente del proxy. Le CLI figlie OpenClaw forkate ereditano l'URL del proxy gestito e lo stato di `proxy.loopbackMode`.
- IRC è un canale TCP/TLS grezzo fuori dall'instradamento tramite forward proxy gestito dall'operatore. Nelle distribuzioni che richiedono tutto il traffico in uscita attraverso quel forward proxy, imposta `channels.irc.enabled=false` a meno che il traffico IRC diretto in uscita non sia esplicitamente approvato.
- Il proxy di debug locale è uno strumento diagnostico e il suo inoltro upstream diretto per richieste proxy e tunnel CONNECT è disabilitato per impostazione predefinita mentre la modalità proxy gestita è attiva; abilita l'inoltro diretto solo per diagnostica locale approvata.
- Le WebUI locali dell'utente e i server di modelli locali dovrebbero essere inseriti nella lista consentita nella policy proxy dell'operatore quando necessario; OpenClaw non espone per essi un bypass generale della rete locale.
- Il bypass del proxy del piano di controllo del Gateway è intenzionalmente limitato a `localhost` e agli URL con IP letterali di loopback. Usa `ws://127.0.0.1:18789`, `ws://[::1]:18789` o `ws://localhost:18789` per connessioni locali dirette al piano di controllo del Gateway; gli altri nomi host vengono instradati come normale traffico basato su nome host.
- OpenClaw non ispeziona, testa né certifica la tua policy proxy.
- Tratta le modifiche alla policy proxy come modifiche operative sensibili per la sicurezza.
