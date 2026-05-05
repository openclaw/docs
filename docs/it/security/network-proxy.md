---
read_when:
    - Si desidera una difesa in profondità contro gli attacchi SSRF e di DNS rebinding
    - Configurazione di un proxy forward esterno per il traffico di runtime di OpenClaw
summary: Come instradare il traffico HTTP e WebSocket del runtime OpenClaw attraverso un proxy di filtraggio gestito dall'operatore
title: Proxy di rete
x-i18n:
    generated_at: "2026-05-05T01:49:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7ab345d172d63e388ff1221535efd19934dcbf3173f95bc69131f9ad672e0df
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy di rete

OpenClaw può instradare il traffico HTTP e WebSocket di runtime attraverso un proxy forward gestito dall'operatore. Si tratta di una difesa in profondità opzionale per le distribuzioni che vogliono un controllo centralizzato dell'uscita, una protezione SSRF più forte e una migliore verificabilità della rete.

OpenClaw non fornisce, scarica, avvia, configura né certifica un proxy. Esegui la tecnologia proxy adatta al tuo ambiente, e OpenClaw instrada attraverso di essa i normali client HTTP e WebSocket locali al processo.

## Perché usare un proxy?

Un proxy offre agli operatori un unico punto di controllo di rete per il traffico HTTP e WebSocket in uscita. Può essere utile anche al di fuori dell'irrobustimento SSRF:

- Criterio centralizzato: mantieni un unico criterio di uscita invece di fare affidamento sul fatto che ogni punto di chiamata HTTP dell'applicazione applichi correttamente le regole di rete.
- Controlli al momento della connessione: valuta la destinazione dopo la risoluzione DNS e subito prima che il proxy apra la connessione upstream.
- Difesa dal DNS rebinding: riduci lo scarto tra un controllo DNS a livello applicativo e la connessione in uscita effettiva.
- Copertura JavaScript più ampia: instrada client ordinari come `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch e simili attraverso lo stesso percorso.
- Verificabilità: registra le destinazioni consentite e negate al confine di uscita.
- Controllo operativo: applica regole di destinazione, segmentazione di rete, limiti di frequenza o allowlist in uscita senza ricompilare OpenClaw.

L'instradamento tramite proxy è un guardrail a livello di processo per il normale traffico HTTP e WebSocket in uscita. Offre agli operatori un percorso fail-closed per instradare i client HTTP JavaScript supportati attraverso il proprio proxy di filtraggio, ma non è una sandbox di rete a livello di sistema operativo e non fa sì che OpenClaw certifichi il criterio di destinazione del proxy.

## Come OpenClaw instrada il traffico

Quando `proxy.enabled=true` e viene configurato un URL proxy, i processi di runtime protetti come `openclaw gateway run`, `openclaw node run` e `openclaw agent --local` instradano il normale traffico HTTP e WebSocket in uscita attraverso il proxy configurato:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Il contratto pubblico è il comportamento di instradamento, non gli hook interni di Node usati per implementarlo. I client WebSocket del piano di controllo di OpenClaw Gateway usano un percorso diretto ristretto per il traffico RPC Gateway su local loopback quando l'URL del Gateway usa `localhost` o un IP loopback letterale come `127.0.0.1` o `[::1]`. Quel percorso del piano di controllo deve poter raggiungere i Gateway loopback anche quando il proxy dell'operatore blocca le destinazioni loopback. Le normali richieste HTTP e WebSocket di runtime continuano a usare il proxy configurato.

Internamente, OpenClaw usa due hook di instradamento a livello di processo per questa funzionalità:

- L'instradamento del dispatcher Undici copre `fetch`, i client basati su undici e i trasporti che forniscono il proprio dispatcher undici.
- L'instradamento `global-agent` copre i chiamanti Node core `node:http` e `node:https`, incluse molte librerie basate su `http.request`, `https.request`, `http.get` e `https.get`. La modalità proxy gestita forza quell'agente globale affinché gli agent HTTP Node espliciti non aggirino accidentalmente il proxy dell'operatore.

Alcuni plugin possiedono trasporti personalizzati che richiedono un cablaggio proxy esplicito anche quando esiste l'instradamento a livello di processo. Ad esempio, il trasporto Bot API di Telegram usa il proprio dispatcher HTTP/1 undici e quindi rispetta le variabili di ambiente del proxy di processo più il fallback gestito `OPENCLAW_PROXY_URL` in quel percorso di trasporto specifico del proprietario.

L'URL del proxy stesso deve usare `http://`. Le destinazioni HTTPS sono comunque supportate attraverso il proxy con HTTP `CONNECT`; questo significa soltanto che OpenClaw si aspetta un listener proxy forward HTTP in chiaro, come `http://127.0.0.1:3128`.

Mentre il proxy è attivo, OpenClaw cancella `no_proxy`, `NO_PROXY` e `GLOBAL_AGENT_NO_PROXY`. Queste liste di bypass sono basate sulla destinazione, quindi lasciare `localhost` o `127.0.0.1` al loro interno permetterebbe a target SSRF ad alto rischio di saltare il proxy di filtraggio.

All'arresto, OpenClaw ripristina l'ambiente proxy precedente e reimposta lo stato di instradamento del processo memorizzato nella cache.

## Termini proxy correlati

- `proxy.enabled` / `proxy.proxyUrl`: instradamento tramite proxy forward in uscita per il traffico di runtime di OpenClaw. Questa pagina documenta tale funzionalità.
- `gateway.auth.mode: "trusted-proxy"`: autenticazione reverse proxy in ingresso sensibile all'identità per l'accesso al Gateway. Vedi [Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy di debug locale e ispettore di acquisizione per sviluppo e supporto. Vedi [openclaw proxy](/it/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opzione di adesione per `web_fetch` che consente a un proxy env HTTP(S) controllato dall'operatore di risolvere il DNS mantenendo il pinning DNS rigoroso predefinito e il criterio per i nomi host. Vedi [Web fetch](/it/tools/web-fetch#trusted-env-proxy).
- Impostazioni proxy specifiche del canale o del provider: override specifici del proprietario per un particolare trasporto. Preferisci il proxy di rete gestito quando l'obiettivo è il controllo centralizzato dell'uscita nell'intero runtime.

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

`proxy.proxyUrl` ha la precedenza su `OPENCLAW_PROXY_URL`.

Se `enabled=true` ma non è configurato alcun URL proxy valido, i comandi protetti non completano l'avvio invece di ripiegare sull'accesso diretto alla rete.

Per i servizi gateway gestiti avviati con `openclaw gateway start`, preferisci archiviare l'URL nella configurazione:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Il fallback dell'ambiente è più adatto alle esecuzioni in foreground. Se lo usi con un servizio installato, metti `OPENCLAW_PROXY_URL` nell'ambiente durevole del servizio, come `$OPENCLAW_STATE_DIR/.env` o `~/.openclaw/.env`, quindi reinstalla il servizio in modo che launchd, systemd o Scheduled Tasks avvii il gateway con quel valore.

Per i comandi `openclaw --container ...`, OpenClaw inoltra `OPENCLAW_PROXY_URL` alla CLI figlia destinata al container quando è impostato. L'URL deve essere raggiungibile dall'interno del container; `127.0.0.1` si riferisce al container stesso, non all'host. OpenClaw rifiuta gli URL proxy loopback per i comandi destinati al container a meno che tu non esegua esplicitamente l'override di quel controllo di sicurezza.

## Requisiti del proxy

Il criterio del proxy è il confine di sicurezza. OpenClaw non può verificare che il proxy blocchi i target corretti.

Configura il proxy per:

- Eseguire il bind solo su loopback o su un'interfaccia privata attendibile.
- Limitare l'accesso in modo che solo il processo, l'host, il container o l'account di servizio OpenClaw possano usarlo.
- Risolvere autonomamente le destinazioni e bloccare gli IP di destinazione dopo la risoluzione DNS.
- Applicare il criterio al momento della connessione sia per le richieste HTTP in chiaro sia per i tunnel HTTPS `CONNECT`.
- Rifiutare bypass basati sulla destinazione per intervalli loopback, privati, link-local, metadati, multicast, riservati o di documentazione.
- Evitare allowlist di nomi host a meno che tu non abbia piena fiducia nel percorso di risoluzione DNS.
- Registrare destinazione, decisione, stato e motivo senza registrare corpi delle richieste, header di autorizzazione, cookie o altri segreti.
- Mantenere il criterio del proxy sotto controllo versione e rivedere le modifiche come configurazione sensibile per la sicurezza.

## Destinazioni bloccate consigliate

Usa questa denylist come punto di partenza per qualsiasi proxy forward, firewall o criterio di uscita.

La logica del classificatore a livello applicativo di OpenClaw risiede in `src/infra/net/ssrf.ts` e `src/shared/net/ip.ts`. Gli hook di parità rilevanti sono `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` e la gestione sentinel IPv4 incorporata per NAT64, 6to4, Teredo, ISATAP e forme IPv4-mapped. Questi file sono riferimenti utili quando mantieni un criterio proxy esterno, ma OpenClaw non esporta né applica automaticamente quelle regole nel tuo proxy.

| Intervallo o host                                                                     | Perché bloccarlo                                      |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                        |
| `::1/128`                                                                            | Loopback IPv6                                        |
| `0.0.0.0/8`, `::/128`                                                                | Indirizzi non specificati e this-network             |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Reti private RFC1918                                 |
| `169.254.0.0/16`, `fe80::/10`                                                        | Indirizzi link-local e percorsi comuni di metadati cloud |
| `169.254.169.254`, `metadata.google.internal`                                        | Servizi di metadati cloud                            |
| `100.64.0.0/10`                                                                      | Spazio di indirizzi condiviso NAT carrier-grade      |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Intervalli di benchmarking                           |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Intervalli per uso speciale e documentazione         |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | IPv4 riservato                                       |
| `fc00::/7`, `fec0::/10`                                                              | Intervalli IPv6 locali/privati                       |
| `100::/64`, `2001:20::/28`                                                           | Intervalli IPv6 discard e ORCHIDv2                   |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefissi NAT64 con IPv4 incorporato                  |
| `2002::/16`, `2001::/32`                                                             | 6to4 e Teredo con IPv4 incorporato                   |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatibile con IPv4 e IPv6 IPv4-mapped         |

Se il tuo provider cloud o la tua piattaforma di rete documenta ulteriori host di metadati o intervalli riservati, aggiungi anche quelli.

## Validazione

Convalida il proxy dallo stesso host, container o account di servizio che esegue OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Per impostazione predefinita, quando non vengono fornite destinazioni personalizzate, il comando verifica che `https://example.com/` abbia successo e avvia un canary loopback temporaneo che il proxy non deve raggiungere. Il controllo negato predefinito passa quando il proxy restituisce una risposta di diniego non 2xx o blocca il canary con un errore di trasporto; fallisce se una risposta riuscita raggiunge il canary. Se nessun proxy è abilitato e configurato, la validazione segnala un problema di configurazione; usa `--proxy-url` per un preflight una tantum prima di modificare la configurazione. Usa `--allowed-url` e `--denied-url` per testare le aspettative specifiche della distribuzione. Aggiungi `--apns-reachable` per verificare anche che la consegna diretta HTTP/2 APNs possa aprire un tunnel CONNECT attraverso il proxy e ricevere una risposta APNs sandbox; il probe usa un token provider intenzionalmente non valido, quindi `403 InvalidProviderToken` è previsto e conta come raggiungibile. Le destinazioni negate personalizzate sono fail-closed: qualsiasi risposta HTTP significa che la destinazione era raggiungibile attraverso il proxy, e qualsiasi errore di trasporto viene segnalato come inconcludente perché OpenClaw non può dimostrare che il proxy abbia bloccato un'origine raggiungibile. In caso di errore di validazione, il comando termina con codice 1.

Usa `--json` per l'automazione. L'output JSON contiene il risultato complessivo, la sorgente effettiva della configurazione del proxy, eventuali errori di configurazione e il controllo di ogni destinazione. Le credenziali dell'URL del proxy vengono oscurate nell'output testuale e JSON:

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

La richiesta pubblica dovrebbe riuscire. Le richieste a loopback e ai metadati dovrebbero essere bloccate dal proxy. Per `openclaw proxy validate`, il canary loopback integrato può distinguere un rifiuto del proxy da un'origine raggiungibile. I controlli `--denied-url` personalizzati non hanno quel canary, quindi tratta sia le risposte HTTP sia gli errori di trasporto ambigui come errori di convalida, a meno che il proxy non esponga un segnale di rifiuto specifico della distribuzione che puoi verificare separatamente.

Poi abilita il routing proxy di OpenClaw:

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

- Il proxy migliora la copertura per i client HTTP e WebSocket JavaScript locali al processo, ma non è una sandbox di rete a livello di sistema operativo.
- I socket grezzi `net`, `tls` e `http2`, gli addon nativi e i processi figli possono aggirare il routing proxy a livello di Node, a meno che non ereditino e rispettino le variabili d'ambiente del proxy.
- IRC è un canale TCP/TLS grezzo al di fuori del routing tramite forward proxy gestito dall'operatore. Nelle distribuzioni che richiedono che tutto il traffico in uscita passi attraverso quel forward proxy, imposta `channels.irc.enabled=false` a meno che il traffico IRC diretto in uscita non sia approvato esplicitamente.
- Il proxy di debug locale è uno strumento diagnostico e il suo inoltro diretto upstream per le richieste proxy e i tunnel CONNECT è disabilitato per impostazione predefinita mentre la modalità proxy gestita è attiva; abilita l'inoltro diretto solo per diagnostica locale approvata.
- Le WebUI locali dell'utente e i server di modelli locali dovrebbero essere inseriti nell'allowlist dei criteri proxy dell'operatore quando necessario; OpenClaw non espone per essi un bypass generale della rete locale.
- Il bypass del proxy per il piano di controllo del Gateway è intenzionalmente limitato a `localhost` e agli URL con IP letterali di loopback. Usa `ws://127.0.0.1:18789`, `ws://[::1]:18789` o `ws://localhost:18789` per connessioni dirette locali al piano di controllo del Gateway; altri nomi host vengono instradati come normale traffico basato su nome host.
- OpenClaw non ispeziona, testa né certifica i tuoi criteri proxy.
- Tratta le modifiche ai criteri proxy come modifiche operative sensibili per la sicurezza.
