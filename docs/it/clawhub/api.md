---
read_when:
    - Creazione di client API
    - Aggiunta di endpoint o schemi
summary: Panoramica e convenzioni dell'API REST pubblica (v1).
x-i18n:
    generated_at: "2026-05-13T05:32:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: b47be9d71678924ec43f061a1013776695facc1ee8017397b07e24faa65fc154
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Base: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Riutilizzo del catalogo pubblico

Puoi creare un catalogo, una directory o una superficie di ricerca di terze parti sopra le API pubbliche di lettura di ClawHub. I metadati pubblici degli skill e i file degli skill sono pubblicati secondo le regole di licenza degli skill di ClawHub, mentre l'API stessa è soggetta a limiti di frequenza e deve essere usata in modo responsabile.

Linee guida:

- Usa endpoint pubblici di lettura come `GET /api/v1/skills`, `GET /api/v1/search` e `GET /api/v1/skills/{slug}` per gli elenchi del catalogo.
- Memorizza le risposte nella cache e rispetta `429`, `Retry-After` e gli header dei limiti di frequenza invece di eseguire polling aggressivo.
- Collega all'URL canonico dello skill su ClawHub quando mostri gli elenchi, così gli utenti possono ispezionare il record del registro di origine.
- Usa URL di pagina canonici nel formato `https://clawhub.ai/<owner>/<slug>`.
- Non insinuare che ClawHub approvi, verifichi o gestisca il sito di terze parti.
- Non replicare contenuti nascosti, privati o bloccati dalla moderazione aggirando i filtri dell'API pubblica o i confini di autenticazione.

## Autenticazione

- Lettura pubblica: nessun token richiesto.
- Scrittura + account: `Authorization: Bearer clh_...`.

## Limiti di frequenza

Applicazione in base all'autenticazione:

- Richieste anonime: per IP.
- Richieste autenticate (token Bearer valido): per bucket utente.
- Token mancante/non valido: ricade sull'applicazione per IP.

- Lettura: 600/min per IP, 2400/min per chiave
- Scrittura: 45/min per IP, 180/min per chiave

Header: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (su 429).

Semantica:

- `X-RateLimit-Reset`: secondi Unix epoch (orario assoluto di reset)
- `RateLimit-Reset`: secondi di ritardo fino al reset
- `Retry-After`: secondi di ritardo da attendere su `429`

Esempio `429`:

```http
HTTP/2 429
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34
```

Gestione client:

- Preferisci `Retry-After` quando presente.
- Altrimenti usa `RateLimit-Reset` o ricava il ritardo da `X-RateLimit-Reset`.
- Aggiungi jitter ai tentativi.

## Endpoint

Lettura pubblica:

- `GET /api/v1/search?q=...`
  - Filtri opzionali: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Alias precedente: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (predefinito), `createdAt` (`newest`), `downloads`, `stars` (`rating`), `installsCurrent` (`installs`), `installsAllTime`, `trending`
  - `cursor` si applica agli ordinamenti diversi da `trending`
  - Filtro opzionale: `nonSuspiciousOnly=true`
  - Alias precedente: `nonSuspicious=true`
  - Con `nonSuspiciousOnly=true`, le pagine basate su cursore possono contenere meno elementi di `limit`; usa `nextCursor` per continuare.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Autenticazione richiesta:

- `POST /api/v1/skills` (pubblicazione, preferibilmente multipart)
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/packages/{name}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/packages/{name}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Solo amministratori:

- `POST /api/v1/users/reserve` riserva slug radice e segnaposto privati di pacchetti senza release per un handle proprietario.

## Compatibilità con versioni precedenti

Gli endpoint precedenti `/api/*` e `/api/cli/*` sono ancora disponibili. Vedi `DEPRECATIONS.md`.
