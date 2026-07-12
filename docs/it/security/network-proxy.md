---
read_when:
    - Vuoi una difesa a più livelli contro gli attacchi SSRF e di DNS rebinding
    - Configurazione di un proxy forward esterno per il traffico di runtime di OpenClaw
summary: Come instradare il traffico HTTP e WebSocket del runtime OpenClaw attraverso un proxy di filtraggio gestito dall'operatore
title: Proxy di rete
x-i18n:
    generated_at: "2026-07-12T07:33:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd82684a17a79242891eca69c549c0bfcdd5bde40fa4e791dda7f2b62c473c89
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw può instradare il traffico HTTP e WebSocket di runtime tramite un proxy forward gestito dall'operatore. Si tratta di una difesa in profondità facoltativa: controllo centralizzato del traffico in uscita, protezione SSRF più robusta e verificabilità delle destinazioni al confine della rete. Poiché il proxy valuta la destinazione al momento della connessione, dopo la risoluzione DNS e immediatamente prima di aprire la connessione upstream, riduce anche l'intervallo sfruttato da un attacco di DNS rebinding tra un controllo DNS precedente a livello applicativo e la connessione in uscita effettiva. Un'unica policy del proxy offre inoltre agli operatori un punto centralizzato in cui applicare regole sulle destinazioni, segmentazione della rete, limiti di frequenza o elenchi di destinazioni consentite in uscita senza ricompilare OpenClaw.

OpenClaw non include, scarica, avvia, configura né certifica alcun proxy. Sei tu a eseguire la tecnologia proxy adatta al tuo ambiente; OpenClaw instrada tramite essa i propri client HTTP e WebSocket.

## Configurazione

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Puoi anche impostare l'URL tramite l'ambiente, mantenendo `proxy.enabled: true` nella configurazione:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` ha la precedenza su `OPENCLAW_PROXY_URL`. Se `proxy.enabled` è `true` ma non viene risolto alcun URL valido, i comandi protetti non si avviano anziché ripiegare sull'accesso diretto alla rete.

| Chiave               | Tipo                                 | Valore predefinito | Note                                                                                                                                                                           |
| -------------------- | ------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `proxy.enabled`      | boolean                              | non impostato      | Deve essere `true` per attivare l'instradamento.                                                                                                                               |
| `proxy.proxyUrl`     | string                               | non impostato      | URL del proxy forward `http://` o `https://`. Le credenziali incorporate nell'URL sono considerate sensibili e oscurate negli snapshot e nei log.                              |
| `proxy.tls.caFile`   | string                               | non impostato      | Bundle CA per verificare un endpoint proxy `https://` firmato da una CA privata.                                                                                                |
| `proxy.loopbackMode` | `gateway-only` \| `proxy` \| `block` | `gateway-only`     | Controlla il comportamento di esclusione del local loopback; consulta la sezione seguente.                                                                                      |

Per i servizi Gateway gestiti, archivia l'URL nella configurazione affinché persista dopo una reinstallazione, anziché affidarti alle variabili d'ambiente del processo in primo piano:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Il fallback sulla variabile d'ambiente `OPENCLAW_PROXY_URL` è più adatto alle esecuzioni in primo piano. Per utilizzarlo con un servizio installato, inseriscilo nell'ambiente persistente del servizio (`$OPENCLAW_STATE_DIR/.env`, valore predefinito `~/.openclaw/.env`), quindi reinstalla il servizio affinché launchd/systemd/Utilità di pianificazione lo acquisisca.

### Endpoint proxy HTTPS con una CA privata

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile` verifica il certificato TLS dell'endpoint proxy stesso. Non è un'impostazione di attendibilità MITM per la destinazione, un certificato client o un sostituto della policy del proxy relativa alle destinazioni. Usa invece `NODE_EXTRA_CA_CERTS` solo quando l'intero processo Node deve considerare attendibile una CA aggiuntiva fin dall'avvio, ad esempio per un sistema aziendale di ispezione TLS che firma nuovamente ogni certificato delle destinazioni HTTPS. Tale variabile è globale per il processo e deve essere impostata prima dell'avvio di Node, quindi OpenClaw non può applicarla durante l'esecuzione come fa con `proxy.tls.caFile`. Per considerare attendibile un endpoint proxy HTTPS, preferisci `proxy.tls.caFile`: il suo ambito è limitato all'instradamento tramite il proxy gestito anziché all'intero processo.

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## Funzionamento dell'instradamento

Con `proxy.enabled: true` e un URL valido, i processi di runtime protetti (`openclaw gateway run`, `openclaw node run`, `openclaw agent --local`) instradano tramite il proxy il normale traffico HTTP e WebSocket in uscita:

```text
Processo OpenClaw
  client fetch, node:http, node:https, WebSocket  -> proxy dell'operatore -> destinazione
```

Internamente, OpenClaw installa [Proxyline](https://github.com/openclaw/proxyline) come runtime di instradamento a livello di processo. Copre `fetch`, i client basati su undici, `node:http`/`node:https`, i comuni client WebSocket e i tunnel `CONNECT` creati dalle funzioni ausiliarie; inoltre sostituisce gli agent HTTP Node forniti dal chiamante, affinché gli agent espliciti, inclusi `axios`, `got`, `node-fetch` e client simili basati sugli agent Node, non possano aggirare silenziosamente il proxy.

Lo schema dell'URL del proxy descrive il passaggio da OpenClaw al proxy, non quello verso la destinazione finale:

- `http://proxy.example:3128` — TCP non cifrato verso il proxy; OpenClaw invia richieste proxy HTTP, incluso `CONNECT` per le destinazioni HTTPS.
- `https://proxy.example:8443` — OpenClaw apre una connessione TLS verso il proxy stesso, verificandone il certificato, quindi invia le richieste proxy HTTP all'interno di tale sessione.

Il TLS della destinazione è indipendente dal TLS dell'endpoint proxy: per una destinazione HTTPS, OpenClaw richiede sempre al proxy un tunnel `CONNECT` e avvia il TLS della destinazione attraverso tale tunnel.

Mentre il proxy è attivo, OpenClaw elimina `no_proxy`/`NO_PROXY`. Questi elenchi di esclusione sono basati sulla destinazione; mantenervi `localhost` o `127.0.0.1` consentirebbe alle destinazioni SSRF di evitare completamente il proxy. All'arresto, OpenClaw ripristina l'ambiente proxy precedente e reimposta lo stato di instradamento memorizzato nella cache.

Alcuni Plugin gestiscono un trasporto personalizzato che richiede una propria configurazione del proxy anche quando l'instradamento a livello di processo è attivo. Il client Bot API di Telegram usa un proprio dispatcher undici HTTP/1 e rispetta separatamente le variabili d'ambiente proxy del processo e il fallback `OPENCLAW_PROXY_URL`.

### Modalità local loopback del Gateway

I client locali del piano di controllo del Gateway si connettono normalmente a un WebSocket local loopback come `ws://127.0.0.1:18789`. `proxy.loopbackMode` determina se tale traffico evita il proxy gestito:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy o block
```

| Modalità                 | Comportamento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway-only` (predefinita) | OpenClaw registra l'autorità local loopback del Gateway attivo come eccezione per la connessione diretta, quindi il traffico WebSocket locale del Gateway si connette senza il proxy. Le porte local loopback personalizzate funzionano perché l'eccezione si applica esattamente all'host e alla porta configurati. Il Plugin browser incluso registra lo stesso tipo di eccezione per gli URL locali esatti di verifica della disponibilità CDP e WebSocket DevTools dei browser gestiti avviati da OpenClaw; il provider di embedding della memoria Ollama incluso dispone di un percorso diretto protetto più ristretto per l'origine local loopback esatta configurata per l'embedding. |
| `proxy`                  | Non viene registrata alcuna eccezione per il local loopback; il traffico local loopback di Gateway e Ollama passa attraverso il proxy. Un proxy remoto deve poter instradare il traffico verso il servizio local loopback dell'host OpenClaw, ad esempio tramite un nome host, un indirizzo IP o un tunnel raggiungibile. Un normale proxy remoto risolve `127.0.0.1`/`localhost` rispetto a sé stesso, non rispetto all'host OpenClaw.                                                                                                                                                                          |
| `block`                  | OpenClaw nega le connessioni del piano di controllo local loopback del Gateway e le connessioni protette local loopback per l'embedding di Ollama prima di aprire un socket.                                                                                                                                                                                                                                                                                                                                                                                                                  |

L'esclusione del piano di controllo del Gateway è limitata a `localhost` e agli URL con indirizzi IP local loopback letterali: usa `ws://127.0.0.1:18789`, `ws://[::1]:18789` o `ws://localhost:18789`. Gli altri nomi host vengono instradati come traffico ordinario.

### Container

Per i comandi `openclaw --container ...`, OpenClaw inoltra `OPENCLAW_PROXY_URL` alla CLI figlia destinata al container quando la variabile è impostata. L'URL deve essere raggiungibile dall'interno del container: lì `127.0.0.1` si riferisce al container stesso, non all'host. OpenClaw rifiuta gli URL proxy local loopback per i comandi destinati ai container, a meno che non imposti `OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1` per ignorare esplicitamente tale controllo.

## Termini correlati al proxy

- `proxy.enabled` / `proxy.proxyUrl` — instradamento tramite proxy forward in uscita per il traffico di runtime. Questa pagina.
- `gateway.auth.mode: "trusted-proxy"` — autenticazione tramite reverse proxy in ingresso basata sull'identità per l'accesso al Gateway. Consulta [Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth).
- `openclaw proxy` — proxy di debug locale e strumento di ispezione delle acquisizioni per sviluppo e assistenza. Consulta [openclaw proxy](/it/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy` — opzione esplicita per consentire a `web_fetch` di far risolvere il DNS a un proxy HTTP(S) definito dall'operatore, mantenendo per impostazione predefinita il blocco rigoroso del DNS e la policy sui nomi host. Consulta [Recupero web](/it/tools/web-fetch#trusted-env-proxy).
- Impostazioni proxy specifiche del canale o del provider — sostituzioni specifiche del proprietario per un singolo trasporto. Preferisci il proxy di rete gestito per il controllo centralizzato del traffico in uscita nell'intero runtime.

## Convalida del proxy

La policy del proxy relativa alle destinazioni costituisce il vero confine di sicurezza; OpenClaw non può verificare che il proxy blocchi le destinazioni corrette. Configuralo affinché:

- Effettui il binding solo al local loopback o a un'interfaccia privata attendibile, raggiungibile esclusivamente dal processo, dall'host, dal container o dall'account di servizio di OpenClaw.
- Risolva autonomamente le destinazioni e le blocchi in base all'indirizzo IP dopo la risoluzione DNS, al momento della connessione, sia per il normale HTTP sia per i tunnel HTTPS `CONNECT`.
- Rifiuti le esclusioni basate sulla destinazione per gli intervalli local loopback, privati, link-local, di metadati, multicast, riservati e di documentazione.
- Eviti gli elenchi di nomi host consentiti, a meno che il percorso di risoluzione DNS non sia completamente attendibile.
- Registri nei log la destinazione, la decisione, lo stato e il motivo, senza mai includere i corpi delle richieste, le intestazioni di autorizzazione, i cookie o altri segreti.
- Mantenga la policy sotto controllo di versione e consideri le modifiche sensibili per la sicurezza durante la revisione.

Esegui la convalida dallo stesso host, container o account di servizio che esegue OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Con un endpoint proxy HTTPS dotato di CA privata:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| Flag                     | Scopo                                                                |
| ------------------------ | -------------------------------------------------------------------- |
| `--proxy-url <url>`      | Convalida questo URL invece di risolvere configurazione/ambiente.    |
| `--proxy-ca-file <path>` | Bundle CA per un endpoint proxy HTTPS.                               |
| `--allowed-url <url>`    | Destinazione che dovrebbe essere raggiungibile (ripetibile).         |
| `--denied-url <url>`     | Destinazione che dovrebbe essere bloccata (ripetibile).              |
| `--apns-reachable`       | Verifica anche che il proxy possa creare un tunnel per una sonda HTTP/2 APNs diretta nell'ambiente sandbox. |
| `--apns-authority <url>` | Sostituisce l'autorità APNs verificata con `--apns-reachable`.       |
| `--timeout-ms <ms>`      | Timeout per richiesta.                                               |
| `--json`                 | Output leggibile dalle macchine.                                     |

Se `proxy.enabled` non è `true` e non viene specificato `--proxy-url`, il comando segnala un problema di configurazione invece di eseguire la convalida; passa `--proxy-url` per un controllo preliminare una tantum prima di modificare la configurazione.

Senza `--allowed-url`/`--denied-url`, i controlli predefiniti sono: `https://example.com/` deve essere raggiungibile e deve essere bloccato un server canary temporaneo su local loopback che il proxy non deve poter raggiungere. Il controllo su local loopback ha esito positivo in caso di errore di trasporto oppure di risposta non 2xx priva del token specifico per l'esecuzione del canary; ha esito negativo in caso di risposta 2xx priva del token (un successo inatteso proveniente da qualcosa di diverso dal canary) e, in particolare, in caso di qualsiasi risposta contenente il token corrispondente, poiché ciò dimostra che il proxy ha effettivamente inoltrato una destinazione local loopback che avrebbe dovuto negare. Le destinazioni personalizzate di `--denied-url` non dispongono di un simile token canary, pertanto adottano un comportamento fail-closed: qualsiasi risposta HTTP indica che la destinazione è raggiungibile (errore), mentre un errore di trasporto viene segnalato come non conclusivo anziché come blocco dimostrato, perché OpenClaw non può confermare se il proxy abbia negato un'origine raggiungibile o se si sia verificato un altro problema. `--apns-reachable` invia intenzionalmente un token del provider non valido, pertanto una risposta `403 InvalidProviderToken` costituisce la prova che il tunnel ha raggiunto Apple. Il comando termina con codice `1` in caso di qualsiasi errore di convalida; le credenziali dell'URL del proxy vengono oscurate sia nell'output testuale sia in quello JSON.

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
    { "kind": "allowed", "url": "https://example.com/", "ok": true, "status": 200 },
    { "kind": "apns", "url": "https://api.sandbox.push.apple.com", "ok": true, "status": 403 }
  ]
}
```

Controllo manuale con `curl` (la richiesta pubblica dovrebbe riuscire; le richieste a local loopback e ai metadati dovrebbero essere bloccate dal proxy stesso; `curl` da solo non può distinguere un rifiuto del proxy da un'origine irraggiungibile come può fare il canary integrato di `openclaw proxy validate`):

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

## Destinazioni consigliate da bloccare

Elenco di esclusione iniziale per qualsiasi proxy forward, firewall o criterio di uscita. Il classificatore SSRF di OpenClaw si trova in `src/infra/net/ssrf.ts` e `packages/net-policy/src/ip.ts` (`BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, il prefisso di benchmark RFC 2544 e la gestione dell'IPv4 incorporato per i formati NAT64/6to4/Teredo/ISATAP/IPv4-mapped): sono riferimenti utili, ma OpenClaw non esporta né applica queste regole nel proxy esterno.

| Intervallo o host                                                                    | Motivo del blocco                                  |
| ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | local loopback IPv4                               |
| `::1/128`                                                                            | local loopback IPv6                               |
| `0.0.0.0/8`, `::/128`                                                                | Indirizzi non specificati / della rete corrente   |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Reti private RFC 1918                             |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local, inclusi i comuni percorsi dei metadati cloud |
| `169.254.169.254`, `metadata.google.internal`                                        | Servizi di metadati cloud                         |
| `100.64.0.0/10`                                                                      | Spazio di indirizzi condiviso per NAT carrier-grade |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Intervalli di benchmark                           |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Intervalli per usi speciali e documentazione      |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                         |
| `240.0.0.0/4`                                                                        | IPv4 riservato                                    |
| `fc00::/7`, `fec0::/10`                                                              | Intervalli IPv6 locali/privati                    |
| `100::/64`, `2001:20::/28`                                                           | Intervalli IPv6 di scarto e ORCHIDv2              |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefissi NAT64 con IPv4 incorporato               |
| `2002::/16`, `2001::/32`                                                             | 6to4 e Teredo con IPv4 incorporato                |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatibile con IPv4 e IPv4-mapped           |

Aggiungi eventuali altri host di metadati o intervalli riservati documentati dal provider cloud o dalla piattaforma di rete.

## Limiti

| Superficie                                                   | Stato del proxy gestito                                                                                                                                  |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, comuni client WebSocket  | Instradati tramite gli hook del proxy gestito quando configurato.                                                                                        |
| HTTP/2 diretto APNs                                          | Instradato tramite l'helper `CONNECT` gestito di APNs.                                                                                                   |
| local loopback del piano di controllo del Gateway            | Diretto solo per l'esatto URL locale del Gateway su local loopback configurato.                                                                          |
| Inoltro upstream del proxy di debug                          | Disabilitato mentre la modalità proxy gestito è attiva, salvo abilitazione esplicita per la diagnostica locale.                                          |
| IRC                                                          | TCP/TLS non elaborato; non utilizza la modalità proxy HTTP gestito. Imposta `channels.irc.enabled: false` se la distribuzione richiede che tutto il traffico in uscita passi attraverso il proxy forward. |
| Altre chiamate client `net`, `tls` o `http2` non elaborate   | Devono essere classificate dalla protezione dei socket non elaborati prima dell'integrazione.                                                             |

- Questa copertura opera a livello di processo per i client HTTP/WebSocket JavaScript, non è un ambiente sandbox di rete a livello di sistema operativo.
- I socket `net`, `tls` e `http2` non elaborati, gli addon nativi e i processi figlio non appartenenti a OpenClaw possono aggirare l'instradamento a livello di Node, a meno che non ereditino e rispettino le variabili di ambiente del proxy. Le CLI figlie di OpenClaw create tramite fork ereditano l'URL del proxy gestito e lo stato di `proxy.loopbackMode`.
- Le WebUI locali dell'utente e i server di modelli locali non sono coperti da un'esclusione generale della rete locale: se necessario, inseriscili nell'elenco di autorizzazione dei criteri del proxy dell'operatore. L'eccezione è il percorso diretto protetto del provider integrato Ollama per gli embedding della memoria, limitato all'esatta origine host-locale su local loopback indicata dal relativo `baseUrl` configurato; gli host Ollama su LAN, tailnet, rete privata e rete pubblica continuano a utilizzare il proxy gestito.
- L'inoltro upstream diretto del proxy di debug locale (per le richieste proxy e i tunnel `CONNECT`) è disabilitato per impostazione predefinita mentre la modalità proxy gestito è attiva; abilitalo solo per attività di diagnostica locale approvate.
- OpenClaw non ispeziona, verifica né certifica i criteri del proxy. Considera le modifiche ai criteri del proxy come modifiche operative sensibili per la sicurezza.
