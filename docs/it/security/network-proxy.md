---
read_when:
    - Vuoi una difesa in profondità contro gli attacchi SSRF e DNS rebinding
    - Configurare un proxy forward esterno per il traffico runtime di OpenClaw
summary: Come instradare il traffico HTTP e WebSocket del runtime OpenClaw attraverso un proxy di filtraggio gestito dall’operatore
title: Proxy di rete
x-i18n:
    generated_at: "2026-06-27T18:15:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3fc68d950037922ba3dc983c94a71bac3374750a02ef25f2c046cf782410be68
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw può instradare il traffico HTTP e WebSocket di runtime attraverso un forward proxy gestito dall'operatore. Questa è una difesa in profondità opzionale per distribuzioni che vogliono un controllo centralizzato dell'egress, una protezione SSRF più forte e una migliore verificabilità della rete.

OpenClaw non fornisce, scarica, avvia, configura o certifica un proxy. Esegui la tecnologia proxy adatta al tuo ambiente e OpenClaw vi instrada i normali client HTTP e WebSocket locali al processo.

## Perché usare un proxy

Un proxy offre agli operatori un unico punto di controllo di rete per il traffico HTTP e WebSocket in uscita. Può essere utile anche oltre l'irrobustimento contro SSRF:

- Policy centrale: mantieni una sola policy di egress invece di affidarti a ogni punto di chiamata HTTP dell'applicazione affinché applichi correttamente le regole di rete.
- Controlli al momento della connessione: valuta la destinazione dopo la risoluzione DNS e subito prima che il proxy apra la connessione upstream.
- Difesa contro DNS rebinding: riduce lo scarto tra un controllo DNS a livello applicativo e la connessione in uscita effettiva.
- Copertura JavaScript più ampia: instrada `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch e client simili attraverso lo stesso percorso.
- Verificabilità: registra le destinazioni consentite e negate al confine di egress.
- Controllo operativo: applica regole di destinazione, segmentazione di rete, limiti di frequenza o allowlist in uscita senza ricompilare OpenClaw.

L'instradamento tramite proxy è un guardrail a livello di processo per il normale egress HTTP e WebSocket. Offre agli operatori un percorso fail-closed per instradare i client HTTP JavaScript supportati attraverso il proprio proxy di filtraggio, ma non è una sandbox di rete a livello di sistema operativo e non fa sì che OpenClaw certifichi la policy di destinazione del proxy.

## Come OpenClaw instrada il traffico

Quando `proxy.enabled=true` ed è configurato un URL proxy, i processi di runtime protetti come `openclaw gateway run`, `openclaw node run` e `openclaw agent --local` instradano il normale egress HTTP e WebSocket attraverso il proxy configurato:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Il contratto pubblico è il comportamento di instradamento, non gli hook interni di Node usati per implementarlo. I client WebSocket del piano di controllo di OpenClaw Gateway usano un percorso diretto ristretto per il traffico RPC locale loopback del Gateway quando l'URL del Gateway usa `localhost` o un IP loopback letterale come `127.0.0.1` o `[::1]`. Quel percorso del piano di controllo deve poter raggiungere i Gateway loopback anche quando il proxy dell'operatore blocca le destinazioni loopback. Le normali richieste HTTP e WebSocket di runtime continuano a usare il proxy configurato.

Internamente, OpenClaw installa Proxyline come runtime di instradamento a livello di processo per questa funzionalità. Proxyline copre `fetch`, i client basati su undici, i chiamanti core Node `node:http` / `node:https`, i comuni client WebSocket e i tunnel CONNECT creati da helper. La modalità proxy gestita sostituisce gli agent HTTP Node forniti dal chiamante, così gli agent espliciti non possono aggirare accidentalmente il proxy dell'operatore.

Alcuni plugin possiedono trasporti personalizzati che richiedono un cablaggio proxy esplicito anche quando esiste l'instradamento a livello di processo. Per esempio, il trasporto Bot API di Telegram usa il proprio dispatcher HTTP/1 undici e quindi rispetta le variabili di ambiente del proxy di processo più il fallback gestito `OPENCLAW_PROXY_URL` in quel percorso di trasporto specifico del proprietario.

L'URL proxy può usare `http://` oppure `https://`. Questi schemi descrivono la connessione da OpenClaw all'endpoint proxy:

- `http://proxy.example:3128`: OpenClaw apre una connessione TCP in chiaro al forward proxy e invia richieste proxy HTTP, incluso `CONNECT` per le destinazioni HTTPS.
- `https://proxy.example:8443`: OpenClaw apre TLS verso l'endpoint proxy, verifica il certificato del proxy e poi invia richieste proxy HTTP all'interno di quella sessione TLS.

L'HTTPS della destinazione è separato dal TLS dell'endpoint proxy. Per una destinazione HTTPS, OpenClaw chiede comunque al proxy un tunnel HTTP `CONNECT` e poi avvia il TLS della destinazione attraverso quel tunnel.

Mentre il proxy è attivo, OpenClaw cancella `no_proxy` e `NO_PROXY`. Quelle liste di bypass sono basate sulla destinazione, quindi lasciare lì `localhost` o `127.0.0.1` permetterebbe a target SSRF ad alto rischio di saltare il proxy di filtraggio.

All'arresto, OpenClaw ripristina l'ambiente proxy precedente e reimposta lo stato di instradamento del processo memorizzato nella cache.

## Termini proxy correlati

- `proxy.enabled` / `proxy.proxyUrl`: instradamento tramite forward proxy in uscita per l'egress di runtime di OpenClaw. Questa pagina documenta tale funzionalità.
- `gateway.auth.mode: "trusted-proxy"`: autenticazione reverse proxy in ingresso con identità per l'accesso al Gateway. Vedi [Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy di debug locale e ispettore di acquisizione per sviluppo e supporto. Vedi [openclaw proxy](/it/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: consenso esplicito per `web_fetch` affinché un proxy env HTTP(S) controllato dall'operatore risolva il DNS mantenendo il pinning DNS rigoroso e la policy hostname predefiniti. Vedi [Web fetch](/it/tools/web-fetch#trusted-env-proxy).
- Impostazioni proxy specifiche di canale o provider: override specifici del proprietario per un particolare trasporto. Preferisci il proxy di rete gestito quando l'obiettivo è il controllo centralizzato dell'egress in tutto il runtime.

## Configurazione

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Per un endpoint proxy HTTPS con una CA proxy privata:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

Puoi anche fornire l'URL tramite l'ambiente, mantenendo `proxy.enabled=true` nella configurazione:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` ha precedenza su `OPENCLAW_PROXY_URL`.

### Modalità loopback del Gateway

I client locali del piano di controllo del Gateway di solito si connettono a un WebSocket loopback come `ws://127.0.0.1:18789`. Usa `proxy.loopbackMode` per scegliere come si comportano le eccezioni loopback del proxy gestito mentre il proxy gestito è attivo:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (predefinito): OpenClaw registra l'autorità loopback del Gateway nella policy di bypass gestita di Proxyline, così il traffico WebSocket locale del Gateway può connettersi direttamente. Le porte Gateway loopback personalizzate funzionano perché l'host e la porta dell'URL del Gateway attivo sono registrati. Il Plugin browser in bundle può anche registrare gli endpoint WebSocket locali esatti di prontezza CDP e DevTools per i browser gestiti avviati da OpenClaw, e il provider di embedding di memoria Ollama in bundle può usare il proprio percorso diretto sorvegliato più ristretto per l'origine embedding loopback locale all'host esattamente configurata.
- `proxy`: OpenClaw non registra bypass loopback per Gateway o Ollama, quindi quel traffico loopback viene inviato attraverso il proxy gestito. Se il proxy è remoto, deve fornire un instradamento speciale per il servizio loopback dell'host OpenClaw, per esempio mappandolo a un hostname, IP o tunnel raggiungibile dal proxy. I proxy remoti standard risolvono `127.0.0.1` e `localhost` dall'host del proxy, non dall'host OpenClaw.
- `block`: OpenClaw nega le connessioni loopback del piano di controllo del Gateway e le connessioni loopback di embedding locali all'host sorvegliate di Ollama prima di aprire un socket.

Se `enabled=true` ma non è configurato alcun URL proxy valido, i comandi protetti falliscono l'avvio invece di ripiegare sull'accesso diretto alla rete.

Per i servizi gateway gestiti avviati con `openclaw gateway start`, preferisci salvare l'URL nella configurazione:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Il fallback tramite ambiente è più adatto alle esecuzioni in primo piano. Se lo usi con un servizio installato, inserisci `OPENCLAW_PROXY_URL` nell'ambiente persistente del servizio, come `$OPENCLAW_STATE_DIR/.env` o `~/.openclaw/.env`, poi reinstalla il servizio così launchd, systemd o Scheduled Tasks avvia il gateway con quel valore.

Per i comandi `openclaw --container ...`, OpenClaw inoltra `OPENCLAW_PROXY_URL` alla CLI figlia destinata al container quando è impostato. L'URL deve essere raggiungibile dall'interno del container; `127.0.0.1` si riferisce al container stesso, non all'host. OpenClaw rifiuta URL proxy loopback per comandi destinati al container a meno che tu non esegua esplicitamente l'override di quel controllo di sicurezza.

## Requisiti del proxy

La policy del proxy è il confine di sicurezza. OpenClaw non può verificare che il proxy blocchi i target corretti.

Configura il proxy per:

- Effettuare il bind solo su loopback o su un'interfaccia privata attendibile.
- Limitare l'accesso in modo che solo il processo, l'host, il container o l'account di servizio OpenClaw possa usarlo.
- Risolvere autonomamente le destinazioni e bloccare gli IP di destinazione dopo la risoluzione DNS.
- Applicare la policy al momento della connessione sia per le richieste HTTP in chiaro sia per i tunnel HTTPS `CONNECT`.
- Rifiutare bypass basati sulla destinazione per intervalli loopback, privati, link-local, metadata, multicast, riservati o di documentazione.
- Evitare allowlist di hostname a meno che tu non consideri pienamente attendibile il percorso di risoluzione DNS.
- Registrare destinazione, decisione, stato e motivo senza registrare corpi delle richieste, header di autorizzazione, cookie o altri segreti.
- Tenere la policy del proxy sotto controllo versione e rivedere le modifiche come configurazione sensibile per la sicurezza.

## Destinazioni bloccate consigliate

Usa questa denylist come punto di partenza per qualsiasi forward proxy, firewall o policy di egress.

La logica del classificatore a livello applicativo di OpenClaw vive in `src/infra/net/ssrf.ts` e `packages/net-policy/src/ip.ts`. Gli hook di parità pertinenti sono `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` e la gestione sentinel IPv4 incorporata per NAT64, 6to4, Teredo, ISATAP e forme IPv4-mapped. Quei file sono riferimenti utili quando si mantiene una policy proxy esterna, ma OpenClaw non esporta né applica automaticamente quelle regole nel tuo proxy.

| Intervallo o host                                                                       | Perché bloccarlo                                             |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                     | loopback IPv4                                                |
| `::1/128`                                                                               | loopback IPv6                                                |
| `0.0.0.0/8`, `::/128`                                                                   | Indirizzi non specificati e di questa rete                   |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                        | Reti private RFC1918                                         |
| `169.254.0.0/16`, `fe80::/10`                                                          | Indirizzi link-local e percorsi comuni di metadati cloud     |
| `169.254.169.254`, `metadata.google.internal`                                           | Servizi di metadati cloud                                    |
| `100.64.0.0/10`                                                                         | Spazio di indirizzi condiviso NAT carrier-grade              |
| `198.18.0.0/15`, `2001:2::/48`                                                         | Intervalli di benchmarking                                   |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32`   | Intervalli per uso speciale e documentazione                 |
| `224.0.0.0/4`, `ff00::/8`                                                              | Multicast                                                    |
| `240.0.0.0/4`                                                                           | IPv4 riservato                                               |
| `fc00::/7`, `fec0::/10`                                                                 | Intervalli IPv6 locali/privati                               |
| `100::/64`, `2001:20::/28`                                                             | Intervalli IPv6 discard e ORCHIDv2                           |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                       | Prefissi NAT64 con IPv4 incorporato                          |
| `2002::/16`, `2001::/32`                                                               | 6to4 e Teredo con IPv4 incorporato                           |
| `::/96`, `::ffff:0:0/96`                                                               | IPv6 compatibile con IPv4 e IPv6 mappato su IPv4             |

Se il tuo provider cloud o la tua piattaforma di rete documenta host di metadati o intervalli riservati aggiuntivi, aggiungi anche quelli.

## Convalida

Convalida il proxy dallo stesso host, container o account di servizio che esegue OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Per un endpoint proxy HTTPS firmato da una CA privata:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

Per impostazione predefinita, quando non vengono fornite destinazioni personalizzate, il comando verifica che `https://example.com/` abbia esito positivo e avvia un canary di loopback temporaneo che il proxy non deve raggiungere. Il controllo negato predefinito passa quando il proxy restituisce una risposta di negazione non 2xx o blocca il canary con un errore di trasporto; fallisce se una risposta riuscita raggiunge il canary. Se nessun proxy è abilitato e configurato, la convalida segnala un problema di configurazione; usa `--proxy-url` per un preflight una tantum prima di modificare la configurazione. Usa `--allowed-url` e `--denied-url` per testare aspettative specifiche della distribuzione. Aggiungi `--apns-reachable` per verificare anche che la consegna diretta APNs HTTP/2 possa aprire un tunnel CONNECT tramite il proxy e ricevere una risposta APNs sandbox; il probe usa intenzionalmente un token provider non valido, quindi `403 InvalidProviderToken` è previsto e conta come raggiungibile. Le destinazioni negate personalizzate sono fail-closed: qualsiasi risposta HTTP significa che la destinazione era raggiungibile tramite il proxy, e qualsiasi errore di trasporto viene segnalato come inconcludente perché OpenClaw non può provare che il proxy abbia bloccato un'origine raggiungibile. In caso di errore di convalida, il comando termina con codice 1.

Usa `--json` per l'automazione. L'output JSON contiene il risultato complessivo, l'origine effettiva della configurazione proxy, eventuali errori di configurazione e ogni controllo di destinazione. Le credenziali degli URL proxy vengono oscurate nell'output testuale e JSON:

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

Puoi convalidare anche manualmente con `curl`:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

La richiesta pubblica dovrebbe riuscire. Le richieste di loopback e metadati dovrebbero essere bloccate dal proxy. Per `openclaw proxy validate`, il canary di loopback integrato può distinguere una negazione del proxy da un'origine raggiungibile. I controlli `--denied-url` personalizzati non hanno quel canary, quindi tratta sia le risposte HTTP sia gli errori di trasporto ambigui come errori di convalida, a meno che il tuo proxy esponga un segnale di negazione specifico della distribuzione che puoi verificare separatamente.

## Attendibilità della CA del proxy

Usa `proxy.tls.caFile` gestito quando l'endpoint proxy stesso usa un certificato firmato da una CA privata:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

Quella CA viene usata per la verifica TLS dell'endpoint proxy. Non è un'impostazione di attendibilità MITM della destinazione, un certificato client o un sostituto della policy di destinazione del proxy.

Usa `NODE_EXTRA_CA_CERTS` solo quando l'intero processo Node deve considerare attendibile una CA aggiuntiva dall'avvio del processo, ad esempio quando un sistema aziendale di ispezione TLS firma nuovamente i certificati di destinazione per ogni client HTTPS nel processo. `NODE_EXTRA_CA_CERTS` è globale per il processo e deve essere presente prima dell'avvio di Node. Preferisci `proxy.tls.caFile` per l'attendibilità dell'endpoint proxy HTTPS perché è limitato al routing proxy gestito.

Quindi abilita il routing proxy di OpenClaw:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

oppure imposta:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

## Limiti

- Il proxy migliora la copertura per i client JavaScript HTTP e WebSocket locali al processo, ma non è una sandbox di rete a livello di sistema operativo.
- Il traffico del piano di controllo loopback del Gateway usa per impostazione predefinita un bypass locale diretto tramite `proxy.loopbackMode: "gateway-only"`. OpenClaw implementa quel bypass registrando l'autorità di loopback Gateway attiva nella policy di bypass gestita di Proxyline. Gli operatori possono impostare `proxy.loopbackMode: "proxy"` per inviare il traffico di loopback Gateway tramite il proxy gestito, oppure `proxy.loopbackMode: "block"` per negare le connessioni Gateway di loopback. Vedi [Modalità loopback Gateway](#gateway-loopback-mode) per l'avvertenza sul proxy remoto.
- I socket raw `net`, `tls` e `http2`, gli addon nativi e i processi figlio non OpenClaw possono aggirare il routing proxy a livello Node, a meno che ereditino e rispettino le variabili d'ambiente del proxy. Le CLI figlio OpenClaw biforcate ereditano l'URL proxy gestito e lo stato `proxy.loopbackMode`.
- IRC è un canale TCP/TLS raw al di fuori del routing tramite proxy forward gestito dall'operatore. Nelle distribuzioni che richiedono che tutto il traffico in uscita passi tramite quel proxy forward, imposta `channels.irc.enabled=false`, a meno che l'egress IRC diretto sia approvato esplicitamente.
- Il proxy di debug locale è uno strumento diagnostico e il suo inoltro upstream diretto per richieste proxy e tunnel CONNECT è disabilitato per impostazione predefinita mentre la modalità proxy gestita è attiva; abilita l'inoltro diretto solo per diagnostica locale approvata.
- Le WebUI locali dell'utente e i server di modelli locali dovrebbero essere inseriti nell'allowlist nella policy proxy dell'operatore quando necessario; OpenClaw non espone un bypass generale della rete locale per essi. Il provider di embedding di memoria Ollama in bundle è più ristretto: può usare un percorso diretto protetto solo per l'esatta origine di embedding loopback locale all'host derivata dal `baseUrl` configurato, così gli embedding locali all'host continuano a funzionare quando il proxy gestito non può raggiungere il loopback dell'host. Gli host di embedding Ollama su LAN, tailnet, rete privata e pubblici usano comunque il percorso del proxy gestito. `proxy.loopbackMode: "proxy"` invia questo traffico di loopback Ollama tramite il proxy gestito, e `proxy.loopbackMode: "block"` lo nega prima di aprire una connessione.
- Il bypass proxy del piano di controllo Gateway è intenzionalmente limitato a `localhost` e URL con IP di loopback letterali. Usa `ws://127.0.0.1:18789`, `ws://[::1]:18789` o `ws://localhost:18789` per connessioni locali dirette al piano di controllo Gateway; gli altri nomi host vengono instradati come normale traffico basato su nome host.
- OpenClaw non ispeziona, testa né certifica la tua policy proxy.
- Tratta le modifiche alla policy proxy come modifiche operative sensibili per la sicurezza.

| Superficie                                                   | Stato del proxy gestito                                                                                         |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, client WebSocket comuni  | Instradati tramite hook del proxy gestito quando configurato.                                                   |
| APNs diretto HTTP/2                                          | Instradato tramite l'helper CONNECT gestito APNs.                                                              |
| loopback del piano di controllo Gateway                      | Diretto solo per l'URL Gateway di loopback locale configurato.                                                  |
| Inoltro upstream del proxy di debug                          | Disabilitato mentre la modalità proxy gestita è attiva, a meno che sia abilitato esplicitamente per diagnostica locale. |
| IRC                                                          | TCP/TLS raw; non proxato dalla modalità proxy HTTP gestita. Disabilita a meno che l'egress IRC diretto sia approvato. |
| Altre chiamate client raw `net`, `tls` o `http2`             | Devono essere classificate dalla protezione dei socket raw prima del landing.                                   |
