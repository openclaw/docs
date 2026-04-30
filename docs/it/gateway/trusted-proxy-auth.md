---
read_when:
    - Eseguire OpenClaw dietro un proxy con riconoscimento dell'identità
    - Configurare Pomerium, Caddy o nginx con OAuth davanti a OpenClaw
    - Correzione degli errori WebSocket 1008 non autorizzato con configurazioni di proxy inverso
    - Decidere dove impostare HSTS e altri header di hardening HTTP
sidebarTitle: Trusted proxy auth
summary: Delegare l'autenticazione del Gateway a un proxy inverso attendibile (Pomerium, Caddy, nginx + OAuth)
title: Autenticazione proxy attendibile
x-i18n:
    generated_at: "2026-04-30T08:55:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311498b822d2dbf9833c71ec070ab5cee5b4dd2dfb0eeaad1d758eee367a2df3
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Funzionalità sensibile per la sicurezza.** Questa modalità delega interamente l'autenticazione al tuo reverse proxy. Una configurazione errata può esporre il tuo Gateway ad accessi non autorizzati. Leggi attentamente questa pagina prima di abilitarla.
</Warning>

## Quando usarla

Usa la modalità di autenticazione `trusted-proxy` quando:

- Esegui OpenClaw dietro un **proxy consapevole dell'identità** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Il tuo proxy gestisce tutta l'autenticazione e passa l'identità utente tramite header.
- Ti trovi in un ambiente Kubernetes o container in cui il proxy è l'unico percorso verso il Gateway.
- Ricevi errori WebSocket `1008 unauthorized` perché i browser non possono passare token nei payload WS.

## Quando NON usarla

- Se il tuo proxy non autentica gli utenti (solo un terminatore TLS o un bilanciatore di carico).
- Se esiste qualunque percorso verso il Gateway che aggira il proxy (aperture nel firewall, accesso alla rete interna).
- Se non sei sicuro che il tuo proxy rimuova/sovrascriva correttamente gli header inoltrati.
- Se ti serve solo accesso personale per un singolo utente (valuta Tailscale Serve + loopback per una configurazione più semplice).

## Come funziona

<Steps>
  <Step title="Il proxy autentica l'utente">
    Il tuo reverse proxy autentica gli utenti (OAuth, OIDC, SAML, ecc.).
  </Step>
  <Step title="Il proxy aggiunge un header di identità">
    Il proxy aggiunge un header con l'identità utente autenticata (ad es. `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Il Gateway verifica la fonte attendibile">
    OpenClaw verifica che la richiesta provenga da un **IP di proxy attendibile** (configurato in `gateway.trustedProxies`).
  </Step>
  <Step title="Il Gateway estrae l'identità">
    OpenClaw estrae l'identità utente dall'header configurato.
  </Step>
  <Step title="Autorizza">
    Se tutti i controlli sono superati, la richiesta viene autorizzata.
  </Step>
</Steps>

## Comportamento di associazione della Control UI

Quando `gateway.auth.mode = "trusted-proxy"` è attivo e la richiesta supera i controlli trusted-proxy, le sessioni WebSocket della Control UI possono connettersi senza identità di associazione del dispositivo.

Implicazioni:

- L'associazione non è più il gate principale per l'accesso alla Control UI in questa modalità.
- La policy di autenticazione del tuo reverse proxy e `allowUsers` diventano il controllo di accesso effettivo.
- Mantieni l'ingresso del gateway bloccato solo agli IP di proxy attendibili (`gateway.trustedProxies` + firewall).

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
**Regole di runtime importanti**

- L'autenticazione trusted-proxy rifiuta per impostazione predefinita le richieste provenienti da sorgenti loopback (`127.0.0.1`, `::1`, CIDR loopback).
- I reverse proxy loopback sullo stesso host **non** soddisfano l'autenticazione trusted-proxy a meno che tu non imposti esplicitamente `gateway.auth.trustedProxy.allowLoopback = true` e includa l'indirizzo loopback in `gateway.trustedProxies`.
- `allowLoopback` considera attendibili i processi locali sull'host del Gateway allo stesso livello del reverse proxy. Abilitalo solo quando il Gateway è ancora protetto da firewall contro l'accesso remoto diretto e il proxy locale rimuove o sovrascrive gli header di identità forniti dal client.
- I client Gateway interni che non passano attraverso il reverse proxy devono usare `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, non gli header di identità trusted-proxy.
- Le distribuzioni Control UI non loopback richiedono comunque `gateway.controlUi.allowedOrigins` esplicito.
- **L'evidenza degli header inoltrati prevale sulla località loopback per il fallback diretto locale.** Se una richiesta arriva su loopback ma trasporta header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` che indicano un'origine non locale, tale evidenza esclude il fallback locale diretto con password e il gate basato sull'identità del dispositivo. Con `allowLoopback: true`, l'autenticazione trusted-proxy può comunque accettare la richiesta come richiesta proxy sullo stesso host, mentre `requiredHeaders` e `allowUsers` continuano ad applicarsi.

</Warning>

### Riferimento di configurazione

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Array di indirizzi IP di proxy da considerare attendibili. Le richieste da altri IP vengono rifiutate.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Deve essere `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Nome dell'header contenente l'identità utente autenticata.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Header aggiuntivi che devono essere presenti perché la richiesta sia considerata attendibile.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Elenco consentito di identità utente. Vuoto significa consentire tutti gli utenti autenticati.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  Supporto opt-in per reverse proxy loopback sullo stesso host. Il valore predefinito è `false`.
</ParamField>

<Warning>
Abilita `allowLoopback` solo quando il reverse proxy locale è il confine di attendibilità previsto. Qualsiasi processo locale che possa connettersi al Gateway può provare a inviare header di identità proxy, quindi mantieni l'accesso diretto al Gateway privato all'host e richiedi header posseduti dal proxy come `x-forwarded-proto` o un header di asserzione firmato, se il tuo proxy ne supporta uno.
</Warning>

## Terminazione TLS e HSTS

Usa un solo punto di terminazione TLS e applica HSTS lì.

<Tabs>
  <Tab title="Terminazione TLS del proxy (consigliata)">
    Quando il tuo reverse proxy gestisce HTTPS per `https://control.example.com`, imposta `Strict-Transport-Security` sul proxy per quel dominio.

    - Adatta alle distribuzioni esposte a Internet.
    - Mantiene certificato e policy di hardening HTTP in un unico punto.
    - OpenClaw può rimanere su HTTP loopback dietro il proxy.

    Valore di header di esempio:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminazione TLS del Gateway">
    Se OpenClaw serve direttamente HTTPS (senza proxy che termina TLS), imposta:

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

    `strictTransportSecurity` accetta un valore di header stringa, oppure `false` per disabilitarlo esplicitamente.

  </Tab>
</Tabs>

### Linee guida per il rollout

- Inizia prima con un max age breve (ad esempio `max-age=300`) mentre convalidi il traffico.
- Aumenta a valori di lunga durata (ad esempio `max-age=31536000`) solo dopo avere alta fiducia.
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
  <Accordion title="Caddy con OAuth">
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
  <Accordion title="Traefik con forward auth">
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

## Configurazione token mista

OpenClaw rifiuta configurazioni ambigue in cui sia un `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`) sia la modalità `trusted-proxy` sono attivi contemporaneamente. Le configurazioni token miste possono fare sì che le richieste loopback si autentichino silenziosamente sul percorso di autenticazione sbagliato.

Se vedi un errore `mixed_trusted_proxy_token` all'avvio:

- Rimuovi il token condiviso quando usi la modalità trusted-proxy, oppure
- Passa `gateway.auth.mode` a `"token"` se intendi usare l'autenticazione basata su token.

Gli header di identità trusted-proxy loopback continuano a fallire in modo chiuso: i chiamanti sullo stesso host non vengono autenticati silenziosamente come utenti proxy. I chiamanti OpenClaw interni che aggirano il proxy possono invece autenticarsi con `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Il fallback token rimane intenzionalmente non supportato in modalità trusted-proxy.

## Header degli ambiti operatore

L'autenticazione trusted-proxy è una modalità HTTP **portatrice di identità**, quindi i chiamanti possono dichiarare facoltativamente gli ambiti operatore con `x-openclaw-scopes`.

Esempi:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamento:

- Quando l'header è presente, OpenClaw rispetta l'insieme di ambiti dichiarato.
- Quando l'header è presente ma vuoto, la richiesta dichiara **nessun** ambito operatore.
- Quando l'header è assente, le normali API HTTP portatrici di identità ricadono sull'insieme standard di ambiti operatore predefiniti.
- Le **route HTTP dei Plugin** con autenticazione Gateway sono più ristrette per impostazione predefinita: quando `x-openclaw-scopes` è assente, il loro ambito di runtime ricade su `operator.write`.
- Le richieste HTTP da origine browser devono comunque superare `gateway.controlUi.allowedOrigins` (o una modalità deliberata di fallback basata su header Host) anche dopo il successo dell'autenticazione trusted-proxy.

Regola pratica: invia `x-openclaw-scopes` esplicitamente quando vuoi che una richiesta trusted-proxy sia più ristretta dei valori predefiniti, oppure quando una route Plugin con autenticazione gateway richiede qualcosa di più forte dell'ambito di scrittura.

## Checklist di sicurezza

Prima di abilitare l'autenticazione trusted-proxy, verifica:

- [ ] **Il proxy è l'unico percorso**: la porta del Gateway è protetta da firewall da tutto tranne che dal tuo proxy.
- [ ] **trustedProxies è minimo**: solo gli IP effettivi del tuo proxy, non intere sottoreti.
- [ ] **L'origine proxy loopback è deliberata**: l'autenticazione trusted-proxy fallisce in modo chiuso per le richieste con origine loopback, a meno che `gateway.auth.trustedProxy.allowLoopback` non sia abilitato esplicitamente per un proxy sullo stesso host.
- [ ] **Il proxy rimuove gli header**: il tuo proxy sovrascrive (non aggiunge) gli header `x-forwarded-*` dei client.
- [ ] **Terminazione TLS**: il tuo proxy gestisce TLS; gli utenti si connettono tramite HTTPS.
- [ ] **allowedOrigins è esplicito**: la Control UI non loopback usa `gateway.controlUi.allowedOrigins` espliciti.
- [ ] **allowUsers è impostato** (consigliato): limita l'accesso agli utenti noti invece di consentirlo a chiunque sia autenticato.
- [ ] **Nessuna configurazione token mista**: non impostare sia `gateway.auth.token` sia `gateway.auth.mode: "trusted-proxy"`.
- [ ] **Il fallback della password locale è privato**: se configuri `gateway.auth.password` per chiamanti diretti interni, mantieni la porta del Gateway protetta da firewall in modo che i client remoti non proxy non possano raggiungerla direttamente.

## Audit di sicurezza

`openclaw security audit` segnalerà l'autenticazione trusted-proxy con un risultato di gravità **critica**. È intenzionale: è un promemoria del fatto che stai delegando la sicurezza alla configurazione del tuo proxy.

L'audit controlla:

- Avviso/promemoria critico di base `gateway.trusted_proxy_auth`
- Configurazione `trustedProxies` mancante
- Configurazione `userHeader` mancante
- `allowUsers` vuoto (consente qualsiasi utente autenticato)
- `allowLoopback` abilitato per origini proxy sullo stesso host
- Policy dell'origine del browser con wildcard o mancante sulle superfici esposte della Control UI

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    La richiesta non proveniva da un IP in `gateway.trustedProxies`. Controlla:

    - L'IP del proxy è corretto? (Gli IP dei container Docker possono cambiare.)
    - C'è un load balancer davanti al tuo proxy?
    - Usa `docker inspect` o `kubectl get pods -o wide` per trovare gli IP effettivi.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw ha rifiutato una richiesta trusted-proxy con origine loopback.

    Controlla:

    - Il proxy si connette da `127.0.0.1` / `::1`?
    - Stai provando a usare l'autenticazione trusted-proxy con un reverse proxy loopback sullo stesso host?

    Correzione:

    - Preferisci l'autenticazione con token/password per i client interni sullo stesso host che non passano attraverso il proxy, oppure
    - Instrada attraverso un indirizzo proxy attendibile non loopback e mantieni quell'IP in `gateway.trustedProxies`, oppure
    - Per un reverse proxy deliberato sullo stesso host, imposta `gateway.auth.trustedProxy.allowLoopback = true`, mantieni l'indirizzo loopback in `gateway.trustedProxies` e assicurati che il proxy rimuova o sovrascriva gli header di identità.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    L'header utente era vuoto o mancante. Controlla:

    - Il tuo proxy è configurato per passare gli header di identità?
    - Il nome dell'header è corretto? (non fa distinzione tra maiuscole e minuscole, ma l'ortografia conta)
    - L'utente è effettivamente autenticato presso il proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Un header obbligatorio non era presente. Controlla:

    - La configurazione del tuo proxy per quegli header specifici.
    - Se gli header vengono rimossi in qualche punto della catena.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    L'utente è autenticato ma non è in `allowUsers`. Aggiungilo oppure rimuovi l'allowlist.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    L'autenticazione trusted-proxy è riuscita, ma l'header `Origin` del browser non ha superato i controlli dell'origine della Control UI.

    Controlla:

    - `gateway.controlUi.allowedOrigins` include l'origine esatta del browser.
    - Non stai facendo affidamento su origini wildcard, a meno che tu non voglia intenzionalmente un comportamento allow-all.
    - Se usi intenzionalmente la modalità di fallback dell'header Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` è impostato deliberatamente.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Assicurati che il tuo proxy:

    - Supporti gli upgrade WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Passi gli header di identità nelle richieste di upgrade WebSocket (non solo HTTP).
    - Non abbia un percorso di autenticazione separato per le connessioni WebSocket.

  </Accordion>
</AccordionGroup>

## Migrazione dall'autenticazione token

Se stai passando dall'autenticazione token a trusted-proxy:

<Steps>
  <Step title="Configure the proxy">
    Configura il proxy per autenticare gli utenti e passare gli header.
  </Step>
  <Step title="Test the proxy independently">
    Testa la configurazione del proxy in modo indipendente (curl con header).
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

- [Configurazione](/it/gateway/configuration) — riferimento alla configurazione
- [Accesso remoto](/it/gateway/remote) — altri schemi di accesso remoto
- [Sicurezza](/it/gateway/security) — guida completa alla sicurezza
- [Tailscale](/it/gateway/tailscale) — alternativa più semplice per l'accesso solo tramite tailnet
