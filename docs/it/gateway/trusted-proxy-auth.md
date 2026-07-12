---
read_when:
    - Esecuzione di OpenClaw dietro un proxy con riconoscimento dell'identità
    - Configurazione di Pomerium, Caddy o nginx con OAuth davanti a OpenClaw
    - Correzione degli errori WebSocket 1008 di mancata autorizzazione nelle configurazioni con proxy inverso
    - Decidere dove impostare HSTS e le altre intestazioni di sicurezza HTTP
sidebarTitle: Trusted proxy auth
summary: Delega l'autenticazione del Gateway a un reverse proxy attendibile (Pomerium, Caddy, nginx + OAuth)
title: Autenticazione tramite proxy attendibile
x-i18n:
    generated_at: "2026-07-12T07:07:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Funzionalità sensibile per la sicurezza.** Questa modalità delega interamente l'autenticazione al proxy inverso. Una configurazione errata può esporre il Gateway ad accessi non autorizzati. Leggi attentamente questa pagina prima di abilitarla.
</Warning>

## Quando utilizzarla

- Esegui OpenClaw dietro un **proxy con riconoscimento dell'identità** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + autenticazione inoltrata).
- Il proxy gestisce tutta l'autenticazione e trasmette l'identità dell'utente tramite intestazioni.
- Ti trovi in un ambiente Kubernetes o containerizzato in cui il proxy è l'unico percorso verso il Gateway.
- Riscontri errori WebSocket `1008 unauthorized` perché i browser non possono trasmettere token nei payload WS.

## Quando NON utilizzarla

- Il proxy non autentica gli utenti, ma funge soltanto da terminatore TLS o bilanciatore del carico.
- Esiste un qualsiasi percorso verso il Gateway che aggira il proxy, ad esempio aperture nel firewall o accesso dalla rete interna.
- Non hai la certezza che il proxy rimuova o sovrascriva correttamente le intestazioni inoltrate.
- Ti serve soltanto un accesso personale per un singolo utente; valuta invece Tailscale Serve + local loopback.

## Come funziona

<Steps>
  <Step title="Proxy authenticates the user">
    Il proxy inverso autentica gli utenti tramite OAuth, OIDC, SAML e così via.
  </Step>
  <Step title="Proxy adds an identity header">
    Il proxy aggiunge un'intestazione contenente l'identità dell'utente autenticato, ad esempio `x-forwarded-user: nick@example.com`.
  </Step>
  <Step title="Gateway verifies trusted source">
    OpenClaw verifica che la richiesta provenga dall'**IP di un proxy attendibile** (`gateway.trustedProxies`) e che non provenga dall'indirizzo local loopback o da un indirizzo dell'interfaccia locale del Gateway.
  </Step>
  <Step title="Gateway extracts identity">
    OpenClaw legge le intestazioni richieste, quindi ricava l'identità dell'utente dall'intestazione configurata.
  </Step>
  <Step title="Authorize">
    Se tutte le verifiche hanno esito positivo e l'utente supera il controllo `allowUsers`, quando configurato, la richiesta viene autorizzata.
  </Step>
</Steps>

## Configurazione

```json5
{
  gateway: {
    // Trusted-proxy auth expects the proxy's source IP to be non-loopback by default
    bind: "lan",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Optional: allow a same-host loopback proxy after explicit opt-in
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Regole di runtime, in ordine di valutazione**

1. L'IP di origine della richiesta deve corrispondere a `gateway.trustedProxies`, tenendo conto dei CIDR; in caso contrario, la richiesta viene rifiutata (`trusted_proxy_untrusted_source`).
2. Le richieste provenienti da local loopback (`127.0.0.1`, `::1`) vengono rifiutate, a meno che `gateway.auth.trustedProxy.allowLoopback = true` e anche l'indirizzo local loopback sia incluso in `trustedProxies` (`trusted_proxy_loopback_source`). Questo controllo viene eseguito prima dei controlli sulle intestazioni, quindi un'origine local loopback fallisce in questo modo anche quando mancano anche le intestazioni richieste.
3. Le origini non local loopback che corrispondono a uno degli indirizzi delle interfacce di rete locali dell'host del Gateway vengono rifiutate come protezione contro lo spoofing (`trusted_proxy_local_interface_source`). Se il rilevamento delle interfacce non riesce, viene rifiutata anche la richiesta (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` e `userHeader` devono essere presenti e non vuoti.
5. Se `allowUsers` non è vuoto, deve includere l'utente ricavato.

**Le informazioni fornite dalle intestazioni inoltrate prevalgono sulla località local loopback per il fallback locale diretto.** Se una richiesta arriva tramite local loopback ma contiene un'intestazione `Forwarded`, una qualsiasi intestazione `X-Forwarded-*` o un'intestazione `X-Real-IP`, tali informazioni la escludono dal fallback locale diretto basato su password e dal controllo dell'identità del dispositivo, anche se l'autenticazione tramite proxy attendibile continua a non riuscire perché l'origine è local loopback.

`allowLoopback` considera attendibili i processi locali sull'host del Gateway allo stesso livello del proxy inverso. Abilitalo soltanto quando il Gateway è ancora protetto tramite firewall dall'accesso remoto diretto e il proxy locale rimuove o sovrascrive le intestazioni di identità fornite dal client.

I client interni del Gateway che non passano attraverso il proxy inverso devono utilizzare `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, non le intestazioni di identità del proxy attendibile. Le distribuzioni della Control UI non local loopback richiedono comunque una configurazione esplicita di `gateway.controlUi.allowedOrigins`.
</Warning>

### Riferimento della configurazione

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Array di indirizzi IP, o CIDR, dei proxy da considerare attendibili. Le richieste provenienti da altri IP vengono rifiutate.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Deve essere `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Nome dell'intestazione contenente l'identità dell'utente autenticato.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Intestazioni aggiuntive che devono essere presenti affinché la richiesta sia considerata attendibile.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Elenco consentito delle identità utente. Se vuoto, consente tutti gli utenti autenticati.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  Supporto facoltativo per proxy inversi local loopback sullo stesso host.
</ParamField>

<Warning>
Abilita `allowLoopback` soltanto quando il proxy inverso locale costituisce il confine di attendibilità previsto. Qualsiasi processo locale in grado di connettersi al Gateway può tentare di inviare intestazioni di identità del proxy; mantieni quindi l'accesso diretto al Gateway privato per l'host e richiedi intestazioni gestite dal proxy, come `x-forwarded-proto`, oppure un'intestazione di attestazione firmata, se supportata dal proxy.
</Warning>

## Comportamento di associazione della Control UI

Quando `gateway.auth.mode = "trusted-proxy"` è attivo e la richiesta supera i controlli del proxy attendibile, le sessioni WebSocket della Control UI possono connettersi senza un'identità di associazione del dispositivo.

Implicazioni per gli ambiti:

- Le sessioni WebSocket della Control UI prive di dispositivo si connettono, ma per impostazione predefinita non ricevono alcun ambito operatore. OpenClaw azzera a `[]` l'elenco degli ambiti richiesti, affinché una sessione non associata a un dispositivo/token approvato non possa dichiarare autonomamente le proprie autorizzazioni.
- Se i metodi restituiscono `missing scope` dopo una connessione WebSocket riuscita, utilizza HTTPS affinché il browser possa generare l'identità del dispositivo e completare l'associazione. Consulta [HTTP non sicuro della Control UI](/it/web/control-ui#insecure-http).
- Solo in caso di emergenza: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` conserva gli ambiti richiesti anche senza identità del dispositivo. Ciò riduce gravemente la sicurezza; ripristina rapidamente l'impostazione precedente. Consulta [HTTP non sicuro della Control UI](/it/web/control-ui#insecure-http).

Limitazione degli ambiti tramite proxy inverso: se il proxy invia `x-openclaw-scopes` nella richiesta di aggiornamento WebSocket della Control UI, OpenClaw limita gli ambiti della sessione all'intersezione tra quelli richiesti e quelli dichiarati. Questa intestazione non concede ambiti, ma limita soltanto quelli che la sessione può possedere.

Implicazioni:

- In questa modalità, l'associazione non è più il controllo principale per l'accesso alla Control UI.
- I criteri di autenticazione del proxy inverso e `allowUsers` diventano il controllo degli accessi effettivo.
- Limita l'ingresso al Gateway esclusivamente agli IP dei proxy attendibili (`gateway.trustedProxies` + firewall).

I client WebSocket personalizzati non sono sessioni della Control UI. `gateway.controlUi.dangerouslyDisableDeviceAuth` non concede ambiti a client arbitrari con `client.mode: "backend"` o strutturati come client CLI. L'automazione personalizzata deve utilizzare l'identità e l'associazione del dispositivo, il percorso helper backend locale diretto riservato `client.id: "gateway-client"` oppure il [Plugin RPC HTTP di amministrazione](/it/plugins/admin-http-rpc), quando un'interfaccia HTTP di richiesta/risposta è più adatta.

## Intestazione degli ambiti operatore

L'autenticazione tramite proxy attendibile è una modalità HTTP **che include l'identità**, quindi i chiamanti possono facoltativamente dichiarare gli ambiti operatore tramite `x-openclaw-scopes` nelle richieste API HTTP.

Nota: gli ambiti WebSocket sono determinati dall'handshake del protocollo Gateway e dall'associazione dell'identità del dispositivo. Nelle richieste di aggiornamento WebSocket della Control UI, `x-openclaw-scopes` limita soltanto gli ambiti negoziati della sessione e non ne concede alcuno. Consulta [Comportamento di associazione della Control UI](#control-ui-pairing-behavior).

Esempi:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamento:

- Quando l'intestazione è presente, OpenClaw rispetta l'insieme di ambiti dichiarato.
- Quando l'intestazione è presente ma vuota, la richiesta dichiara di non avere **alcun** ambito operatore.
- Quando l'intestazione è assente, le normali API HTTP che includono l'identità utilizzano come fallback l'insieme standard predefinito degli ambiti operatore (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`).
- Per impostazione predefinita, le **route HTTP dei Plugin** con autenticazione Gateway sono più restrittive: quando `x-openclaw-scopes` è assente, il relativo ambito di runtime utilizza come fallback soltanto `operator.write`.
- Le richieste HTTP provenienti dal browser devono comunque superare il controllo `gateway.controlUi.allowedOrigins`, o la modalità di fallback deliberata basata sull'intestazione Host, anche dopo il successo dell'autenticazione tramite proxy attendibile.

Regola pratica: invia esplicitamente `x-openclaw-scopes` quando vuoi che una richiesta tramite proxy attendibile abbia ambiti più restrittivi di quelli predefiniti oppure quando una route di un Plugin con autenticazione Gateway richiede qualcosa di più ampio dell'ambito di scrittura.

## Terminazione TLS e HSTS

Utilizza un unico punto di terminazione TLS e applica HSTS in quel punto.

<Tabs>
  <Tab title="Proxy TLS termination (recommended)">
    Quando il proxy inverso gestisce HTTPS per `https://control.example.com`, configura `Strict-Transport-Security` nel proxy per quel dominio.

    - Adatto alle distribuzioni esposte a Internet.
    - Mantiene in un unico punto il certificato e i criteri di rafforzamento della sicurezza HTTP.
    - OpenClaw può continuare a utilizzare HTTP su local loopback dietro il proxy.

    Esempio di valore dell'intestazione:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS termination">
    Se OpenClaw serve direttamente HTTPS senza un proxy che termini TLS, configura:

    ```json5
    {
      gateway: {
        tls: { enabled: true },
        http: {
          securityHeaders: {
            strictTransportSecurity: "max-age=31536000; includeSubDomains",
          },
        },
      },
    }
    ```

    `strictTransportSecurity` accetta come valore una stringa per l'intestazione oppure `false` per disabilitarla esplicitamente.

  </Tab>
</Tabs>

### Indicazioni per l'implementazione

- Inizia con una durata massima breve, ad esempio `max-age=300`, durante la convalida del traffico.
- Passa a valori di lunga durata, ad esempio `max-age=31536000`, soltanto dopo aver raggiunto un elevato grado di affidabilità.
- Aggiungi `includeSubDomains` soltanto se ogni sottodominio è predisposto per HTTPS.
- Utilizza il precaricamento soltanto se soddisfi intenzionalmente i relativi requisiti per l'intero insieme dei domini.
- Lo sviluppo locale limitato a local loopback non trae vantaggio da HSTS.

## Esempi di configurazione del proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium trasmette l'identità in `x-pomerium-claim-email`, o in altre intestazioni delle attestazioni, e un JWT in `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium's IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-pomerium-claim-email",
            requiredHeaders: ["x-pomerium-jwt-assertion"],
          },
        },
      },
    }
    ```

    Frammento di configurazione di Pomerium:

    ```yaml
    routes:
      - from: https://openclaw.example.com
        to: http://openclaw-gateway:18789
        policy:
          - allow:
              or:
                - email:
                    is: nick@example.com
        pass_identity_headers: true
    ```

  </Accordion>
  <Accordion title="Caddy with OAuth">
    Caddy con il Plugin `caddy-security` può autenticare gli utenti e trasmettere le intestazioni di identità.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    Frammento di Caddyfile:

    ```caddy
    openclaw.example.com {
        authenticate with oauth2_provider
        authorize with policy1

        reverse_proxy openclaw:18789 {
            header_up X-Forwarded-User {http.auth.user.email}
        }
    }
    ```

  </Accordion>
  <Accordion title="nginx + oauth2-proxy">
    oauth2-proxy autentica gli utenti e trasmette l'identità in `x-auth-request-email`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-auth-request-email",
          },
        },
      },
    }
    ```

    Frammento di configurazione nginx:

    ```nginx
    location / {
        auth_request /oauth2/auth;
        auth_request_set $user $upstream_http_x_auth_request_email;

        proxy_pass http://openclaw:18789;
        proxy_set_header X-Auth-Request-Email $user;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    ```

  </Accordion>
  <Accordion title="Traefik with forward auth">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik container IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Configurazione mista dei token

L'avvio del Gateway rifiuta l'autenticazione tramite proxy attendibile se è configurato anche un token condiviso (`gateway.auth.token` o `OPENCLAW_GATEWAY_TOKEN`). Le due modalità si escludono a vicenda perché un token condiviso consentirebbe ai chiamanti sullo stesso host di autenticarsi attraverso un percorso completamente diverso dall'identità verificata dal proxy che questa modalità deve imporre.

Se l'avvio non riesce con un errore come `gateway auth mode is trusted-proxy, but a shared token is also configured`:

- Rimuovi il token condiviso quando utilizzi la modalità proxy attendibile, oppure
- Imposta `gateway.auth.mode` su `"token"` se intendi utilizzare l'autenticazione basata su token.

Le intestazioni d'identità del proxy attendibile provenienti dal local loopback continuano a rifiutare l'accesso in caso di errore: i chiamanti sullo stesso host non vengono autenticati implicitamente come utenti del proxy. I chiamanti interni di OpenClaw che ignorano il proxy possono invece autenticarsi con `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Il ripiego sul token rimane intenzionalmente non supportato nella modalità proxy attendibile.

## Elenco di controllo della sicurezza

Prima di abilitare l'autenticazione tramite proxy attendibile, verifica quanto segue:

- [ ] **Il proxy è l'unico percorso**: la porta del Gateway è protetta da firewall e accessibile esclusivamente dal proxy.
- [ ] **trustedProxies è ridotto al minimo**: include solo gli indirizzi IP effettivi del proxy, non intere sottoreti.
- [ ] **L'origine local loopback del proxy è intenzionale**: l'autenticazione tramite proxy attendibile rifiuta l'accesso in caso di errore per le richieste provenienti dal local loopback, a meno che `gateway.auth.trustedProxy.allowLoopback` non sia esplicitamente abilitato per un proxy sullo stesso host.
- [ ] **Il proxy elimina le intestazioni**: il proxy sovrascrive, senza aggiungere valori, le intestazioni `x-forwarded-*` provenienti dai client.
- [ ] **Terminazione TLS**: il proxy gestisce TLS; gli utenti si connettono tramite HTTPS.
- [ ] **allowedOrigins è esplicito**: l'interfaccia di controllo non in local loopback utilizza un valore esplicito per `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers è impostato** (consigliato): limita l'accesso agli utenti noti anziché consentirlo a chiunque sia autenticato.
- [ ] **Nessuna configurazione mista dei token**: non impostare contemporaneamente `gateway.auth.token` e `gateway.auth.mode: "trusted-proxy"`.
- [ ] **Il ripiego sulla password locale è privato**: se configuri `gateway.auth.password` per i chiamanti interni diretti, proteggi la porta del Gateway con un firewall affinché i client remoti che non passano dal proxy non possano raggiungerla direttamente.

## Controllo di sicurezza

`openclaw security audit` segnala l'autenticazione tramite proxy attendibile con un rilevamento di gravità **critica**. È intenzionale: serve a ricordare che la sicurezza è delegata alla configurazione del proxy.

Il controllo verifica:

- Avviso o promemoria critico di base `gateway.trusted_proxy_auth`.
- Configurazione `trustedProxies` mancante.
- Configurazione `userHeader` mancante.
- `allowUsers` vuoto, che consente l'accesso a qualsiasi utente autenticato.
- `allowLoopback` abilitato per le origini proxy sullo stesso host.

Ogni volta che l'interfaccia di controllo è esposta, si applicano anche rilevamenti distinti non specifici del proxy attendibile: `gateway.controlUi.allowedOrigins` con carattere jolly o mancante e ripiego sull'origine basato sull'intestazione Host.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    La richiesta non proviene da un indirizzo IP incluso in `gateway.trustedProxies`. Verifica quanto segue:

    - L'indirizzo IP del proxy è corretto? Gli indirizzi IP dei container Docker possono cambiare.
    - È presente un bilanciatore del carico davanti al proxy?
    - Utilizza `docker inspect` o `kubectl get pods -o wide` per individuare gli indirizzi IP effettivi.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw ha rifiutato una richiesta del proxy attendibile proveniente dal local loopback.

    Verifica quanto segue:

    - Il proxy si connette da `127.0.0.1` / `::1`?
    - Stai tentando di utilizzare l'autenticazione tramite proxy attendibile con un reverse proxy in local loopback sullo stesso host?

    Soluzione:

    - Preferisci l'autenticazione tramite token o password per i client interni sullo stesso host che non passano dal proxy, oppure
    - Instrada il traffico tramite un indirizzo di proxy attendibile non in local loopback e mantieni tale indirizzo IP in `gateway.trustedProxies`, oppure
    - Per un reverse proxy intenzionale sullo stesso host, imposta `gateway.auth.trustedProxy.allowLoopback = true`, mantieni l'indirizzo di local loopback in `gateway.trustedProxies` e assicurati che il proxy elimini o sovrascriva le intestazioni d'identità.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    L'indirizzo IP di origine della richiesta corrisponde a uno degli indirizzi delle interfacce di rete non in local loopback dell'host del Gateway, anziché al proxy: è una protezione dal traffico contraffatto proveniente dallo stesso host su tailnet o reti bridge Docker. `..._check_failed` indica che si è verificato un errore durante il rilevamento delle interfacce, pertanto OpenClaw rifiuta l'accesso in caso di errore.

    Verifica quanto segue:

    - Un processo sullo stesso host del Gateway sta inviando direttamente le intestazioni d'identità, ignorando il proxy?
    - Il proxy viene eseguito nello stesso spazio dei nomi di rete del Gateway, con un indirizzo IP che compare anche come interfaccia locale?

    Soluzione: instrada il traffico del proxy tramite un indirizzo che non sia anche associato localmente all'host del Gateway oppure utilizza `allowLoopback` esclusivamente per un'autentica configurazione con proxy sullo stesso host.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    L'intestazione dell'utente era vuota o assente. Verifica quanto segue:

    - Il proxy è configurato per trasmettere le intestazioni d'identità?
    - Il nome dell'intestazione è corretto? Non distingue tra maiuscole e minuscole, ma l'ortografia è importante.
    - L'utente è effettivamente autenticato presso il proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Un'intestazione obbligatoria non era presente. Verifica quanto segue:

    - La configurazione del proxy relativa a tali intestazioni specifiche.
    - Se le intestazioni vengono eliminate in qualche punto della catena.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    L'utente è autenticato, ma non è incluso in `allowUsers`. Aggiungilo oppure rimuovi l'elenco di elementi consentiti.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` è impostato su `"trusted-proxy"`, ma `gateway.trustedProxies` è vuoto oppure manca `gateway.auth.trustedProxy`. Ogni richiesta viene rifiutata finché non vengono impostati entrambi.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    L'autenticazione tramite proxy attendibile è riuscita, ma l'intestazione `Origin` del browser non ha superato i controlli dell'origine dell'interfaccia di controllo.

    Verifica quanto segue:

    - `gateway.controlUi.allowedOrigins` include l'origine esatta del browser.
    - Non fai affidamento su origini con caratteri jolly, a meno che tu non voglia intenzionalmente consentire qualsiasi origine.
    - Se utilizzi intenzionalmente la modalità di ripiego basata sull'intestazione Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` è impostato deliberatamente.

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    Il WebSocket si connette, ma `chat.history`, `sessions.list` o
    `models.list` non riesce e restituisce `missing scope: operator.read`.

    Cause comuni:

    - Sessione dell'interfaccia di controllo senza dispositivo: l'autenticazione tramite proxy attendibile può ammettere la connessione WebSocket senza un'identità del dispositivo, ma OpenClaw elimina deliberatamente gli ambiti dalle sessioni senza dispositivo.
    - Client backend personalizzato: `gateway.controlUi.dangerouslyDisableDeviceAuth` è limitato all'interfaccia di controllo e non concede ambiti a client WebSocket arbitrari di tipo backend o CLI.
    - `x-openclaw-scopes` eccessivamente restrittivo: se il proxy inserisce questa intestazione nella richiesta di aggiornamento WebSocket dell'interfaccia di controllo, gli ambiti della sessione sono limitati a tale insieme. Un valore vuoto dell'intestazione non concede alcun ambito.

    Soluzione:

    - Per l'interfaccia di controllo, utilizza HTTPS affinché il browser possa generare l'identità del dispositivo e completare l'associazione.
    - Per l'automazione personalizzata, utilizza l'identità e l'associazione del dispositivo, il percorso riservato dell'helper backend diretto locale `gateway-client` oppure [RPC HTTP di amministrazione](/it/plugins/admin-http-rpc).
    - Utilizza `gateway.controlUi.dangerouslyDisableDeviceAuth: true` esclusivamente come soluzione temporanea di emergenza per l'interfaccia di controllo.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Assicurati che il proxy:

    - Supporti gli aggiornamenti WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Trasmetta le intestazioni d'identità nelle richieste di aggiornamento WebSocket, non solo in quelle HTTP.
    - Non disponga di un percorso di autenticazione separato per le connessioni WebSocket.

  </Accordion>
</AccordionGroup>

## Migrazione dall'autenticazione tramite token

<Steps>
  <Step title="Configure the proxy">
    Configura il proxy per autenticare gli utenti e trasmettere le intestazioni.
  </Step>
  <Step title="Test the proxy independently">
    Verifica in modo indipendente la configurazione del proxy utilizzando curl con le intestazioni.
  </Step>
  <Step title="Update OpenClaw config">
    Aggiorna la configurazione di OpenClaw con l'autenticazione tramite proxy attendibile.
  </Step>
  <Step title="Restart the Gateway">
    Riavvia il Gateway.
  </Step>
  <Step title="Test WebSocket">
    Verifica le connessioni WebSocket dall'interfaccia di controllo.
  </Step>
  <Step title="Audit">
    Esegui `openclaw security audit` ed esamina i rilevamenti.
  </Step>
</Steps>

## Argomenti correlati

- [Configurazione](/it/gateway/configuration) — riferimento della configurazione
- [Ambiti dell'operatore](/it/gateway/operator-scopes) — ruoli, ambiti e controlli di approvazione
- [Accesso remoto](/it/gateway/remote) — altri modelli di accesso remoto
- [Sicurezza](/it/gateway/security) — guida completa alla sicurezza
- [Tailscale](/it/gateway/tailscale) — alternativa più semplice per l'accesso limitato alla tailnet
