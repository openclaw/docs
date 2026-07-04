---
read_when:
    - Creazione di client API
    - Aggiunta di endpoint o schemi
summary: Panoramica e convenzioni dell'API REST pubblica (v1).
x-i18n:
    generated_at: "2026-07-04T18:03:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Base: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Riuso del catalogo pubblico

Puoi creare un catalogo, una directory o una superficie di ricerca di terze parti sopra le API di lettura pubbliche di ClawHub. I metadati pubblici delle Skills e i file delle Skills sono pubblicati secondo le regole di licenza delle Skills di ClawHub, mentre l'API stessa è soggetta a limiti di frequenza e deve essere usata in modo responsabile.

Linee guida:

- Usa endpoint di lettura pubblici come `GET /api/v1/skills`, `GET /api/v1/search` e `GET /api/v1/skills/{slug}` per gli elenchi del catalogo.
- Memorizza le risposte nella cache e rispetta `429`, `Retry-After` e le intestazioni dei limiti di frequenza invece di eseguire polling aggressivo.
- Inserisci un link all'URL canonico della Skill su ClawHub quando mostri gli elenchi, così gli utenti possono esaminare il record del registro sorgente.
- Usa URL di pagina canonici nella forma `https://clawhub.ai/<owner>/skills/<slug>`.
- Non lasciare intendere che ClawHub approvi, verifichi o gestisca il sito di terze parti.
- Non replicare contenuti nascosti, privati o bloccati dalla moderazione aggirando i filtri dell'API pubblica o i confini di autenticazione.

## Autenticazione

- Lettura pubblica: nessun token richiesto.
- Scrittura + account: `Authorization: Bearer clh_...`.

## Limiti di frequenza

Applicazione consapevole dell'autenticazione:

- Richieste anonime: per IP.
- Richieste autenticate (token Bearer valido): per bucket utente.
- Token mancante/non valido: ripiega sull'applicazione per IP.

- Lettura: 3000/min per IP, 12000/min per chiave
- Scrittura: 300/min per IP, 3000/min per chiave
- Download: 1200/min per IP, 6000/min per chiave

Intestazioni: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` e `Retry-After` sono inclusi su `429`.

Semantica:

- `X-RateLimit-Reset`: secondi Unix epoch (ora assoluta di reset)
- `RateLimit-Reset`: secondi di ritardo fino al reset
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: budget residuo esatto quando
  presente; le richieste riuscite su shard lo omettono invece di restituire un valore
  globale approssimativo
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
- Altrimenti usa `RateLimit-Reset` o deriva il ritardo da `X-RateLimit-Reset`.
- Aggiungi jitter ai tentativi.

## Errori

- Gli errori v1 sono testo semplice (`text/plain; charset=utf-8`), inclusi `400`,
  `401`, `403`, `404`, `429` e le risposte di download bloccato.
- I parametri di query sconosciuti vengono ignorati per compatibilità.
- I parametri di query noti con valori non validi restituiscono `400`.

## Endpoint

Lettura pubblica:

- `GET /api/v1/search?q=...`
  - Filtri opzionali: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Alias legacy: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (predefinito), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), gli alias legacy di installazione `installsCurrent`/`installs`/`installsAllTime` vengono mappati a `downloads`, `trending`
  - I valori `sort` non validi restituiscono `400`
  - `cursor` si applica agli ordinamenti non `trending`
  - Filtro opzionale: `nonSuspiciousOnly=true`
  - Alias legacy: `nonSuspicious=true`
  - Con `nonSuspiciousOnly=true`, le pagine basate su cursore possono contenere meno di `limit` elementi; usa `nextCursor` per continuare.
  - `recommended` usa segnali di coinvolgimento e recenza.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Le Skills ospitate restituiscono byte ZIP deterministici.
  - Le Skills correnti basate su GitHub con una scansione `clean` o `suspicious` restituiscono un
    descrittore di passaggio JSON `public-github` invece dei byte di ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Le Skills ospitate vengono esportate come file archiviati.
  - Le Skills correnti basate su GitHub con una scansione `clean` o `suspicious` vengono esportate
    come descrittori di passaggio `public-github`.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (predefinito), `recommended`, `downloads`, alias legacy `installs`
  - I valori `sort` non validi restituiscono `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (predefinito), `downloads`, `updated`, alias legacy `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Autenticazione richiesta:

- `POST /api/v1/skills` (pubblicazione, multipart preferito)
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
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Solo amministratori:

- `POST /api/v1/users/reserve` riserva slug radice e segnaposto di pacchetti privati senza release per un handle proprietario.

## Legacy

Le API legacy `/api/*` e `/api/cli/*` sono ancora disponibili. Vedi `DEPRECATIONS.md`.
