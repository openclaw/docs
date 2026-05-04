---
read_when:
    - Si desidera una difesa in profondità contro gli attacchi SSRF e di DNS rebinding
    - Configurazione di un proxy forward esterno per il traffico di runtime di OpenClaw
summary: Come instradare il traffico HTTP e WebSocket del runtime OpenClaw attraverso un proxy di filtraggio gestito dall'operatore
title: Proxy di rete
x-i18n:
    generated_at: "2026-05-04T07:08:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7140c5ced0e7454a6f85d1ea8f3256bbd28cc0cb42eeafe8e5e6439b90e3f0
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy di rete

OpenClaw può instradare il traffico HTTP e WebSocket di runtime attraverso un proxy forward gestito dall'operatore. Si tratta di una difesa in profondità opzionale per distribuzioni che vogliono un controllo centralizzato dell'egresso, una protezione SSRF più forte e una migliore verificabilità della rete.

OpenClaw non fornisce, scarica, avvia, configura o certifica un proxy. Esegui la tecnologia proxy adatta al tuo ambiente e OpenClaw instrada attraverso di essa i normali client HTTP e WebSocket locali al processo.

## Perché usare un proxy?

Un proxy offre agli operatori un unico punto di controllo di rete per il traffico HTTP e WebSocket in uscita. Può essere utile anche al di fuori dell'irrobustimento contro SSRF:

- Criterio centralizzato: mantieni un unico criterio di egresso invece di affidarti a ogni punto di chiamata HTTP dell'applicazione perché applichi correttamente le regole di rete.
- Controlli al momento della connessione: valuta la destinazione dopo la risoluzione DNS e immediatamente prima che il proxy apra la connessione upstream.
- Difesa dal DNS rebinding: riduce il divario tra un controllo DNS a livello applicativo e la connessione in uscita effettiva.
- Copertura JavaScript più ampia: instrada `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch e client simili ordinari attraverso lo stesso percorso.
- Verificabilità: registra destinazioni consentite e negate al confine di egresso.
- Controllo operativo: applica regole di destinazione, segmentazione di rete, limiti di frequenza o allowlist in uscita senza ricompilare OpenClaw.

L'instradamento tramite proxy è un guardrail a livello di processo per il normale egresso HTTP e WebSocket. Offre agli operatori un percorso fail-closed per instradare i client HTTP JavaScript supportati attraverso il proprio proxy di filtraggio, ma non è una sandbox di rete a livello di sistema operativo e non fa sì che OpenClaw certifichi il criterio di destinazione del proxy.

## Come OpenClaw instrada il traffico

Quando `proxy.enabled=true` e viene configurato un URL del proxy, i processi di runtime protetti come `openclaw gateway run`, `openclaw node run` e `openclaw agent --local` instradano il normale egresso HTTP e WebSocket attraverso il proxy configurato:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Il contratto pubblico è il comportamento di instradamento, non gli hook interni di Node usati per implementarlo. I client WebSocket del control plane di OpenClaw Gateway usano un percorso diretto ristretto per il traffico RPC del Gateway local loopback quando l'URL del Gateway usa `localhost` o un IP di loopback letterale come `127.0.0.1` o `[::1]`. Quel percorso del control plane deve poter raggiungere i Gateway di loopback anche quando il proxy dell'operatore blocca le destinazioni di loopback. Le normali richieste HTTP e WebSocket di runtime continuano a usare il proxy configurato.

Internamente, OpenClaw usa due hook di instradamento a livello di processo per questa funzionalità:

- L'instradamento del dispatcher Undici copre `fetch`, i client basati su undici e i trasporti che forniscono il proprio dispatcher undici.
- L'instradamento `global-agent` copre i chiamanti core Node `node:http` e `node:https`, incluse molte librerie stratificate su `http.request`, `https.request`, `http.get` e `https.get`. La modalità proxy gestita forza quell'agente globale, così gli agent HTTP espliciti di Node non aggirano accidentalmente il proxy dell'operatore.

Alcuni plugin possiedono trasporti personalizzati che richiedono cablaggio proxy esplicito anche quando esiste l'instradamento a livello di processo. Per esempio, il trasporto Bot API di Telegram usa il proprio dispatcher HTTP/1 undici e quindi rispetta l'ambiente proxy del processo più il fallback gestito `OPENCLAW_PROXY_URL` in quel percorso di trasporto specifico del proprietario.

L'URL del proxy deve usare `http://`. Le destinazioni HTTPS sono comunque supportate attraverso il proxy con HTTP `CONNECT`; questo significa solo che OpenClaw si aspetta un listener proxy forward HTTP semplice, come `http://127.0.0.1:3128`.

Mentre il proxy è attivo, OpenClaw svuota `no_proxy`, `NO_PROXY` e `GLOBAL_AGENT_NO_PROXY`. Questi elenchi di bypass sono basati sulla destinazione, quindi lasciare lì `localhost` o `127.0.0.1` consentirebbe a destinazioni SSRF ad alto rischio di saltare il proxy di filtraggio.

All'arresto, OpenClaw ripristina l'ambiente proxy precedente e reimposta lo stato di instradamento del processo memorizzato nella cache.

## Termini proxy correlati

- `proxy.enabled` / `proxy.proxyUrl`: instradamento proxy forward in uscita per l'egresso di runtime di OpenClaw. Questa pagina documenta tale funzionalità.
- `gateway.auth.mode: "trusted-proxy"`: autenticazione reverse proxy in ingresso con consapevolezza dell'identità per l'accesso al Gateway. Vedi [Autenticazione trusted proxy](/it/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy di debug locale e ispettore di acquisizione per sviluppo e supporto. Vedi [openclaw proxy](/it/cli/proxy).
- Impostazioni proxy specifiche del canale o del provider: override specifici del proprietario per un determinato trasporto. Preferisci il proxy di rete gestito quando l'obiettivo è il controllo centralizzato dell'egresso in tutto il runtime.

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

Se `enabled=true` ma non è configurato alcun URL del proxy valido, i comandi protetti non completano l'avvio invece di ripiegare sull'accesso diretto alla rete.

Per i servizi gateway gestiti avviati con `openclaw gateway start`, preferisci archiviare l'URL nella configurazione:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Il fallback tramite ambiente è più adatto alle esecuzioni in foreground. Se lo usi con un servizio installato, metti `OPENCLAW_PROXY_URL` nell'ambiente durevole del servizio, ad esempio `$OPENCLAW_STATE_DIR/.env` o `~/.openclaw/.env`, quindi reinstalla il servizio in modo che launchd, systemd o Scheduled Tasks avviino il gateway con quel valore.

Per i comandi `openclaw --container ...`, OpenClaw inoltra `OPENCLAW_PROXY_URL` alla CLI figlia destinata al container quando è impostato. L'URL deve essere raggiungibile dall'interno del container; `127.0.0.1` si riferisce al container stesso, non all'host. OpenClaw rifiuta gli URL proxy di loopback per i comandi destinati ai container, a meno che non sovrascrivi esplicitamente quel controllo di sicurezza.

## Requisiti del proxy

Il criterio del proxy è il confine di sicurezza. OpenClaw non può verificare che il proxy blocchi le destinazioni corrette.

Configura il proxy per:

- Eseguire il bind solo a loopback o a un'interfaccia privata attendibile.
- Limitare l'accesso in modo che solo il processo, l'host, il container o l'account di servizio OpenClaw possano usarlo.
- Risolvere autonomamente le destinazioni e bloccare gli IP di destinazione dopo la risoluzione DNS.
- Applicare il criterio al momento della connessione sia per le richieste HTTP semplici sia per i tunnel HTTPS `CONNECT`.
- Rifiutare i bypass basati sulla destinazione per intervalli di loopback, privati, link-local, metadata, multicast, riservati o di documentazione.
- Evitare allowlist di nomi host a meno che tu non abbia piena fiducia nel percorso di risoluzione DNS.
- Registrare destinazione, decisione, stato e motivo senza registrare corpi delle richieste, header di autorizzazione, cookie o altri segreti.
- Mantenere il criterio del proxy sotto controllo versione e revisionare le modifiche come configurazione sensibile per la sicurezza.

## Destinazioni bloccate consigliate

Usa questa denylist come punto di partenza per qualsiasi proxy forward, firewall o criterio di egresso.

La logica di classificazione a livello applicativo di OpenClaw si trova in `src/infra/net/ssrf.ts` e `src/shared/net/ip.ts`. Gli hook di parità rilevanti sono `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` e la gestione sentinella IPv4 incorporata per NAT64, 6to4, Teredo, ISATAP e forme IPv4-mapped. Questi file sono riferimenti utili quando si mantiene un criterio proxy esterno, ma OpenClaw non esporta né applica automaticamente tali regole nel tuo proxy.

| Intervallo o host                                                                    | Perché bloccarlo                                    |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                       |
| `::1/128`                                                                            | Loopback IPv6                                       |
| `0.0.0.0/8`, `::/128`                                                                | Indirizzi non specificati e di questa rete          |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Reti private RFC1918                                |
| `169.254.0.0/16`, `fe80::/10`                                                        | Indirizzi link-local e percorsi comuni di metadata cloud |
| `169.254.169.254`, `metadata.google.internal`                                        | Servizi di metadata cloud                           |
| `100.64.0.0/10`                                                                      | Spazio di indirizzi condiviso NAT carrier-grade     |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Intervalli di benchmarking                          |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Intervalli special-use e di documentazione          |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                           |
| `240.0.0.0/4`                                                                        | IPv4 riservato                                      |
| `fc00::/7`, `fec0::/10`                                                              | Intervalli IPv6 locali/privati                      |
| `100::/64`, `2001:20::/28`                                                           | Intervalli IPv6 discard e ORCHIDv2                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefissi NAT64 con IPv4 incorporato                 |
| `2002::/16`, `2001::/32`                                                             | 6to4 e Teredo con IPv4 incorporato                  |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatibile con IPv4 e IPv6 IPv4-mapped        |

Se il tuo provider cloud o la tua piattaforma di rete documenta host di metadata o intervalli riservati aggiuntivi, aggiungi anche quelli.

## Validazione

Valida il proxy dallo stesso host, container o account di servizio che esegue OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Per impostazione predefinita, quando non vengono fornite destinazioni personalizzate, il comando verifica che `https://example.com/` abbia successo e avvia un canary di loopback temporaneo che il proxy non deve raggiungere. Il controllo negato predefinito passa quando il proxy restituisce una risposta di negazione non 2xx oppure blocca il canary con un errore di trasporto; fallisce se una risposta riuscita raggiunge il canary. Se nessun proxy è abilitato e configurato, la validazione segnala un problema di configurazione; usa `--proxy-url` per un preflight una tantum prima di modificare la configurazione. Usa `--allowed-url` e `--denied-url` per testare aspettative specifiche della distribuzione. Le destinazioni negate personalizzate sono fail-closed: qualsiasi risposta HTTP significa che la destinazione era raggiungibile attraverso il proxy e qualsiasi errore di trasporto viene segnalato come inconcludente perché OpenClaw non può dimostrare che il proxy abbia bloccato un'origine raggiungibile. In caso di fallimento della validazione, il comando esce con codice 1.

Usa `--json` per l'automazione. L'output JSON contiene il risultato complessivo, la fonte effettiva della configurazione proxy, eventuali errori di configurazione e ogni controllo di destinazione. Le credenziali dell'URL proxy sono oscurate nell'output testuale e JSON:

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

La richiesta pubblica dovrebbe riuscire. Le richieste loopback e di metadata dovrebbero essere bloccate dal proxy. Per `openclaw proxy validate`, il canary loopback integrato può distinguere un rifiuto del proxy da un'origine raggiungibile. I controlli `--denied-url` personalizzati non hanno quel canary, quindi considera sia le risposte HTTP sia gli errori di trasporto ambigui come errori di convalida, a meno che il tuo proxy non esponga un segnale di rifiuto specifico del deployment che puoi verificare separatamente.

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
- Socket raw `net`, `tls` e `http2`, addon nativi e processi figli possono aggirare il routing proxy a livello Node, a meno che ereditino e rispettino le variabili d'ambiente del proxy.
- IRC è un canale TCP/TLS raw al di fuori del routing tramite forward proxy gestito dall'operatore. Nei deployment che richiedono che tutto il traffico in uscita passi attraverso quel forward proxy, imposta `channels.irc.enabled=false`, a meno che l'uscita IRC diretta non sia esplicitamente approvata.
- Il proxy di debug locale è uno strumento diagnostico e il suo inoltro diretto verso monte per richieste proxy e tunnel CONNECT è disabilitato per impostazione predefinita mentre la modalità proxy gestita è attiva; abilita l'inoltro diretto solo per diagnostica locale approvata.
- Le WebUI locali dell'utente e i server modello locali dovrebbero essere inseriti nella allowlist nella policy proxy dell'operatore quando necessario; OpenClaw non espone per essi un bypass generale della rete locale.
- Il bypass del proxy del piano di controllo del Gateway è intenzionalmente limitato a `localhost` e agli URL IP loopback letterali. Usa `ws://127.0.0.1:18789`, `ws://[::1]:18789` o `ws://localhost:18789` per connessioni locali dirette al piano di controllo del Gateway; gli altri nomi host vengono instradati come normale traffico basato su nome host.
- OpenClaw non ispeziona, testa né certifica la tua policy proxy.
- Considera le modifiche alla policy proxy come modifiche operative sensibili per la sicurezza.
