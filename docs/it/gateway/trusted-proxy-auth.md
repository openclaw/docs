---
read_when:
    - Eseguire OpenClaw dietro un proxy identity-aware
    - Configurazione di Pomerium, Caddy o nginx con OAuth davanti a OpenClaw
    - Correzione degli errori WebSocket 1008 non autorizzato con configurazioni reverse proxy
    - Decidere dove impostare HSTS e altri header di hardening HTTP
summary: Delega l'autenticazione del gateway a un reverse proxy trusted (Pomerium, Caddy, nginx + OAuth)
title: Autenticazione con proxy trusted
x-i18n:
    generated_at: "2026-04-23T08:29:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 649529e9a350d7df3a9ecbbae8871d61e1dff2069dfabf2f86a77a0d96c52778
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Autenticazione con proxy trusted

> ⚠️ **Funzionalità sensibile per la sicurezza.** Questa modalità delega interamente l'autenticazione al tuo reverse proxy. Una configurazione errata può esporre il tuo Gateway ad accessi non autorizzati. Leggi attentamente questa pagina prima di abilitarla.

## Quando usarla

Usa la modalità auth `trusted-proxy` quando:

- Esegui OpenClaw dietro un **proxy identity-aware** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Il tuo proxy gestisce tutta l'autenticazione e passa l'identità utente tramite header
- Ti trovi in un ambiente Kubernetes o container in cui il proxy è l'unico percorso verso il Gateway
- Stai riscontrando errori WebSocket `1008 unauthorized` perché i browser non possono passare token nei payload WS

## Quando NON usarla

- Se il tuo proxy non autentica gli utenti (solo terminazione TLS o load balancer)
- Se esiste un qualsiasi percorso verso il Gateway che bypassa il proxy (buchi nel firewall, accesso di rete interno)
- Se non sei sicuro che il tuo proxy rimuova/sovrascriva correttamente gli header inoltrati
- Se hai bisogno solo di accesso personale per un singolo utente (valuta Tailscale Serve + loopback per una configurazione più semplice)

## Come funziona

1. Il tuo reverse proxy autentica gli utenti (OAuth, OIDC, SAML, ecc.)
2. Il proxy aggiunge un header con l'identità dell'utente autenticato (ad esempio, `x-forwarded-user: nick@example.com`)
3. OpenClaw verifica che la richiesta provenga da un **IP di proxy trusted** (configurato in `gateway.trustedProxies`)
4. OpenClaw estrae l'identità utente dall'header configurato
5. Se tutto è corretto, la richiesta viene autorizzata

## Comportamento di abbinamento della Control UI

Quando `gateway.auth.mode = "trusted-proxy"` è attivo e la richiesta supera i
controlli del proxy trusted, le sessioni WebSocket della Control UI possono connettersi senza identità di device pairing.

Implicazioni:

- L'abbinamento non è più il controllo principale per l'accesso alla Control UI in questa modalità.
- La policy auth del tuo reverse proxy e `allowUsers` diventano il controllo di accesso effettivo.
- Mantieni l'ingresso del gateway bloccato solo agli IP del proxy trusted (`gateway.trustedProxies` + firewall).

## Configurazione

```json5
{
  gateway: {
    // L'auth trusted-proxy si aspetta richieste da una sorgente proxy trusted non-loopback
    bind: "lan",

    // CRITICO: aggiungi qui solo l'IP o gli IP del tuo proxy
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

Regola runtime importante:

- L'auth trusted-proxy rifiuta richieste provenienti da sorgenti loopback (`127.0.0.1`, `::1`, CIDR loopback).
- I reverse proxy loopback sullo stesso host **non** soddisfano l'auth trusted-proxy.
- Per configurazioni proxy loopback sullo stesso host, usa invece l'auth token/password, oppure instrada tramite un indirizzo proxy trusted non-loopback che OpenClaw possa verificare.
- I deployment della Control UI non-loopback richiedono comunque `gateway.controlUi.allowedOrigins` esplicito.
- **L'evidenza degli header inoltrati prevale sulla località loopback.** Se una richiesta arriva su loopback ma include header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` che puntano a un'origine non locale, tale evidenza invalida la località loopback. La richiesta viene trattata come remota per l'abbinamento, l'auth trusted-proxy e il gating dell'identità del device della Control UI. Questo impedisce a un proxy loopback sullo stesso host di far passare l'identità degli header inoltrati come auth trusted-proxy.

### Riferimento della configurazione

| Campo                                       | Obbligatorio | Descrizione                                                                |
| ------------------------------------------- | ------------ | -------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Sì           | Array di indirizzi IP del proxy da considerare trusted. Le richieste da altri IP vengono rifiutate. |
| `gateway.auth.mode`                         | Sì           | Deve essere `"trusted-proxy"`                                              |
| `gateway.auth.trustedProxy.userHeader`      | Sì           | Nome dell'header che contiene l'identità dell'utente autenticato           |
| `gateway.auth.trustedProxy.requiredHeaders` | No           | Header aggiuntivi che devono essere presenti perché la richiesta sia trusted |
| `gateway.auth.trustedProxy.allowUsers`      | No           | Allowlist di identità utente. Vuoto significa consentire tutti gli utenti autenticati. |

## Terminazione TLS e HSTS

Usa un solo punto di terminazione TLS e applica HSTS lì.

### Pattern consigliato: terminazione TLS nel proxy

Quando il tuo reverse proxy gestisce HTTPS per `https://control.example.com`, imposta
`Strict-Transport-Security` nel proxy per quel dominio.

- Adatto ai deployment esposti a Internet.
- Mantiene certificato + policy di hardening HTTP in un unico punto.
- OpenClaw può restare su HTTP loopback dietro il proxy.

Valore header di esempio:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Terminazione TLS nel Gateway

Se OpenClaw serve direttamente HTTPS (senza proxy con terminazione TLS), imposta:

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

### Linee guida per il rollout

- Inizia con un max age breve (per esempio `max-age=300`) mentre convalidi il traffico.
- Aumenta a valori di lunga durata (per esempio `max-age=31536000`) solo quando hai alta fiducia.
- Aggiungi `includeSubDomains` solo se ogni sottodominio è pronto per HTTPS.
- Usa preload solo se soddisfi intenzionalmente i requisiti di preload per l'intero set di domini.
- Lo sviluppo locale solo loopback non trae beneficio da HSTS.

## Esempi di configurazione del proxy

### Pomerium

Pomerium passa l'identità in `x-pomerium-claim-email` (o altri claim header) e un JWT in `x-pomerium-jwt-assertion`.

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

### Caddy con OAuth

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

### nginx + oauth2-proxy

oauth2-proxy autentica gli utenti e passa l'identità in `x-auth-request-email`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP di nginx/oauth2-proxy
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

### Traefik con Forward Auth

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // IP del container Traefik
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## Configurazione token mista

OpenClaw rifiuta configurazioni ambigue in cui sia `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`) sia la modalità `trusted-proxy` sono attivi contemporaneamente. Le configurazioni token miste possono far sì che richieste loopback vengano autenticate silenziosamente sul percorso auth sbagliato.

Se all'avvio vedi un errore `mixed_trusted_proxy_token`:

- Rimuovi il token condiviso quando usi la modalità trusted-proxy, oppure
- Passa `gateway.auth.mode` a `"token"` se intendi usare auth basata su token.

Anche l'auth trusted-proxy loopback fallisce in modalità fail-closed: i chiamanti sullo stesso host devono fornire gli header di identità configurati attraverso un proxy trusted invece di essere autenticati silenziosamente.

## Header degli scope operatore

L'auth trusted-proxy è una modalità HTTP **che trasporta identità**, quindi i chiamanti possono
facoltativamente dichiarare gli scope operatore con `x-openclaw-scopes`.

Esempi:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamento:

- Quando l'header è presente, OpenClaw rispetta l'insieme di scope dichiarato.
- Quando l'header è presente ma vuoto, la richiesta non dichiara **alcuno** scope operatore.
- Quando l'header è assente, le normali API HTTP che trasportano identità usano il fallback all'insieme standard di scope operatore predefinito.
- Le **route HTTP dei plugin** con auth gateway hanno valori predefiniti più ristretti: quando `x-openclaw-scopes` è assente, il loro scope runtime usa il fallback a `operator.write`.
- Le richieste HTTP originate dal browser devono comunque superare `gateway.controlUi.allowedOrigins` (o una modalità di fallback deliberata basata sull'header Host) anche dopo che l'auth trusted-proxy è riuscita.

Regola pratica:

- Invia `x-openclaw-scopes` esplicitamente quando vuoi che una richiesta trusted-proxy
  sia più ristretta dei valori predefiniti, oppure quando una route plugin con auth gateway richiede
  qualcosa di più forte dello scope write.

## Checklist di sicurezza

Prima di abilitare l'auth trusted-proxy, verifica:

- [ ] **Il proxy è l'unico percorso**: la porta del Gateway è protetta dal firewall da tutto tranne che dal tuo proxy
- [ ] **trustedProxies è minimale**: solo gli IP effettivi del tuo proxy, non intere subnet
- [ ] **Nessuna sorgente proxy loopback**: l'auth trusted-proxy fallisce in modalità fail-closed per richieste da sorgenti loopback
- [ ] **Il proxy rimuove gli header**: il tuo proxy sovrascrive (non accoda) gli header `x-forwarded-*` provenienti dai client
- [ ] **Terminazione TLS**: il tuo proxy gestisce TLS; gli utenti si connettono tramite HTTPS
- [ ] **allowedOrigins è esplicito**: la Control UI non-loopback usa `gateway.controlUi.allowedOrigins` esplicito
- [ ] **allowUsers è impostato** (consigliato): limita a utenti noti invece di consentire chiunque sia autenticato
- [ ] **Nessuna configurazione token mista**: non impostare sia `gateway.auth.token` sia `gateway.auth.mode: "trusted-proxy"`

## Audit di sicurezza

`openclaw security audit` segnalerà l'auth trusted-proxy con un rilievo di gravità **critica**. È intenzionale: è un promemoria del fatto che stai delegando la sicurezza alla configurazione del tuo proxy.

L'audit controlla:

- Avviso/promemoria base `gateway.trusted_proxy_auth` warning/critical
- Configurazione `trustedProxies` mancante
- Configurazione `userHeader` mancante
- `allowUsers` vuoto (consente qualsiasi utente autenticato)
- Policy dell'origine browser wildcard o mancante su superfici Control UI esposte

## Risoluzione dei problemi

### `trusted_proxy_untrusted_source`

La richiesta non proviene da un IP in `gateway.trustedProxies`. Controlla:

- L'IP del proxy è corretto? (Gli IP dei container Docker possono cambiare)
- C'è un load balancer davanti al tuo proxy?
- Usa `docker inspect` o `kubectl get pods -o wide` per trovare gli IP reali

### `trusted_proxy_loopback_source`

OpenClaw ha rifiutato una richiesta trusted-proxy da sorgente loopback.

Controlla:

- Il proxy si connette da `127.0.0.1` / `::1`?
- Stai cercando di usare l'auth trusted-proxy con un reverse proxy loopback sullo stesso host?

Correzione:

- Usa l'auth token/password per configurazioni proxy loopback sullo stesso host, oppure
- Instrada tramite un indirizzo proxy trusted non-loopback e mantieni quell'IP in `gateway.trustedProxies`.

### `trusted_proxy_user_missing`

L'header utente era vuoto o mancante. Controlla:

- Il tuo proxy è configurato per passare gli header di identità?
- Il nome dell'header è corretto? (case-insensitive, ma l'ortografia conta)
- L'utente è effettivamente autenticato sul proxy?

### `trusted*proxy_missing_header*\*`

Un header obbligatorio non era presente. Controlla:

- La configurazione del tuo proxy per quegli header specifici
- Se gli header vengono rimossi da qualche punto della catena

### `trusted_proxy_user_not_allowed`

L'utente è autenticato ma non è in `allowUsers`. Aggiungilo oppure rimuovi l'allowlist.

### `trusted_proxy_origin_not_allowed`

L'auth trusted-proxy è riuscita, ma l'header `Origin` del browser non ha superato i controlli di origine della Control UI.

Controlla:

- `gateway.controlUi.allowedOrigins` include l'origine esatta del browser
- Non stai facendo affidamento su origini wildcard a meno che tu non voglia intenzionalmente un comportamento allow-all
- Se usi intenzionalmente la modalità di fallback basata sull'header Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` è impostato in modo deliberato

### Il WebSocket continua a non funzionare

Assicurati che il tuo proxy:

- Supporti gli upgrade WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- Passi gli header di identità nelle richieste di upgrade WebSocket (non solo HTTP)
- Non abbia un percorso auth separato per le connessioni WebSocket

## Migrazione dall'auth token

Se stai passando dall'auth token a trusted-proxy:

1. Configura il tuo proxy per autenticare gli utenti e passare gli header
2. Testa in modo indipendente la configurazione del proxy (`curl` con header)
3. Aggiorna la configurazione di OpenClaw con auth trusted-proxy
4. Riavvia il Gateway
5. Testa le connessioni WebSocket dalla Control UI
6. Esegui `openclaw security audit` e rivedi i risultati

## Correlati

- [Sicurezza](/it/gateway/security) — guida completa alla sicurezza
- [Configurazione](/it/gateway/configuration) — riferimento della configurazione
- [Accesso remoto](/it/gateway/remote) — altri pattern di accesso remoto
- [Tailscale](/it/gateway/tailscale) — alternativa più semplice per accesso solo tailnet
