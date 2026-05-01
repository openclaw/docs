---
read_when:
    - Vuoi una difesa in profondità contro attacchi SSRF e di riassociazione DNS
    - Configurazione di un proxy forward esterno per il traffico di runtime di OpenClaw
summary: Come instradare il traffico HTTP e WebSocket del runtime OpenClaw attraverso un proxy di filtraggio gestito dall'operatore
title: Proxy di rete
x-i18n:
    generated_at: "2026-05-01T08:34:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9207d349e4410e38631ae7665be19b536e4a4128a4e80dd095e802804dfd66a3
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy di rete

OpenClaw può instradare il traffico HTTP e WebSocket di runtime tramite un forward proxy gestito dall'operatore. È una difesa in profondità opzionale per distribuzioni che vogliono un controllo centralizzato dell'uscita, una protezione SSRF più forte e una migliore verificabilità della rete tramite audit.

OpenClaw non distribuisce, scarica, avvia, configura né certifica un proxy. Esegui la tecnologia proxy adatta al tuo ambiente e OpenClaw vi instrada i normali client HTTP e WebSocket locali al processo.

## Perché usare un proxy?

Un proxy offre agli operatori un unico punto di controllo di rete per il traffico HTTP e WebSocket in uscita. Può essere utile anche al di fuori dell'irrobustimento contro SSRF:

- Criterio centralizzato: mantieni un unico criterio di uscita invece di affidarti al fatto che ogni punto di chiamata HTTP dell'applicazione applichi correttamente le regole di rete.
- Controlli al momento della connessione: valuta la destinazione dopo la risoluzione DNS e subito prima che il proxy apra la connessione upstream.
- Difesa contro il DNS rebinding: riduci lo scarto tra un controllo DNS a livello applicativo e la connessione in uscita effettiva.
- Copertura JavaScript più ampia: instrada i normali client `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch e client simili attraverso lo stesso percorso.
- Verificabilità tramite audit: registra le destinazioni consentite e negate al confine di uscita.
- Controllo operativo: applica regole sulle destinazioni, segmentazione di rete, limiti di frequenza o allowlist in uscita senza ricompilare OpenClaw.

L'instradamento tramite proxy è un guardrail a livello di processo per la normale uscita HTTP e WebSocket. Offre agli operatori un percorso fail-closed per instradare i client HTTP JavaScript supportati tramite il proprio proxy di filtraggio, ma non è una sandbox di rete a livello di sistema operativo e non fa sì che OpenClaw certifichi il criterio di destinazione del proxy.

## Come OpenClaw instrada il traffico

Quando `proxy.enabled=true` e viene configurato un URL del proxy, i processi di runtime protetti come `openclaw gateway run`, `openclaw node run` e `openclaw agent --local` instradano la normale uscita HTTP e WebSocket tramite il proxy configurato:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Il contratto pubblico è il comportamento di instradamento, non gli hook Node interni usati per implementarlo. I client WebSocket del piano di controllo di OpenClaw Gateway usano un percorso diretto ristretto per il traffico RPC Gateway su local loopback quando l'URL del Gateway usa `localhost` o un IP di loopback letterale come `127.0.0.1` o `[::1]`. Quel percorso del piano di controllo deve poter raggiungere i Gateway di loopback anche quando il proxy dell'operatore blocca le destinazioni di loopback. Le normali richieste HTTP e WebSocket di runtime continuano a usare il proxy configurato.

Internamente, OpenClaw usa due hook di instradamento a livello di processo per questa funzionalità:

- L'instradamento del dispatcher Undici copre `fetch`, i client basati su undici e i trasporti che forniscono il proprio dispatcher undici.
- L'instradamento `global-agent` copre i chiamanti Node core `node:http` e `node:https`, incluse molte librerie stratificate su `http.request`, `https.request`, `http.get` e `https.get`. La modalità proxy gestita forza quell'agente globale, così gli agent HTTP Node espliciti non possono aggirare accidentalmente il proxy dell'operatore.

Alcuni Plugin possiedono trasporti personalizzati che richiedono un cablaggio proxy esplicito anche quando esiste l'instradamento a livello di processo. Per esempio, il trasporto Bot API di Telegram usa il proprio dispatcher HTTP/1 undici e quindi rispetta l'ambiente proxy del processo più il fallback gestito `OPENCLAW_PROXY_URL` in quel percorso di trasporto specifico del proprietario.

L'URL del proxy deve usare `http://`. Le destinazioni HTTPS sono comunque supportate tramite il proxy con HTTP `CONNECT`; questo significa solo che OpenClaw si aspetta un listener forward-proxy HTTP in chiaro, come `http://127.0.0.1:3128`.

Mentre il proxy è attivo, OpenClaw cancella `no_proxy`, `NO_PROXY` e `GLOBAL_AGENT_NO_PROXY`. Quelle liste di bypass sono basate sulla destinazione, quindi lasciare lì `localhost` o `127.0.0.1` permetterebbe a destinazioni SSRF ad alto rischio di saltare il proxy di filtraggio.

All'arresto, OpenClaw ripristina l'ambiente proxy precedente e reimposta lo stato di instradamento del processo memorizzato nella cache.

## Termini proxy correlati

- `proxy.enabled` / `proxy.proxyUrl`: instradamento forward-proxy in uscita per l'uscita di runtime di OpenClaw. Questa pagina documenta tale funzionalità.
- `gateway.auth.mode: "trusted-proxy"`: autenticazione tramite reverse proxy in ingresso con consapevolezza dell'identità per l'accesso al Gateway. Vedi [Autenticazione trusted proxy](/it/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy di debug locale e ispettore di acquisizione per sviluppo e supporto. Vedi [openclaw proxy](/it/cli/proxy).
- Impostazioni proxy specifiche del canale o del provider: override specifici del proprietario per un particolare trasporto. Preferisci il proxy di rete gestito quando l'obiettivo è il controllo centralizzato dell'uscita in tutto il runtime.

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

Se `enabled=true` ma non è configurato un URL del proxy valido, i comandi protetti falliscono all'avvio invece di ripiegare sull'accesso diretto alla rete.

Per i servizi Gateway gestiti avviati con `openclaw gateway start`, preferisci salvare l'URL nella configurazione:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Il fallback tramite ambiente è più adatto alle esecuzioni in primo piano. Se lo usi con un servizio installato, inserisci `OPENCLAW_PROXY_URL` nell'ambiente durevole del servizio, come `$OPENCLAW_STATE_DIR/.env` o `~/.openclaw/.env`, quindi reinstalla il servizio in modo che launchd, systemd o Scheduled Tasks avviino il gateway con quel valore.

Per i comandi `openclaw --container ...`, OpenClaw inoltra `OPENCLAW_PROXY_URL` alla CLI figlia destinata al container quando è impostato. L'URL deve essere raggiungibile dall'interno del container; `127.0.0.1` fa riferimento al container stesso, non all'host. OpenClaw rifiuta gli URL proxy di loopback per i comandi destinati ai container, a meno che tu non sovrascriva esplicitamente quel controllo di sicurezza.

## Requisiti del proxy

Il criterio del proxy è il confine di sicurezza. OpenClaw non può verificare che il proxy blocchi le destinazioni corrette.

Configura il proxy per:

- Ascoltare solo su loopback o su un'interfaccia privata attendibile.
- Limitare l'accesso in modo che solo il processo, l'host, il container o l'account di servizio di OpenClaw possano usarlo.
- Risolvere autonomamente le destinazioni e bloccare gli IP di destinazione dopo la risoluzione DNS.
- Applicare il criterio al momento della connessione sia per le richieste HTTP in chiaro sia per i tunnel HTTPS `CONNECT`.
- Rifiutare i bypass basati sulla destinazione per intervalli di loopback, privati, link-local, metadata, multicast, riservati o di documentazione.
- Evitare allowlist di nomi host a meno che tu non consideri pienamente attendibile il percorso di risoluzione DNS.
- Registrare destinazione, decisione, stato e motivo senza registrare corpi delle richieste, header di autorizzazione, cookie o altri segreti.
- Tenere il criterio del proxy sotto controllo versione e revisionare le modifiche come configurazione sensibile per la sicurezza.

## Destinazioni bloccate consigliate

Usa questa denylist come punto di partenza per qualsiasi forward proxy, firewall o criterio di uscita.

La logica del classificatore a livello applicativo di OpenClaw si trova in `src/infra/net/ssrf.ts` e `src/shared/net/ip.ts`. Gli hook di parità rilevanti sono `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` e la gestione sentinel IPv4 incorporata per NAT64, 6to4, Teredo, ISATAP e forme IPv4-mapped. Quei file sono riferimenti utili quando si mantiene un criterio proxy esterno, ma OpenClaw non esporta né applica automaticamente quelle regole nel tuo proxy.

| Intervallo o host                                                                    | Motivo del blocco                                  |
| ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                      |
| `::1/128`                                                                            | Loopback IPv6                                      |
| `0.0.0.0/8`, `::/128`                                                                | Indirizzi non specificati e this-network           |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Reti private RFC1918                               |
| `169.254.0.0/16`, `fe80::/10`                                                        | Indirizzi link-local e percorsi comuni di metadata cloud |
| `169.254.169.254`, `metadata.google.internal`                                        | Servizi di metadata cloud                          |
| `100.64.0.0/10`                                                                      | Spazio di indirizzi condiviso NAT carrier-grade    |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Intervalli di benchmark                            |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Intervalli special-use e di documentazione         |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                          |
| `240.0.0.0/4`                                                                        | IPv4 riservato                                     |
| `fc00::/7`, `fec0::/10`                                                              | Intervalli IPv6 locali/privati                     |
| `100::/64`, `2001:20::/28`                                                           | Intervalli IPv6 discard e ORCHIDv2                 |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefissi NAT64 con IPv4 incorporato                |
| `2002::/16`, `2001::/32`                                                             | 6to4 e Teredo con IPv4 incorporato                 |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatibile con IPv4 e IPv6 IPv4-mapped       |

Se il tuo provider cloud o la tua piattaforma di rete documenta host di metadata o intervalli riservati aggiuntivi, aggiungi anche quelli.

## Validazione

Valida il proxy dallo stesso host, container o account di servizio che esegue OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Per impostazione predefinita, quando non vengono fornite destinazioni personalizzate, il comando verifica che `https://example.com/` abbia successo e avvia un canary temporaneo di loopback che il proxy non deve raggiungere. Il controllo negato predefinito passa quando il proxy restituisce una risposta di negazione non 2xx o blocca il canary con un errore di trasporto; fallisce se una risposta riuscita raggiunge il canary. Se nessun proxy è abilitato e configurato, la validazione segnala un problema di configurazione; usa `--proxy-url` per un preflight una tantum prima di modificare la configurazione. Usa `--allowed-url` e `--denied-url` per testare aspettative specifiche della distribuzione. Le destinazioni negate personalizzate sono fail-closed: qualsiasi risposta HTTP significa che la destinazione era raggiungibile tramite il proxy, e qualsiasi errore di trasporto viene segnalato come inconcludente perché OpenClaw non può provare che il proxy abbia bloccato un'origine raggiungibile. In caso di errore di validazione, il comando esce con codice 1.

Usa `--json` per l'automazione. L'output JSON contiene il risultato complessivo, la fonte effettiva della configurazione proxy, eventuali errori di configurazione e ogni controllo di destinazione. Le credenziali dell'URL del proxy vengono oscurate nell'output testuale e JSON:

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

Puoi anche validare manualmente con `curl`:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

La richiesta pubblica dovrebbe riuscire. Le richieste loopback e ai metadati dovrebbero essere bloccate dal proxy. Per `openclaw proxy validate`, il canary loopback integrato può distinguere un diniego del proxy da un'origine raggiungibile. I controlli personalizzati `--denied-url` non hanno quel canary, quindi considera sia le risposte HTTP sia gli errori di trasporto ambigui come errori di validazione, a meno che il tuo proxy non esponga un segnale di diniego specifico della distribuzione che puoi verificare separatamente.

Poi abilita l'instradamento del proxy di OpenClaw:

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
- I socket raw `net`, `tls` e `http2`, gli addon nativi e i processi figlio possono aggirare l'instradamento del proxy a livello di Node, a meno che non ereditino e rispettino le variabili d'ambiente del proxy.
- Le WebUI locali dell'utente e i server di modelli locali dovrebbero essere inseriti nella allowlist nella policy del proxy dell'operatore quando necessario; OpenClaw non espone per loro un bypass generale della rete locale.
- Il bypass del proxy per il piano di controllo del Gateway è intenzionalmente limitato a `localhost` e agli URL con IP loopback letterali. Usa `ws://127.0.0.1:18789`, `ws://[::1]:18789` o `ws://localhost:18789` per connessioni locali dirette al piano di controllo del Gateway; gli altri nomi host vengono instradati come normale traffico basato su nome host.
- OpenClaw non ispeziona, testa né certifica la tua policy del proxy.
- Tratta le modifiche alla policy del proxy come modifiche operative sensibili per la sicurezza.
