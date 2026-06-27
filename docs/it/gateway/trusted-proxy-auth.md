---
read_when:
    - Eseguire OpenClaw dietro un proxy con riconoscimento dell’identità
    - Configurare Pomerium, Caddy o nginx con OAuth davanti a OpenClaw
    - Correzione degli errori WebSocket 1008 non autorizzato con configurazioni reverse proxy
    - Decidere dove impostare HSTS e altri header di rafforzamento HTTP
sidebarTitle: Trusted proxy auth
summary: Delega l'autenticazione del gateway a un reverse proxy attendibile (Pomerium, Caddy, nginx + OAuth)
title: Autenticazione proxy attendibile
x-i18n:
    generated_at: "2026-06-27T17:36:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 498a8aca666f88201302af3895b11ba43ab9c0b1bff00a262145fc9e21e80fa7
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Funzionalità sensibile per la sicurezza.** Questa modalità delega interamente l'autenticazione al tuo reverse proxy. Una configurazione errata può esporre il Gateway ad accessi non autorizzati. Leggi attentamente questa pagina prima di abilitarla.
</Warning>

## Quando usarla

Usa la modalità di autenticazione `trusted-proxy` quando:

- Esegui OpenClaw dietro un **proxy consapevole dell'identità** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Il tuo proxy gestisce tutta l'autenticazione e passa l'identità utente tramite header.
- Sei in un ambiente Kubernetes o container in cui il proxy è l'unico percorso verso il Gateway.
- Riscontri errori WebSocket `1008 unauthorized` perché i browser non possono passare token nei payload WS.

## Quando NON usarla

- Se il tuo proxy non autentica gli utenti (solo un terminatore TLS o un load balancer).
- Se esiste un percorso verso il Gateway che aggira il proxy (buchi nel firewall, accesso alla rete interna).
- Se non sei sicuro che il tuo proxy rimuova/sovrascriva correttamente gli header inoltrati.
- Se ti serve solo accesso personale per un singolo utente (considera Tailscale Serve + loopback per una configurazione più semplice).

## Come funziona

<Steps>
  <Step title="Proxy authenticates the user">
    Il tuo reverse proxy autentica gli utenti (OAuth, OIDC, SAML, ecc.).
  </Step>
  <Step title="Proxy adds an identity header">
    Il proxy aggiunge un header con l'identità dell'utente autenticato (ad esempio, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway verifies trusted source">
    OpenClaw verifica che la richiesta provenga da un **IP proxy attendibile** (configurato in `gateway.trustedProxies`).
  </Step>
  <Step title="Gateway extracts identity">
    OpenClaw estrae l'identità utente dall'header configurato.
  </Step>
  <Step title="Authorize">
    Se tutti i controlli vanno a buon fine, la richiesta viene autorizzata.
  </Step>
</Steps>

## Comportamento di associazione della Control UI

Quando `gateway.auth.mode = "trusted-proxy"` è attivo e la richiesta supera i controlli trusted-proxy, le sessioni WebSocket della Control UI possono connettersi senza identità di associazione del dispositivo.

Implicazioni dell'ambito:

- Le sessioni WebSocket della Control UI senza dispositivo si connettono ma, per impostazione predefinita, non ricevono ambiti operatore. OpenClaw azzera l'elenco degli ambiti richiesti a `[]`, così una sessione non vincolata a un dispositivo/token associato e approvato non può autodichiarare autorizzazioni.
- Se i metodi non riescono con `missing scope` dopo una connessione WebSocket riuscita, usa HTTPS così il browser può generare l'identità del dispositivo e completare l'associazione. Vedi [HTTP non sicuro della Control UI](/it/web/control-ui#insecure-http).
- Solo per emergenza: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` conserva gli ambiti richiesti anche senza identità del dispositivo. Questo è un grave downgrade di sicurezza; ripristinalo rapidamente. Vedi [HTTP non sicuro della Control UI](/it/web/control-ui#insecure-http).

Limitazione degli ambiti tramite reverse proxy:

- Se il tuo proxy invia `x-openclaw-scopes` nella richiesta di upgrade WebSocket della Control UI, OpenClaw limita gli ambiti della sessione all'intersezione tra gli ambiti richiesti e quelli dichiarati. Questo header non concede ambiti; restringe soltanto ciò che la sessione può detenere.

Implicazioni:

- In questa modalità, l'associazione non è più il gate principale per l'accesso alla Control UI.
- La policy di autenticazione del tuo reverse proxy e `allowUsers` diventano il controllo di accesso effettivo.
- Mantieni l'ingresso del Gateway bloccato solo agli IP proxy attendibili (`gateway.trustedProxies` + firewall).

I client WebSocket personalizzati non sono sessioni della Control UI. `gateway.controlUi.dangerouslyDisableDeviceAuth` non concede ambiti a client arbitrari `client.mode: "backend"` o con forma CLI. Le automazioni personalizzate devono usare identità/associazione del dispositivo, il percorso helper backend direct-local riservato `client.id: "gateway-client"`, oppure il [Plugin admin HTTP RPC](/it/plugins/admin-http-rpc) quando una superficie richiesta/risposta HTTP è più adatta.

## Configurazione

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source by default
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
**Regole runtime importanti**

- L'autenticazione trusted-proxy rifiuta per impostazione predefinita le richieste con origine loopback (`127.0.0.1`, `::1`, CIDR loopback).
- I reverse proxy loopback sullo stesso host **non** soddisfano l'autenticazione trusted-proxy, a meno che tu non imposti esplicitamente `gateway.auth.trustedProxy.allowLoopback = true` e includa l'indirizzo loopback in `gateway.trustedProxies`.
- `allowLoopback` considera attendibili i processi locali sull'host del Gateway allo stesso livello del reverse proxy. Abilitalo solo quando il Gateway è ancora protetto da firewall contro accessi remoti diretti e il proxy locale rimuove o sovrascrive gli header di identità forniti dal client.
- I client Gateway interni che non passano attraverso il reverse proxy devono usare `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, non gli header di identità trusted-proxy.
- Le distribuzioni della Control UI non loopback richiedono comunque `gateway.controlUi.allowedOrigins` esplicito.
- **Le prove degli header inoltrati hanno la precedenza sulla località loopback per il fallback diretto locale.** Se una richiesta arriva su loopback ma contiene prove negli header `Forwarded`, qualunque `X-Forwarded-*` o `X-Real-IP`, tali prove escludono il fallback password local-direct e il gate basato sull'identità del dispositivo. Con `allowLoopback: true`, l'autenticazione trusted-proxy può comunque accettare la richiesta come richiesta proxy sullo stesso host, mentre `requiredHeaders` e `allowUsers` continuano ad applicarsi.

</Warning>

### Riferimento di configurazione

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Array di indirizzi IP proxy da considerare attendibili. Le richieste da altri IP vengono rifiutate.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Deve essere `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Nome dell'header che contiene l'identità dell'utente autenticato.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Header aggiuntivi che devono essere presenti affinché la richiesta sia considerata attendibile.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Allowlist delle identità utente. Vuoto significa consentire tutti gli utenti autenticati.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  Supporto opt-in per reverse proxy loopback sullo stesso host. Il valore predefinito è `false`.
</ParamField>

<Warning>
Abilita `allowLoopback` solo quando il reverse proxy locale è il confine di attendibilità previsto. Qualsiasi processo locale che può connettersi al Gateway può provare a inviare header di identità proxy, quindi mantieni l'accesso diretto al Gateway privato all'host e richiedi header di proprietà del proxy, come `x-forwarded-proto`, oppure un header di asserzione firmato dove il tuo proxy ne supporta uno.
</Warning>

## Terminazione TLS e HSTS

Usa un unico punto di terminazione TLS e applica HSTS lì.

<Tabs>
  <Tab title="Proxy TLS termination (recommended)">
    Quando il tuo reverse proxy gestisce HTTPS per `https://control.example.com`, imposta `Strict-Transport-Security` sul proxy per quel dominio.

    - Adatto per distribuzioni esposte a internet.
    - Mantiene la policy di certificati e hardening HTTP in un solo punto.
    - OpenClaw può restare su HTTP loopback dietro il proxy.

    Valore di header di esempio:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS termination">
    Se OpenClaw serve direttamente HTTPS (senza un proxy che termina TLS), imposta:

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

    `strictTransportSecurity` accetta un valore header stringa oppure `false` per disabilitarlo esplicitamente.

  </Tab>
</Tabs>

### Indicazioni di rollout

- Inizia prima con una durata massima breve (ad esempio `max-age=300`) durante la convalida del traffico.
- Aumenta a valori di lunga durata (ad esempio `max-age=31536000`) solo dopo aver raggiunto un'elevata fiducia.
- Aggiungi `includeSubDomains` solo se ogni sottodominio è pronto per HTTPS.
- Usa preload solo se soddisfi intenzionalmente i requisiti di preload per l'intero insieme di domini.
- Lo sviluppo locale solo loopback non beneficia di HSTS.

## Esempi di configurazione del proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium passa l'identità in `x-pomerium-claim-email` (o altri header claim) e un JWT in `x-pomerium-jwt-assertion`.

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

    Frammento di configurazione Pomerium:

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
    Caddy con il Plugin `caddy-security` può autenticare gli utenti e passare header di identità.

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

    ```
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
    oauth2-proxy autentica gli utenti e passa l'identità in `x-auth-request-email`.

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

OpenClaw rifiuta configurazioni ambigue in cui sia un `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`) sia la modalità `trusted-proxy` sono attivi contemporaneamente. Le configurazioni miste dei token possono far sì che le richieste loopback vengano autenticate silenziosamente sul percorso di autenticazione sbagliato.

Se visualizzi un errore `mixed_trusted_proxy_token` all'avvio:

- Rimuovi il token condiviso quando usi la modalità trusted-proxy, oppure
- Passa `gateway.auth.mode` a `"token"` se intendi usare autenticazione basata su token.

Le intestazioni di identità trusted-proxy di loopback continuano a fallire in modo chiuso: i chiamanti sullo stesso host non vengono autenticati silenziosamente come utenti del proxy. I chiamanti interni di OpenClaw che aggirano il proxy possono invece autenticarsi con `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Il fallback tramite token rimane intenzionalmente non supportato in modalità trusted-proxy.

## Intestazione degli ambiti operatore

L'autenticazione trusted-proxy è una modalità HTTP **portatrice di identità**, quindi i chiamanti possono facoltativamente dichiarare gli ambiti operatore con `x-openclaw-scopes` nelle richieste API HTTP.

Nota: gli ambiti WebSocket sono determinati dall'handshake del protocollo Gateway e dal binding dell'identità del dispositivo. Nelle richieste di upgrade WebSocket della Control UI, `x-openclaw-scopes` è solo un limite massimo sugli ambiti di sessione negoziati, non una concessione. Per il comportamento degli ambiti WebSocket con trusted-proxy, consulta [comportamento di associazione della Control UI](#control-ui-pairing-behavior).

Esempi:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamento:

- Quando l'intestazione è presente, OpenClaw rispetta l'insieme di ambiti dichiarato.
- Quando l'intestazione è presente ma vuota, la richiesta dichiara **nessun** ambito operatore.
- Quando l'intestazione è assente, le normali API HTTP portatrici di identità ricadono sull'insieme standard di ambiti operatore predefiniti.
- Le **route HTTP dei Plugin** con autenticazione Gateway sono più ristrette per impostazione predefinita: quando `x-openclaw-scopes` è assente, il loro ambito runtime ricade su `operator.write`.
- Le richieste HTTP di origine browser devono comunque superare `gateway.controlUi.allowedOrigins` (o la modalità deliberata di fallback dell'intestazione Host) anche dopo il successo dell'autenticazione trusted-proxy.
- Per le sessioni WebSocket della Control UI, `x-openclaw-scopes` è un limite massimo degli ambiti quando è presente nella richiesta di upgrade. Un valore vuoto non produce alcun ambito.

Regola pratica: invia `x-openclaw-scopes` esplicitamente quando vuoi che una richiesta trusted-proxy sia più ristretta dei valori predefiniti, oppure quando una route di Plugin con autenticazione Gateway richiede qualcosa di più forte dell'ambito di scrittura.

## Checklist di sicurezza

Prima di abilitare l'autenticazione trusted-proxy, verifica:

- [ ] **Il proxy è l'unico percorso**: la porta del Gateway è protetta da firewall da tutto tranne che dal tuo proxy.
- [ ] **trustedProxies è minimale**: solo gli IP reali del tuo proxy, non intere sottoreti.
- [ ] **La sorgente proxy loopback è deliberata**: l'autenticazione trusted-proxy fallisce in modo chiuso per le richieste con sorgente loopback, a meno che `gateway.auth.trustedProxy.allowLoopback` non sia abilitato esplicitamente per un proxy sullo stesso host.
- [ ] **Il proxy rimuove le intestazioni**: il tuo proxy sovrascrive (non accoda) le intestazioni `x-forwarded-*` provenienti dai client.
- [ ] **Terminazione TLS**: il tuo proxy gestisce TLS; gli utenti si connettono tramite HTTPS.
- [ ] **allowedOrigins è esplicito**: la Control UI non loopback usa `gateway.controlUi.allowedOrigins` espliciti.
- [ ] **allowUsers è impostato** (consigliato): limita agli utenti noti invece di consentire chiunque sia autenticato.
- [ ] **Nessuna configurazione token mista**: non impostare contemporaneamente `gateway.auth.token` e `gateway.auth.mode: "trusted-proxy"`.
- [ ] **Il fallback con password locale è privato**: se configuri `gateway.auth.password` per chiamanti diretti interni, mantieni la porta del Gateway protetta da firewall in modo che i client remoti non proxy non possano raggiungerla direttamente.

## Audit di sicurezza

`openclaw security audit` segnalerà l'autenticazione trusted-proxy con una rilevanza **critica**. È intenzionale: è un promemoria del fatto che stai delegando la sicurezza alla configurazione del tuo proxy.

L'audit controlla:

- Avviso/promemoria critico di base `gateway.trusted_proxy_auth`
- Configurazione `trustedProxies` mancante
- Configurazione `userHeader` mancante
- `allowUsers` vuoto (consente qualsiasi utente autenticato)
- `allowLoopback` abilitato per sorgenti proxy sullo stesso host
- Criterio di origine browser con wildcard o mancante sulle superfici esposte della Control UI

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    La richiesta non proveniva da un IP in `gateway.trustedProxies`. Controlla:

    - L'IP del proxy è corretto? (Gli IP dei container Docker possono cambiare.)
    - C'è un load balancer davanti al tuo proxy?
    - Usa `docker inspect` o `kubectl get pods -o wide` per trovare gli IP effettivi.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw ha rifiutato una richiesta trusted-proxy con sorgente loopback.

    Controlla:

    - Il proxy si connette da `127.0.0.1` / `::1`?
    - Stai tentando di usare l'autenticazione trusted-proxy con un reverse proxy loopback sullo stesso host?

    Correzione:

    - Preferisci l'autenticazione token/password per i client interni sullo stesso host che non passano attraverso il proxy, oppure
    - instrada attraverso un indirizzo proxy attendibile non loopback e mantieni quell'IP in `gateway.trustedProxies`, oppure
    - per un reverse proxy deliberato sullo stesso host, imposta `gateway.auth.trustedProxy.allowLoopback = true`, mantieni l'indirizzo loopback in `gateway.trustedProxies` e assicurati che il proxy rimuova o sovrascriva le intestazioni di identità.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    L'intestazione utente era vuota o mancante. Controlla:

    - Il tuo proxy è configurato per passare le intestazioni di identità?
    - Il nome dell'intestazione è corretto? (non fa distinzione tra maiuscole e minuscole, ma l'ortografia conta)
    - L'utente è effettivamente autenticato presso il proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Un'intestazione obbligatoria non era presente. Controlla:

    - La configurazione del tuo proxy per quelle intestazioni specifiche.
    - Se le intestazioni vengono rimosse da qualche parte nella catena.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    L'utente è autenticato ma non è in `allowUsers`. Aggiungilo oppure rimuovi l'allowlist.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    L'autenticazione trusted-proxy è riuscita, ma l'intestazione browser `Origin` non ha superato i controlli di origine della Control UI.

    Controlla:

    - `gateway.controlUi.allowedOrigins` include l'origine browser esatta.
    - Non ti stai affidando a origini wildcard a meno che tu non voglia intenzionalmente un comportamento che consenta tutto.
    - Se usi intenzionalmente la modalità di fallback dell'intestazione Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` è impostato deliberatamente.

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    Il WebSocket si connette, ma `chat.history`, `sessions.list` o
    `models.list` fallisce con `missing scope: operator.read`.

    Cause comuni:

    - Sessione Control UI senza dispositivo: l'autenticazione trusted-proxy può ammettere la connessione WebSocket senza identità del dispositivo, ma OpenClaw cancella gli ambiti sulle sessioni senza dispositivo per progettazione.
    - Client backend personalizzato: `gateway.controlUi.dangerouslyDisableDeviceAuth` è limitato alla Control UI e non concede ambiti a client WebSocket backend arbitrari o con forma da CLI.
    - `x-openclaw-scopes` troppo ristretto: se il tuo proxy inietta questa intestazione nella richiesta di upgrade WebSocket della Control UI, gli ambiti di sessione sono limitati a quell'insieme. Un valore di intestazione vuoto non produce alcun ambito.

    Correzione:

    - Per la Control UI, usa HTTPS in modo che il browser possa generare l'identità del dispositivo e completare l'associazione.
    - Per automazioni personalizzate, usa identità/associazione del dispositivo, il percorso helper backend diretto-locale riservato `gateway-client` oppure [RPC HTTP admin](/it/plugins/admin-http-rpc).
    - Usa `gateway.controlUi.dangerouslyDisableDeviceAuth: true` solo come percorso temporaneo di emergenza per la Control UI.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Assicurati che il tuo proxy:

    - Supporti gli upgrade WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Passi le intestazioni di identità nelle richieste di upgrade WebSocket (non solo HTTP).
    - Non abbia un percorso di autenticazione separato per le connessioni WebSocket.

  </Accordion>
</AccordionGroup>

## Migrazione dall'autenticazione token

Se stai passando dall'autenticazione token a trusted-proxy:

<Steps>
  <Step title="Configure the proxy">
    Configura il tuo proxy per autenticare gli utenti e passare le intestazioni.
  </Step>
  <Step title="Test the proxy independently">
    Testa la configurazione del proxy in modo indipendente (curl con intestazioni).
  </Step>
  <Step title="Update OpenClaw config">
    Aggiorna la configurazione di OpenClaw con l'autenticazione trusted-proxy.
  </Step>
  <Step title="Restart the Gateway">
    Riavvia il Gateway.
  </Step>
  <Step title="Test WebSocket">
    Testa le connessioni WebSocket dalla Control UI.
  </Step>
  <Step title="Audit">
    Esegui `openclaw security audit` e rivedi i risultati.
  </Step>
</Steps>

## Correlati

- [Configurazione](/it/gateway/configuration) — riferimento della configurazione
- [Accesso remoto](/it/gateway/remote) — altri pattern di accesso remoto
- [Sicurezza](/it/gateway/security) — guida completa alla sicurezza
- [Tailscale](/it/gateway/tailscale) — alternativa più semplice per l'accesso solo tailnet
