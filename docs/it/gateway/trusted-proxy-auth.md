---
read_when:
    - Esecuzione di OpenClaw dietro un proxy con riconoscimento dell'identità
    - Configurazione di Pomerium, Caddy o nginx con OAuth davanti a OpenClaw
    - Correzione degli errori WebSocket 1008 unauthorized con configurazioni reverse proxy
    - Decisione su dove impostare HSTS e altri header di hardening HTTP
summary: Delega l'autenticazione del gateway a un reverse proxy attendibile (Pomerium, Caddy, nginx + OAuth)
title: Autenticazione Trusted Proxy
x-i18n:
    generated_at: "2026-04-05T13:54:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccd39736b43e8744de31566d5597b3fbf40ecb6ba9c8ba9d2343e1ab9bb8cd45
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Autenticazione Trusted Proxy

> ⚠️ **Funzionalità sensibile dal punto di vista della sicurezza.** Questa modalità delega completamente l'autenticazione al tuo reverse proxy. Una configurazione errata può esporre il tuo Gateway ad accessi non autorizzati. Leggi attentamente questa pagina prima di abilitarla.

## Quando usarla

Usa la modalità auth `trusted-proxy` quando:

- Esegui OpenClaw dietro un **proxy con riconoscimento dell'identità** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Il tuo proxy gestisce tutta l'autenticazione e passa l'identità utente tramite header
- Sei in un ambiente Kubernetes o container dove il proxy è l'unico percorso verso il Gateway
- Stai riscontrando errori WebSocket `1008 unauthorized` perché i browser non possono passare token nel payload WS

## Quando NON usarla

- Se il tuo proxy non autentica gli utenti (è solo un terminatore TLS o un load balancer)
- Se esiste qualsiasi percorso verso il Gateway che aggira il proxy (buchi nel firewall, accesso dalla rete interna)
- Se non sei sicuro che il tuo proxy rimuova/sovrascriva correttamente gli header inoltrati
- Se hai bisogno solo di accesso personale per un singolo utente (considera Tailscale Serve + loopback per una configurazione più semplice)

## Come funziona

1. Il tuo reverse proxy autentica gli utenti (OAuth, OIDC, SAML, ecc.)
2. Il proxy aggiunge un header con l'identità utente autenticata (ad esempio `x-forwarded-user: nick@example.com`)
3. OpenClaw controlla che la richiesta provenga da un **IP proxy attendibile** (configurato in `gateway.trustedProxies`)
4. OpenClaw estrae l'identità utente dall'header configurato
5. Se tutto è corretto, la richiesta viene autorizzata

## Comportamento dell'associazione della UI di controllo

Quando `gateway.auth.mode = "trusted-proxy"` è attivo e la richiesta supera i controlli
trusted-proxy, le sessioni WebSocket della UI di controllo possono connettersi senza
identità di associazione del dispositivo.

Implicazioni:

- In questa modalità, l'associazione non è più il controllo principale per l'accesso alla UI di controllo.
- La policy di autenticazione del tuo reverse proxy e `allowUsers` diventano il controllo di accesso effettivo.
- Mantieni l'ingress del gateway bloccato solo agli IP del proxy attendibile (`gateway.trustedProxies` + firewall).

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
        // Header che contiene l'identità utente autenticata (obbligatorio)
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

- L'autenticazione trusted-proxy rifiuta le richieste provenienti da sorgenti loopback (`127.0.0.1`, `::1`, CIDR loopback).
- I reverse proxy loopback sullo stesso host **non** soddisfano l'autenticazione trusted-proxy.
- Per configurazioni proxy loopback sullo stesso host, usa invece l'autenticazione con token/password oppure instrada tramite un indirizzo proxy attendibile non loopback che OpenClaw può verificare.
- Le distribuzioni della UI di controllo non loopback richiedono comunque `gateway.controlUi.allowedOrigins` esplicito.

### Riferimento della configurazione

| Campo                                       | Obbligatorio | Descrizione                                                                |
| ------------------------------------------- | ------------ | -------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Sì           | Array di indirizzi IP del proxy da considerare attendibili. Le richieste da altri IP vengono rifiutate. |
| `gateway.auth.mode`                         | Sì           | Deve essere `"trusted-proxy"`                                              |
| `gateway.auth.trustedProxy.userHeader`      | Sì           | Nome dell'header che contiene l'identità utente autenticata                |
| `gateway.auth.trustedProxy.requiredHeaders` | No           | Header aggiuntivi che devono essere presenti perché la richiesta sia considerata attendibile |
| `gateway.auth.trustedProxy.allowUsers`      | No           | Allowlist delle identità utente. Vuoto significa consentire tutti gli utenti autenticati. |

## Terminazione TLS e HSTS

Usa un solo punto di terminazione TLS e applica HSTS lì.

### Pattern consigliato: terminazione TLS sul proxy

Quando il tuo reverse proxy gestisce HTTPS per `https://control.example.com`, imposta
`Strict-Transport-Security` sul proxy per quel dominio.

- È adatto alle distribuzioni esposte su internet.
- Mantiene certificati + policy di hardening HTTP in un unico punto.
- OpenClaw può restare su HTTP loopback dietro il proxy.

Valore di header di esempio:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Terminazione TLS sul Gateway

Se OpenClaw stesso serve HTTPS direttamente (senza proxy che termina TLS), imposta:

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

`strictTransportSecurity` accetta un valore stringa dell'header, oppure `false` per disabilitarlo esplicitamente.

### Indicazioni per il rollout

- Inizia prima con un max age breve (ad esempio `max-age=300`) mentre convalidi il traffico.
- Passa a valori a lunga durata (ad esempio `max-age=31536000`) solo quando la confidenza è alta.
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

## Configurazione mista con token

OpenClaw rifiuta configurazioni ambigue in cui sia `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`) sia la modalità `trusted-proxy` sono attivi contemporaneamente. Le configurazioni miste con token possono far sì che le richieste loopback si autentichino silenziosamente sul percorso auth sbagliato.

Se all'avvio vedi un errore `mixed_trusted_proxy_token`:

- Rimuovi il token condiviso quando usi la modalità trusted-proxy, oppure
- Passa `gateway.auth.mode` a `"token"` se intendi usare l'autenticazione basata su token.

Anche l'autenticazione trusted-proxy loopback fallisce in modalità chiusa: i chiamanti sullo stesso host devono fornire gli header di identità configurati tramite un proxy attendibile invece di essere autenticati silenziosamente.

## Header degli ambiti operatore

L'autenticazione trusted-proxy è una modalità HTTP **che trasporta identità**, quindi i chiamanti possono
facoltativamente dichiarare ambiti operatore con `x-openclaw-scopes`.

Esempi:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamento:

- Quando l'header è presente, OpenClaw rispetta l'insieme di ambiti dichiarato.
- Quando l'header è presente ma vuoto, la richiesta dichiara **nessun** ambito operatore.
- Quando l'header è assente, le normali API HTTP che trasportano identità ricadono nell'insieme standard di ambiti operatore predefiniti.
- Le **route HTTP dei plugin** con autenticazione gateway sono più ristrette per impostazione predefinita: quando `x-openclaw-scopes` è assente, il loro ambito runtime ricade su `operator.write`.
- Le richieste HTTP provenienti dal browser devono comunque superare `gateway.controlUi.allowedOrigins` (o la modalità deliberata di fallback dell'header Host) anche dopo il successo dell'autenticazione trusted-proxy.

Regola pratica:

- Invia `x-openclaw-scopes` esplicitamente quando vuoi che una richiesta trusted-proxy sia
  più restrittiva dei valori predefiniti, oppure quando una route di plugin autenticata dal gateway richiede
  qualcosa di più forte dell'ambito write.

## Checklist di sicurezza

Prima di abilitare l'autenticazione trusted-proxy, verifica:

- [ ] **Il proxy è l'unico percorso**: la porta del Gateway è protetta dal firewall da tutto tranne che dal tuo proxy
- [ ] **trustedProxies è minimale**: solo gli IP effettivi del tuo proxy, non intere subnet
- [ ] **Nessuna sorgente proxy loopback**: l'autenticazione trusted-proxy fallisce in modalità chiusa per le richieste da sorgenti loopback
- [ ] **Il proxy rimuove gli header**: il tuo proxy sovrascrive (non aggiunge in coda) gli header `x-forwarded-*` provenienti dai client
- [ ] **Terminazione TLS**: il tuo proxy gestisce TLS; gli utenti si connettono via HTTPS
- [ ] **allowedOrigins è esplicito**: la UI di controllo non loopback usa `gateway.controlUi.allowedOrigins` esplicito
- [ ] **allowUsers è impostato** (consigliato): limita agli utenti conosciuti invece di consentire a chiunque sia autenticato
- [ ] **Nessuna configurazione mista con token**: non impostare sia `gateway.auth.token` sia `gateway.auth.mode: "trusted-proxy"`

## Audit di sicurezza

`openclaw security audit` segnalerà l'autenticazione trusted-proxy con un rilevamento di severità **critica**. È intenzionale: è un promemoria del fatto che stai delegando la sicurezza alla configurazione del tuo proxy.

L'audit controlla:

- Avviso/promemoria critico di base `gateway.trusted_proxy_auth`
- Configurazione `trustedProxies` mancante
- Configurazione `userHeader` mancante
- `allowUsers` vuoto (consente qualsiasi utente autenticato)
- Policy origine browser wildcard o mancante sulle superfici UI di controllo esposte

## Risoluzione dei problemi

### "trusted_proxy_untrusted_source"

La richiesta non proviene da un IP in `gateway.trustedProxies`. Controlla:

- L'IP del proxy è corretto? (Gli IP dei container Docker possono cambiare)
- C'è un load balancer davanti al tuo proxy?
- Usa `docker inspect` o `kubectl get pods -o wide` per trovare gli IP reali

### "trusted_proxy_loopback_source"

OpenClaw ha rifiutato una richiesta trusted-proxy da sorgente loopback.

Controlla:

- Il proxy si connette da `127.0.0.1` / `::1`?
- Stai cercando di usare l'autenticazione trusted-proxy con un reverse proxy loopback sullo stesso host?

Correzione:

- Usa l'autenticazione token/password per configurazioni proxy loopback sullo stesso host, oppure
- Instrada tramite un indirizzo proxy attendibile non loopback e mantieni quell'IP in `gateway.trustedProxies`.

### "trusted_proxy_user_missing"

L'header utente era vuoto o mancante. Controlla:

- Il tuo proxy è configurato per passare header di identità?
- Il nome dell'header è corretto? (non distingue tra maiuscole e minuscole, ma l'ortografia conta)
- L'utente è effettivamente autenticato sul proxy?

### "trusted*proxy_missing_header*\*"

Un header richiesto non era presente. Controlla:

- La configurazione del tuo proxy per quegli header specifici
- Se gli header vengono rimossi da qualche parte nella catena

### "trusted_proxy_user_not_allowed"

L'utente è autenticato ma non è in `allowUsers`. Aggiungilo oppure rimuovi la allowlist.

### "trusted_proxy_origin_not_allowed"

L'autenticazione trusted-proxy è riuscita, ma l'header browser `Origin` non ha superato i controlli di origine della UI di controllo.

Controlla:

- `gateway.controlUi.allowedOrigins` include l'origine esatta del browser
- Non stai facendo affidamento su origini wildcard a meno che tu non voglia intenzionalmente un comportamento allow-all
- Se usi intenzionalmente la modalità fallback dell'header Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` è impostato deliberatamente

### Il WebSocket continua a non funzionare

Assicurati che il tuo proxy:

- Supporti gli upgrade WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- Passi gli header di identità sulle richieste di upgrade WebSocket (non solo HTTP)
- Non abbia un percorso auth separato per le connessioni WebSocket

## Migrazione dall'autenticazione con token

Se stai passando dall'autenticazione con token a trusted-proxy:

1. Configura il tuo proxy per autenticare gli utenti e passare gli header
2. Testa indipendentemente la configurazione del proxy (curl con header)
3. Aggiorna la configurazione OpenClaw con l'autenticazione trusted-proxy
4. Riavvia il Gateway
5. Testa le connessioni WebSocket dalla UI di controllo
6. Esegui `openclaw security audit` e rivedi i risultati

## Correlati

- [Sicurezza](/gateway/security) — guida completa alla sicurezza
- [Configurazione](/gateway/configuration) — riferimento della configurazione
- [Accesso remoto](/gateway/remote) — altri modelli di accesso remoto
- [Tailscale](/gateway/tailscale) — alternativa più semplice per accesso solo tailnet
