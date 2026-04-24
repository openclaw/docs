---
read_when:
    - Esecuzione di OpenClaw dietro un proxy consapevole dell'identità
    - Configurazione di Pomerium, Caddy o nginx con OAuth davanti a OpenClaw
    - Correzione degli errori WebSocket 1008 unauthorized con configurazioni di proxy inverso
    - Decisione su dove impostare HSTS e altri header di hardening HTTP
summary: Delega l'autenticazione del gateway a un proxy inverso attendibile (Pomerium, Caddy, nginx + OAuth)
title: Autenticazione trusted proxy
x-i18n:
    generated_at: "2026-04-24T08:43:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: af406f218fb91c5ae2fed04921670bfc4cd3d06f51b08eec91cddde4521bf771
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

> ⚠️ **Funzionalità sensibile alla sicurezza.** Questa modalità delega completamente l'autenticazione al tuo proxy inverso. Una configurazione errata può esporre il tuo Gateway ad accessi non autorizzati. Leggi attentamente questa pagina prima di abilitarla.

## Quando usarla

Usa la modalità di autenticazione `trusted-proxy` quando:

- Esegui OpenClaw dietro un **proxy consapevole dell'identità** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Il tuo proxy gestisce tutta l'autenticazione e passa l'identità dell'utente tramite header
- Ti trovi in un ambiente Kubernetes o container dove il proxy è l'unico percorso verso il Gateway
- Stai riscontrando errori WebSocket `1008 unauthorized` perché i browser non possono passare token nel payload WS

## Quando NON usarla

- Se il tuo proxy non autentica gli utenti (solo terminazione TLS o load balancer)
- Se esiste qualunque percorso verso il Gateway che bypassa il proxy (buchi nel firewall, accesso dalla rete interna)
- Se non sei sicuro che il tuo proxy rimuova/sovrascriva correttamente gli header inoltrati
- Se hai bisogno solo di accesso personale per un solo utente (valuta Tailscale Serve + loopback per una configurazione più semplice)

## Come funziona

1. Il tuo proxy inverso autentica gli utenti (OAuth, OIDC, SAML, ecc.)
2. Il proxy aggiunge un header con l'identità dell'utente autenticato (ad esempio, `x-forwarded-user: nick@example.com`)
3. OpenClaw controlla che la richiesta provenga da un **IP di proxy attendibile** (configurato in `gateway.trustedProxies`)
4. OpenClaw estrae l'identità dell'utente dall'header configurato
5. Se tutto corrisponde, la richiesta viene autorizzata

## Comportamento di associazione della UI di controllo

Quando `gateway.auth.mode = "trusted-proxy"` è attivo e la richiesta supera i
controlli trusted-proxy, le sessioni WebSocket della UI di controllo possono connettersi senza
identità di associazione del dispositivo.

Implicazioni:

- L'associazione non è più il controllo principale per l'accesso alla UI di controllo in questa modalità.
- La policy di autenticazione del tuo proxy inverso e `allowUsers` diventano il controllo di accesso effettivo.
- Mantieni l'ingresso del gateway bloccato solo agli IP del proxy attendibile (`gateway.trustedProxies` + firewall).

## Configurazione

```json5
{
  gateway: {
    // L'autenticazione trusted-proxy si aspetta richieste da una sorgente proxy attendibile non-loopback
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

Regola importante del runtime:

- L'autenticazione trusted-proxy rifiuta richieste da sorgenti loopback (`127.0.0.1`, `::1`, CIDR loopback).
- I proxy inversi loopback sullo stesso host **non** soddisfano l'autenticazione trusted-proxy.
- Per configurazioni con proxy loopback sullo stesso host, usa invece l'autenticazione token/password, oppure instrada tramite un indirizzo trusted-proxy non-loopback che OpenClaw possa verificare.
- Le distribuzioni UI di controllo non-loopback richiedono comunque `gateway.controlUi.allowedOrigins` esplicito.
- **Le prove dagli header forwarded prevalgono sulla località loopback.** Se una richiesta arriva su loopback ma porta header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` che puntano a un'origine non locale, tali prove invalidano la rivendicazione di località loopback. La richiesta viene trattata come remota per pairing, autenticazione trusted-proxy e controllo dell'identità del dispositivo della UI di controllo. Questo impedisce a un proxy loopback sullo stesso host di “ripulire” un'identità da header forwarded trasformandola in autenticazione trusted-proxy.

### Riferimento della configurazione

| Campo                                       | Obbligatorio | Descrizione                                                                 |
| ------------------------------------------- | ------------ | --------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Sì           | Array di indirizzi IP del proxy da considerare attendibili. Le richieste da altri IP vengono rifiutate. |
| `gateway.auth.mode`                         | Sì           | Deve essere `"trusted-proxy"`                                               |
| `gateway.auth.trustedProxy.userHeader`      | Sì           | Nome dell'header che contiene l'identità dell'utente autenticato            |
| `gateway.auth.trustedProxy.requiredHeaders` | No           | Header aggiuntivi che devono essere presenti affinché la richiesta sia considerata attendibile |
| `gateway.auth.trustedProxy.allowUsers`      | No           | Allowlist delle identità utente. Vuoto significa consentire tutti gli utenti autenticati. |

## Terminazione TLS e HSTS

Usa un solo punto di terminazione TLS e applica HSTS lì.

### Modello consigliato: terminazione TLS sul proxy

Quando il tuo proxy inverso gestisce HTTPS per `https://control.example.com`, imposta
`Strict-Transport-Security` sul proxy per quel dominio.

- Adatto alle distribuzioni esposte su Internet.
- Mantiene certificati + policy di hardening HTTP in un unico posto.
- OpenClaw può restare su loopback HTTP dietro il proxy.

Valore di esempio dell'header:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Terminazione TLS del Gateway

Se OpenClaw stesso serve direttamente HTTPS (nessun proxy con terminazione TLS), imposta:

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

`strictTransportSecurity` accetta un valore stringa per l'header, oppure `false` per disabilitarlo esplicitamente.

### Linee guida per il rollout

- Inizia prima con un max age breve (ad esempio `max-age=300`) durante la validazione del traffico.
- Aumenta a valori di lunga durata (ad esempio `max-age=31536000`) solo quando il livello di confidenza è alto.
- Aggiungi `includeSubDomains` solo se ogni sottodominio è pronto per HTTPS.
- Usa preload solo se soddisfi intenzionalmente i requisiti di preload per l'intero insieme dei tuoi domini.
- Lo sviluppo locale solo loopback non beneficia di HSTS.

## Esempi di configurazione del proxy

### Pomerium

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

OpenClaw rifiuta configurazioni ambigue in cui sia un `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`) sia la modalità `trusted-proxy` sono attivi contemporaneamente. Le configurazioni miste con token possono far sì che le richieste loopback si autentichino silenziosamente sul percorso di autenticazione sbagliato.

Se vedi un errore `mixed_trusted_proxy_token` all'avvio:

- Rimuovi il token condiviso quando usi la modalità trusted-proxy, oppure
- Cambia `gateway.auth.mode` in `"token"` se intendi usare l'autenticazione basata su token.

Anche l'autenticazione trusted-proxy loopback fallisce in modalità fail-closed: i chiamanti sullo stesso host devono fornire gli header di identità configurati tramite un proxy attendibile invece di essere autenticati silenziosamente.

## Header degli ambiti operatore

L'autenticazione trusted-proxy è una modalità HTTP **che trasporta identità**, quindi i chiamanti possono
dichiarare facoltativamente gli ambiti operatore con `x-openclaw-scopes`.

Esempi:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamento:

- Quando l'header è presente, OpenClaw rispetta l'insieme di ambiti dichiarato.
- Quando l'header è presente ma vuoto, la richiesta dichiara **nessun** ambito operatore.
- Quando l'header è assente, le normali API HTTP che trasportano identità tornano all'insieme predefinito standard degli ambiti operatore.
- Le **route HTTP dei Plugin** autenticate dal Gateway sono più ristrette per impostazione predefinita: quando `x-openclaw-scopes` è assente, il loro ambito runtime ripiega su `operator.write`.
- Le richieste HTTP con origine browser devono comunque superare `gateway.controlUi.allowedOrigins` (o una modalità deliberata di fallback sull'header Host) anche dopo che l'autenticazione trusted-proxy è riuscita.

Regola pratica:

- Invia `x-openclaw-scopes` esplicitamente quando vuoi che una richiesta trusted-proxy
  sia più ristretta dei valori predefiniti, oppure quando una route di Plugin autenticata dal gateway ha bisogno
  di qualcosa di più forte dell'ambito write.

## Checklist di sicurezza

Prima di abilitare l'autenticazione trusted-proxy, verifica:

- [ ] **Il proxy è l'unico percorso**: la porta del Gateway è protetta dal firewall da tutto tranne il tuo proxy
- [ ] **trustedProxies è minimo**: solo gli IP effettivi del tuo proxy, non intere subnet
- [ ] **Nessuna sorgente proxy loopback**: l'autenticazione trusted-proxy fallisce in modalità fail-closed per richieste da sorgenti loopback
- [ ] **Il proxy rimuove gli header**: il tuo proxy sovrascrive (non aggiunge in coda) gli header `x-forwarded-*` provenienti dai client
- [ ] **Terminazione TLS**: il tuo proxy gestisce TLS; gli utenti si connettono via HTTPS
- [ ] **allowedOrigins è esplicito**: la UI di controllo non-loopback usa `gateway.controlUi.allowedOrigins` esplicito
- [ ] **allowUsers è impostato** (consigliato): limita a utenti noti invece di consentire chiunque sia autenticato
- [ ] **Nessuna configurazione token mista**: non impostare sia `gateway.auth.token` sia `gateway.auth.mode: "trusted-proxy"`

## Audit di sicurezza

`openclaw security audit` segnalerà l'autenticazione trusted-proxy con un rilevamento di gravità **critica**. È intenzionale: è un promemoria che stai delegando la sicurezza alla configurazione del tuo proxy.

L'audit controlla:

- Avviso/promemoria base `gateway.trusted_proxy_auth` warning/critical
- Configurazione `trustedProxies` mancante
- Configurazione `userHeader` mancante
- `allowUsers` vuoto (consente qualunque utente autenticato)
- Policy con wildcard o mancante per le origini browser su superfici esposte della UI di controllo

## Risoluzione dei problemi

### "trusted_proxy_untrusted_source"

La richiesta non proveniva da un IP presente in `gateway.trustedProxies`. Controlla:

- L'IP del proxy è corretto? (Gli IP dei container Docker possono cambiare)
- C'è un load balancer davanti al tuo proxy?
- Usa `docker inspect` o `kubectl get pods -o wide` per trovare gli IP effettivi

### "trusted_proxy_loopback_source"

OpenClaw ha rifiutato una richiesta trusted-proxy da sorgente loopback.

Controlla:

- Il proxy si sta connettendo da `127.0.0.1` / `::1`?
- Stai cercando di usare l'autenticazione trusted-proxy con un proxy inverso loopback sullo stesso host?

Correzione:

- Usa l'autenticazione token/password per configurazioni con proxy loopback sullo stesso host, oppure
- Instrada tramite un indirizzo trusted-proxy non-loopback e mantieni quell'IP in `gateway.trustedProxies`.

### "trusted_proxy_user_missing"

L'header utente era vuoto o mancante. Controlla:

- Il tuo proxy è configurato per passare gli header di identità?
- Il nome dell'header è corretto? (non distingue tra maiuscole e minuscole, ma l'ortografia conta)
- L'utente è effettivamente autenticato sul proxy?

### "trusted*proxy_missing_header*\*"

Un header obbligatorio non era presente. Controlla:

- La configurazione del tuo proxy per quegli header specifici
- Se gli header vengono rimossi in qualche punto della catena

### "trusted_proxy_user_not_allowed"

L'utente è autenticato ma non è in `allowUsers`. Aggiungilo oppure rimuovi l'allowlist.

### "trusted_proxy_origin_not_allowed"

L'autenticazione trusted-proxy è riuscita, ma l'header browser `Origin` non ha superato i controlli di origine della UI di controllo.

Controlla:

- `gateway.controlUi.allowedOrigins` include l'origine browser esatta
- Non stai facendo affidamento su origini wildcard a meno che tu non voglia intenzionalmente un comportamento allow-all
- Se usi intenzionalmente la modalità fallback dell'header Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` è impostato deliberatamente

### Il WebSocket continua a non funzionare

Assicurati che il tuo proxy:

- Supporti gli upgrade WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- Passi gli header di identità nelle richieste di upgrade WebSocket (non solo HTTP)
- Non abbia un percorso di autenticazione separato per le connessioni WebSocket

## Migrazione dall'autenticazione token

Se stai passando dall'autenticazione token a trusted-proxy:

1. Configura il tuo proxy per autenticare gli utenti e passare gli header
2. Testa la configurazione del proxy in modo indipendente (`curl` con header)
3. Aggiorna la configurazione di OpenClaw con l'autenticazione trusted-proxy
4. Riavvia il Gateway
5. Testa le connessioni WebSocket dalla UI di controllo
6. Esegui `openclaw security audit` e rivedi i risultati

## Correlati

- [Sicurezza](/it/gateway/security) — guida completa alla sicurezza
- [Configurazione](/it/gateway/configuration) — riferimento della configurazione
- [Accesso remoto](/it/gateway/remote) — altri modelli di accesso remoto
- [Tailscale](/it/gateway/tailscale) — alternativa più semplice per accesso solo tailnet
