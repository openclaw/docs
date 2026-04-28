---
read_when:
    - Esecuzione di OpenClaw dietro un proxy identity-aware
    - Configurazione di Pomerium, Caddy o nginx con OAuth davanti a OpenClaw
    - Risoluzione degli errori WebSocket 1008 non autorizzato nelle configurazioni reverse proxy
    - Decidere dove impostare HSTS e altri header di hardening HTTP
sidebarTitle: Trusted proxy auth
summary: Delega l'autenticazione del Gateway a un reverse proxy attendibile (Pomerium, Caddy, nginx + OAuth)
title: Autenticazione tramite proxy attendibile
x-i18n:
    generated_at: "2026-04-26T11:31:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64e0f4dee942aedec548135f0408e7773e7b498f8262af13a4d0eff262cae646
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

<Warning>
**Funzionalità sensibile dal punto di vista della sicurezza.** Questa modalità delega completamente l'autenticazione al tuo reverse proxy. Una configurazione errata può esporre il tuo Gateway ad accessi non autorizzati. Leggi attentamente questa pagina prima di abilitarla.
</Warning>

## Quando usarla

Usa la modalità di autenticazione `trusted-proxy` quando:

- Esegui OpenClaw dietro un **proxy identity-aware** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Il tuo proxy gestisce tutta l'autenticazione e passa l'identità utente tramite header.
- Sei in un ambiente Kubernetes o container in cui il proxy è l'unico percorso verso il Gateway.
- Stai riscontrando errori WebSocket `1008 unauthorized` perché i browser non possono passare token nei payload WS.

## Quando NON usarla

- Se il tuo proxy non autentica gli utenti (è solo un terminatore TLS o un load balancer).
- Se esiste qualunque percorso verso il Gateway che aggira il proxy (buchi nel firewall, accesso dalla rete interna).
- Se non sei sicuro che il tuo proxy rimuova/sovrascriva correttamente gli header forwarded.
- Se ti serve solo accesso personale single-user (valuta Tailscale Serve + loopback per una configurazione più semplice).

## Come funziona

<Steps>
  <Step title="Il proxy autentica l'utente">
    Il tuo reverse proxy autentica gli utenti (OAuth, OIDC, SAML, ecc.).
  </Step>
  <Step title="Il proxy aggiunge un header di identità">
    Il proxy aggiunge un header con l'identità dell'utente autenticato (ad esempio `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Il Gateway verifica la sorgente attendibile">
    OpenClaw controlla che la richiesta provenga da un **IP proxy attendibile** (configurato in `gateway.trustedProxies`).
  </Step>
  <Step title="Il Gateway estrae l'identità">
    OpenClaw estrae l'identità utente dall'header configurato.
  </Step>
  <Step title="Autorizza">
    Se tutto corrisponde, la richiesta viene autorizzata.
  </Step>
</Steps>

## Comportamento di associazione della Control UI

Quando `gateway.auth.mode = "trusted-proxy"` è attivo e la richiesta supera i controlli trusted-proxy, le sessioni WebSocket della Control UI possono connettersi senza identità di pairing del dispositivo.

Implicazioni:

- Il pairing non è più il gate primario per l'accesso alla Control UI in questa modalità.
- La policy di autenticazione del tuo reverse proxy e `allowUsers` diventano il controllo di accesso effettivo.
- Mantieni l'ingresso del gateway bloccato solo sugli IP del proxy attendibile (`gateway.trustedProxies` + firewall).

## Configurazione

```json5
{
  gateway: {
    // L'autenticazione trusted-proxy si aspetta richieste da una sorgente proxy attendibile non loopback
    bind: "lan",

    // CRITICO: aggiungi qui solo gli IP del tuo proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header che contiene l'identità dell'utente autenticato (obbligatorio)
        userHeader: "x-forwarded-user",

        // Facoltativo: header che DEVONO essere presenti (verifica del proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Facoltativo: limita a utenti specifici (vuoto = consenti tutti)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

<Warning>
**Regole runtime importanti**

- L'autenticazione trusted-proxy rifiuta richieste da sorgenti loopback (`127.0.0.1`, `::1`, CIDR loopback).
- I reverse proxy loopback sullo stesso host **non** soddisfano l'autenticazione trusted-proxy.
- Per configurazioni proxy loopback sullo stesso host, usa invece l'autenticazione token/password, oppure instrada attraverso un indirizzo proxy attendibile non loopback che OpenClaw possa verificare.
- Le distribuzioni non loopback della Control UI richiedono comunque `gateway.controlUi.allowedOrigins` esplicito.
- **Le prove dagli header forwarded prevalgono sulla località loopback.** Se una richiesta arriva su loopback ma contiene header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` che puntano a un'origine non locale, tale evidenza invalida l'affermazione di località loopback. La richiesta viene trattata come remota per pairing, autenticazione trusted-proxy e gating dell'identità del dispositivo della Control UI. Questo impedisce a un proxy loopback sullo stesso host di riciclare l'identità da header forwarded nell'autenticazione trusted-proxy.
</Warning>

### Riferimento configurazione

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Array di indirizzi IP proxy di cui fidarsi. Le richieste da altri IP vengono rifiutate.
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

## Terminazione TLS e HSTS

Usa un solo punto di terminazione TLS e applica HSTS lì.

<Tabs>
  <Tab title="Terminazione TLS sul proxy (consigliata)">
    Quando il tuo reverse proxy gestisce HTTPS per `https://control.example.com`, imposta `Strict-Transport-Security` sul proxy per quel dominio.

    - Scelta adatta per distribuzioni esposte a Internet.
    - Mantiene certificato + policy di hardening HTTP in un unico posto.
    - OpenClaw può restare su HTTP loopback dietro il proxy.

    Valore header di esempio:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminazione TLS sul Gateway">
    Se OpenClaw stesso serve direttamente HTTPS (senza proxy che termina TLS), imposta:

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

### Guida al rollout

- Inizia prima con un max age breve (ad esempio `max-age=300`) mentre validi il traffico.
- Aumenta a valori di lunga durata (ad esempio `max-age=31536000`) solo quando il livello di fiducia è alto.
- Aggiungi `includeSubDomains` solo se ogni sottodominio è pronto per HTTPS.
- Usa preload solo se soddisfi intenzionalmente i requisiti di preload per l'intero insieme di domini.
- Lo sviluppo locale solo loopback non beneficia di HSTS.

## Esempi di configurazione proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium passa l'identità in `x-pomerium-claim-email` (o altri header claim) e un JWT in `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP di Pomerium
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

    Snippet di configurazione Pomerium:

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
    Caddy con il plugin `caddy-security` può autenticare gli utenti e passare header di identità.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP del proxy Caddy/sidecar
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    Snippet Caddyfile:

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
        trustedProxies: ["10.0.0.1"], // IP nginx/oauth2-proxy
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-auth-request-email",
          },
        },
      },
    }
    ```

    Snippet di configurazione nginx:

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
        trustedProxies: ["172.17.0.1"], // IP container Traefik
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

OpenClaw rifiuta configurazioni ambigue in cui sia `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`) sia la modalità `trusted-proxy` sono attivi contemporaneamente. Le configurazioni token miste possono fare in modo che le richieste loopback vengano autenticate silenziosamente con il percorso di autenticazione sbagliato.

Se all'avvio vedi un errore `mixed_trusted_proxy_token`:

- Rimuovi il token condiviso quando usi la modalità trusted-proxy, oppure
- Passa `gateway.auth.mode` a `"token"` se intendi usare autenticazione basata su token.

Anche l'autenticazione trusted-proxy loopback fallisce in modalità fail-closed: i chiamanti sullo stesso host devono fornire gli header di identità configurati tramite un proxy attendibile invece di essere autenticati silenziosamente.

## Header degli scope operatore

L'autenticazione trusted-proxy è una modalità HTTP **che trasporta identità**, quindi i chiamanti possono facoltativamente dichiarare gli scope operatore con `x-openclaw-scopes`.

Esempi:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamento:

- Quando l'header è presente, OpenClaw rispetta l'insieme di scope dichiarato.
- Quando l'header è presente ma vuoto, la richiesta dichiara **nessuno** scope operatore.
- Quando l'header è assente, le normali API HTTP che trasportano identità usano come fallback l'insieme predefinito standard degli scope operatore.
- Le **route HTTP Plugin** con autenticazione Gateway sono più ristrette per impostazione predefinita: quando `x-openclaw-scopes` è assente, il loro scope runtime usa come fallback `operator.write`.
- Le richieste HTTP con origine browser devono comunque superare `gateway.controlUi.allowedOrigins` (o la deliberata modalità fallback dell'header Host) anche dopo il successo dell'autenticazione trusted-proxy.

Regola pratica: invia esplicitamente `x-openclaw-scopes` quando vuoi che una richiesta trusted-proxy sia più ristretta dei valori predefiniti, oppure quando una route di Plugin con autenticazione gateway necessita di qualcosa di più forte dello scope write.

## Checklist di sicurezza

Prima di abilitare l'autenticazione trusted-proxy, verifica:

- [ ] **Il proxy è l'unico percorso**: la porta del Gateway è protetta dal firewall verso tutto tranne il tuo proxy.
- [ ] **trustedProxies è minimo**: solo gli IP effettivi del tuo proxy, non intere subnet.
- [ ] **Nessuna sorgente proxy loopback**: l'autenticazione trusted-proxy fallisce in modalità fail-closed per richieste con sorgente loopback.
- [ ] **Il proxy rimuove gli header**: il tuo proxy sovrascrive (non aggiunge in append) gli header `x-forwarded-*` provenienti dai client.
- [ ] **Terminazione TLS**: il tuo proxy gestisce TLS; gli utenti si connettono via HTTPS.
- [ ] **allowedOrigins è esplicito**: la Control UI non loopback usa `gateway.controlUi.allowedOrigins` esplicito.
- [ ] **allowUsers è impostato** (consigliato): limita a utenti noti invece di consentire chiunque sia autenticato.
- [ ] **Nessuna configurazione token mista**: non impostare sia `gateway.auth.token` sia `gateway.auth.mode: "trusted-proxy"`.

## Audit di sicurezza

`openclaw security audit` segnalerà l'autenticazione trusted-proxy con un risultato di gravità **critica**. È intenzionale — è un promemoria che stai delegando la sicurezza alla configurazione del tuo proxy.

L'audit controlla:

- Avviso/richiamo critico di base `gateway.trusted_proxy_auth`
- Configurazione `trustedProxies` mancante
- Configurazione `userHeader` mancante
- `allowUsers` vuoto (consente qualsiasi utente autenticato)
- Policy di origine browser wildcard o mancante su superfici Control UI esposte

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    La richiesta non proveniva da un IP presente in `gateway.trustedProxies`. Controlla:

    - L'IP del proxy è corretto? (Gli IP dei container Docker possono cambiare.)
    - C'è un load balancer davanti al tuo proxy?
    - Usa `docker inspect` o `kubectl get pods -o wide` per trovare gli IP effettivi.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw ha rifiutato una richiesta trusted-proxy con sorgente loopback.

    Controlla:

    - Il proxy si sta connettendo da `127.0.0.1` / `::1`?
    - Stai cercando di usare l'autenticazione trusted-proxy con un reverse proxy loopback sullo stesso host?

    Correzione:

    - Usa l'autenticazione token/password per configurazioni proxy loopback sullo stesso host, oppure
    - Instrada attraverso un indirizzo proxy attendibile non loopback e mantieni quell'IP in `gateway.trustedProxies`.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    L'header utente era vuoto o mancante. Controlla:

    - Il tuo proxy è configurato per passare gli header di identità?
    - Il nome dell'header è corretto? (Non distingue tra maiuscole e minuscole, ma l'ortografia conta)
    - L'utente è davvero autenticato sul proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Un header obbligatorio non era presente. Controlla:

    - La configurazione del tuo proxy per quegli header specifici.
    - Se gli header vengono rimossi da qualche parte lungo la catena.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    L'utente è autenticato ma non è presente in `allowUsers`. Aggiungilo oppure rimuovi la allowlist.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    L'autenticazione trusted-proxy è riuscita, ma l'header browser `Origin` non ha superato i controlli di origine della Control UI.

    Controlla:

    - `gateway.controlUi.allowedOrigins` include l'origine browser esatta.
    - Non stai facendo affidamento su origini wildcard a meno che tu non voglia intenzionalmente un comportamento allow-all.
    - Se usi intenzionalmente la modalità fallback dell'header Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` è impostato deliberatamente.

  </Accordion>
  <Accordion title="WebSocket ancora non funziona">
    Assicurati che il tuo proxy:

    - Supporti gli upgrade WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Passi gli header di identità sulle richieste di upgrade WebSocket (non solo su HTTP).
    - Non abbia un percorso di autenticazione separato per le connessioni WebSocket.

  </Accordion>
</AccordionGroup>

## Migrazione dall'autenticazione token

Se stai passando dall'autenticazione token a trusted-proxy:

<Steps>
  <Step title="Configura il proxy">
    Configura il tuo proxy per autenticare gli utenti e passare gli header.
  </Step>
  <Step title="Testa il proxy in modo indipendente">
    Testa in modo indipendente la configurazione del proxy (curl con header).
  </Step>
  <Step title="Aggiorna la configurazione OpenClaw">
    Aggiorna la configurazione OpenClaw con l'autenticazione trusted-proxy.
  </Step>
  <Step title="Riavvia il Gateway">
    Riavvia il Gateway.
  </Step>
  <Step title="Testa WebSocket">
    Testa le connessioni WebSocket dalla Control UI.
  </Step>
  <Step title="Audit">
    Esegui `openclaw security audit` e rivedi i risultati.
  </Step>
</Steps>

## Correlati

- [Configurazione](/it/gateway/configuration) — riferimento configurazione
- [Accesso remoto](/it/gateway/remote) — altri schemi di accesso remoto
- [Sicurezza](/it/gateway/security) — guida completa alla sicurezza
- [Tailscale](/it/gateway/tailscale) — alternativa più semplice per accesso solo tailnet
