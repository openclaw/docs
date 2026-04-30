---
read_when:
    - Vuoi una difesa in profondità contro attacchi SSRF e di DNS rebinding
    - Configurazione di un proxy di inoltro esterno per il traffico di runtime di OpenClaw
summary: Come instradare il traffico HTTP e WebSocket dell'ambiente di esecuzione OpenClaw tramite un proxy di filtraggio gestito dall'operatore
title: Proxy di rete
x-i18n:
    generated_at: "2026-04-30T09:13:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4e879f787571410acdda55dcdbb5fd77aef1d24045af5c9208cba51330a70ca
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy di rete

OpenClaw può instradare il traffico HTTP e WebSocket di runtime attraverso un proxy di inoltro gestito dall'operatore. È una difesa in profondità opzionale per distribuzioni che vogliono controllo centralizzato dell'egress, protezione SSRF più forte e migliore verificabilità di rete.

OpenClaw non include, scarica, avvia, configura o certifica un proxy. Esegui la tecnologia proxy adatta al tuo ambiente e OpenClaw vi instrada i normali client HTTP e WebSocket locali al processo.

## Perché usare un proxy?

Un proxy offre agli operatori un unico punto di controllo di rete per il traffico HTTP e WebSocket in uscita. Può essere utile anche oltre all'irrobustimento contro SSRF:

- Policy centrale: mantieni una policy di egress invece di affidarti a ogni punto di chiamata HTTP dell'applicazione perché applichi correttamente le regole di rete.
- Controlli al momento della connessione: valuta la destinazione dopo la risoluzione DNS e subito prima che il proxy apra la connessione upstream.
- Difesa dal DNS rebinding: riduci il divario tra un controllo DNS a livello applicazione e la connessione in uscita effettiva.
- Copertura JavaScript più ampia: instrada normali client `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch e simili attraverso lo stesso percorso.
- Verificabilità: registra le destinazioni consentite e negate al confine di egress.
- Controllo operativo: applica regole di destinazione, segmentazione di rete, limiti di frequenza o allowlist in uscita senza ricompilare OpenClaw.

L'instradamento tramite proxy è un guardrail a livello di processo per il normale egress HTTP e WebSocket. Offre agli operatori un percorso fail-closed per instradare i client HTTP JavaScript supportati attraverso il proprio proxy di filtraggio, ma non è una sandbox di rete a livello OS e non fa sì che OpenClaw certifichi la policy di destinazione del proxy.

## Come OpenClaw instrada il traffico

Quando `proxy.enabled=true` e viene configurato un URL del proxy, i processi di runtime protetti come `openclaw gateway run`, `openclaw node run` e `openclaw agent --local` instradano il normale egress HTTP e WebSocket attraverso il proxy configurato:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Il contratto pubblico è il comportamento di instradamento, non gli hook interni di Node usati per implementarlo. I client WebSocket del control plane di OpenClaw Gateway usano un percorso diretto ristretto per il traffico RPC Gateway su local loopback quando l'URL del Gateway usa `localhost` o un IP loopback letterale come `127.0.0.1` o `[::1]`. Quel percorso di control plane deve poter raggiungere i Gateway loopback anche quando il proxy dell'operatore blocca le destinazioni loopback. Le normali richieste HTTP e WebSocket di runtime usano comunque il proxy configurato.

Internamente, OpenClaw usa due hook di instradamento a livello di processo per questa funzionalità:

- L'instradamento del dispatcher Undici copre `fetch`, i client basati su undici e i transport che forniscono il proprio dispatcher undici.
- L'instradamento `global-agent` copre i chiamanti Node core `node:http` e `node:https`, incluse molte librerie costruite su `http.request`, `https.request`, `http.get` e `https.get`. La modalità proxy gestita forza quell'agent globale così gli agent HTTP Node espliciti non aggirano accidentalmente il proxy dell'operatore.

Alcuni plugins possiedono transport personalizzati che richiedono cablaggio esplicito del proxy anche quando esiste l'instradamento a livello di processo. Per esempio, il transport Bot API di Telegram usa il proprio dispatcher undici HTTP/1 e quindi rispetta l'ambiente proxy del processo più il fallback gestito `OPENCLAW_PROXY_URL` in quel percorso di transport specifico del proprietario.

L'URL del proxy deve usare `http://`. Le destinazioni HTTPS sono comunque supportate attraverso il proxy con HTTP `CONNECT`; questo significa solo che OpenClaw si aspetta un listener proxy di inoltro HTTP semplice come `http://127.0.0.1:3128`.

Mentre il proxy è attivo, OpenClaw cancella `no_proxy`, `NO_PROXY` e `GLOBAL_AGENT_NO_PROXY`. Quelle liste di bypass sono basate sulla destinazione, quindi lasciare lì `localhost` o `127.0.0.1` permetterebbe a target SSRF ad alto rischio di saltare il proxy di filtraggio.

All'arresto, OpenClaw ripristina l'ambiente proxy precedente e reimposta lo stato di instradamento del processo memorizzato nella cache.

## Termini correlati al proxy

- `proxy.enabled` / `proxy.proxyUrl`: instradamento proxy di inoltro in uscita per l'egress di runtime di OpenClaw. Questa pagina documenta tale funzionalità.
- `gateway.auth.mode: "trusted-proxy"`: autenticazione in ingresso tramite reverse proxy consapevole dell'identità per l'accesso al Gateway. Vedi [Autenticazione trusted proxy](/it/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy di debug locale e ispettore di cattura per sviluppo e supporto. Vedi [openclaw proxy](/it/cli/proxy).
- Impostazioni proxy specifiche per canale o provider: override specifici del proprietario per un particolare transport. Preferisci il proxy di rete gestito quando l'obiettivo è il controllo centralizzato dell'egress in tutto il runtime.

## Configurazione

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Puoi anche fornire l'URL tramite l'ambiente, mantenendo `proxy.enabled=true` nella configurazione:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` ha precedenza su `OPENCLAW_PROXY_URL`.

Se `enabled=true` ma non è configurato alcun URL del proxy valido, i comandi protetti falliscono all'avvio invece di ricadere sull'accesso diretto alla rete.

Per i servizi Gateway gestiti avviati con `openclaw gateway start`, preferisci salvare l'URL nella configurazione:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Il fallback dell'ambiente è ideale per le esecuzioni in primo piano. Se lo usi con un servizio installato, inserisci `OPENCLAW_PROXY_URL` nell'ambiente durevole del servizio, come `$OPENCLAW_STATE_DIR/.env` o `~/.openclaw/.env`, poi reinstalla il servizio in modo che launchd, systemd o Scheduled Tasks avvii il gateway con quel valore.

Per i comandi `openclaw --container ...`, OpenClaw inoltra `OPENCLAW_PROXY_URL` nella CLI figlia destinata al container quando è impostato. L'URL deve essere raggiungibile dall'interno del container; `127.0.0.1` si riferisce al container stesso, non all'host. OpenClaw rifiuta gli URL proxy loopback per i comandi destinati al container, a meno che tu non ignori esplicitamente quel controllo di sicurezza.

## Requisiti del proxy

La policy del proxy è il confine di sicurezza. OpenClaw non può verificare che il proxy blocchi i target corretti.

Configura il proxy per:

- Eseguire il bind solo a loopback o a un'interfaccia privata fidata.
- Limitare l'accesso in modo che solo il processo, l'host, il container o l'account di servizio OpenClaw possa usarlo.
- Risolvere autonomamente le destinazioni e bloccare gli IP di destinazione dopo la risoluzione DNS.
- Applicare la policy al momento della connessione sia per le richieste HTTP semplici sia per i tunnel HTTPS `CONNECT`.
- Rifiutare bypass basati sulla destinazione per intervalli loopback, privati, link-local, metadata, multicast, riservati o di documentazione.
- Evitare allowlist di hostname a meno che tu non consideri pienamente fidato il percorso di risoluzione DNS.
- Registrare destinazione, decisione, stato e motivo senza registrare corpi delle richieste, header di autorizzazione, cookie o altri segreti.
- Mantenere la policy del proxy sotto controllo versione e rivedere le modifiche come configurazione sensibile alla sicurezza.

## Destinazioni bloccate consigliate

Usa questa denylist come punto di partenza per qualsiasi proxy di inoltro, firewall o policy di egress.

La logica del classificatore a livello applicazione di OpenClaw si trova in `src/infra/net/ssrf.ts` e `src/shared/net/ip.ts`. Gli hook di parità rilevanti sono `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` e la gestione sentinel IPv4 incorporata per NAT64, 6to4, Teredo, ISATAP e forme IPv4-mapped. Quei file sono riferimenti utili quando si mantiene una policy proxy esterna, ma OpenClaw non esporta né applica automaticamente quelle regole nel tuo proxy.

| Intervallo o host                                                                    | Perché bloccarlo                                     |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                        |
| `::1/128`                                                                            | Loopback IPv6                                        |
| `0.0.0.0/8`, `::/128`                                                                | Indirizzi non specificati e this-network             |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Reti private RFC1918                                 |
| `169.254.0.0/16`, `fe80::/10`                                                        | Indirizzi link-local e percorsi metadata cloud comuni |
| `169.254.169.254`, `metadata.google.internal`                                        | Servizi metadata cloud                               |
| `100.64.0.0/10`                                                                      | Spazio di indirizzi condiviso NAT carrier-grade      |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Intervalli di benchmarking                           |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Intervalli special-use e di documentazione           |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | IPv4 riservato                                       |
| `fc00::/7`, `fec0::/10`                                                              | Intervalli IPv6 locali/privati                       |
| `100::/64`, `2001:20::/28`                                                           | Intervalli IPv6 discard e ORCHIDv2                   |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefissi NAT64 con IPv4 incorporato                  |
| `2002::/16`, `2001::/32`                                                             | 6to4 e Teredo con IPv4 incorporato                   |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatibile con IPv4 e IPv4-mapped              |

Se il tuo provider cloud o la tua piattaforma di rete documenta host metadata o intervalli riservati aggiuntivi, aggiungi anche quelli.

## Validazione

Valida il proxy dallo stesso host, container o account di servizio che esegue OpenClaw:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

La richiesta pubblica dovrebbe riuscire. Le richieste loopback e metadata dovrebbero fallire al proxy.

Poi abilita l'instradamento proxy di OpenClaw:

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

- Il proxy migliora la copertura per i client HTTP e WebSocket JavaScript locali al processo, ma non è una sandbox di rete a livello OS.
- I socket raw `net`, `tls` e `http2`, gli addon nativi e i processi figli possono aggirare l'instradamento proxy a livello Node a meno che ereditino e rispettino le variabili d'ambiente proxy.
- Le WebUI locali dell'utente e i server modello locali dovrebbero essere inseriti in allowlist nella policy proxy dell'operatore quando necessario; OpenClaw non espone per loro un bypass generale della rete locale.
- Il bypass proxy del control plane del Gateway è intenzionalmente limitato a `localhost` e agli URL IP loopback letterali. Usa `ws://127.0.0.1:18789`, `ws://[::1]:18789` o `ws://localhost:18789` per le connessioni locali dirette al control plane del Gateway; altri hostname vengono instradati come normale traffico basato su hostname.
- OpenClaw non ispeziona, testa o certifica la tua policy proxy.
- Tratta le modifiche alla policy proxy come modifiche operative sensibili alla sicurezza.
