---
read_when:
    - Creazione di client API
    - Aggiunta di endpoint o schemi
summary: Panoramica e convenzioni dell'API REST pubblica (v1).
x-i18n:
    generated_at: "2026-07-16T13:56:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Base: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Riutilizzo del catalogo pubblico

È possibile creare un catalogo, una directory o un'interfaccia di ricerca di terze parti basandosi sulle API pubbliche di lettura di ClawHub. I metadati pubblici e i file delle skill vengono pubblicati secondo le regole di licenza delle skill di ClawHub, mentre l'API è soggetta a limiti di frequenza e deve essere utilizzata responsabilmente.

Linee guida:

- Utilizzare endpoint pubblici di lettura come `GET /api/v1/skills`, `GET /api/v1/search` e `GET /api/v1/skills/{slug}` per gli elenchi del catalogo.
- Memorizzare nella cache le risposte e rispettare `429`, `Retry-After` e le intestazioni dei limiti di frequenza, anziché eseguire polling frequenti.
- Quando si visualizzano gli elenchi, inserire un collegamento all'URL canonico della skill di ClawHub, affinché sia possibile consultare il record del registro di origine.
- Utilizzare URL di pagina canonici nel formato `https://clawhub.ai/<owner>/skills/<slug>`.
- Non lasciare intendere che ClawHub approvi, verifichi o gestisca il sito di terze parti.
- Non replicare contenuti nascosti, privati o bloccati dalla moderazione aggirando i filtri dell'API pubblica o i confini di autenticazione.

## Autenticazione

- Lettura pubblica: nessun token richiesto.
- Scrittura + account: `Authorization: Bearer clh_...`.

## Limiti di frequenza

Applicazione in base all'autenticazione:

- Richieste anonime: per IP.
- Richieste autenticate (token Bearer valido): per gruppo di utenti.
- Un token mancante o non valido comporta l'applicazione dei limiti per IP.

- Lettura: 3000/min per IP, 12000/min per chiave
- Scrittura: 300/min per IP, 3000/min per chiave
- Download: 1200/min per IP, 6000/min per chiave

Intestazioni: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` e `Retry-After` sono incluse nelle risposte `429`.

Semantica:

- `X-RateLimit-Reset`: secondi dall'epoca Unix (ora assoluta di reimpostazione)
- `RateLimit-Reset`: secondi di attesa fino alla reimpostazione
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: budget residuo esatto quando
  presente; le richieste distribuite tra shard completate correttamente lo omettono anziché restituire un valore
  globale approssimativo
- `Retry-After`: secondi di attesa in caso di `429`

Esempio di `429`:

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

Gestione lato client:

- Preferire `Retry-After` quando presente.
- Altrimenti, utilizzare `RateLimit-Reset` o ricavare il tempo di attesa da `X-RateLimit-Reset`.
- Aggiungere una variazione casuale ai nuovi tentativi.

## Errori

- Gli errori v1 sono in testo semplice (`text/plain; charset=utf-8`), inclusi `400`,
  `401`, `403`, `404`, `429` e le risposte di download bloccato.
- I parametri di query sconosciuti vengono ignorati per compatibilità.
- I parametri di query noti con valori non validi restituiscono `400`.

## Endpoint

Lettura pubblica:

- `GET /api/v1/search?q=...`
  - Filtri facoltativi: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Alias precedente: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (predefinito), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), gli alias di installazione precedenti `installsCurrent`/`installs`/`installsAllTime` corrispondono a `downloads`, `trending`
  - I valori `sort` non validi restituiscono `400`
  - `cursor` si applica agli ordinamenti diversi da `trending`
  - Filtro facoltativo: `nonSuspiciousOnly=true`
  - Alias precedente: `nonSuspicious=true`
  - Con `nonSuspiciousOnly=true`, le pagine basate su cursore possono contenere meno di `limit` elementi; utilizzare `nextCursor` per continuare.
  - `recommended` utilizza segnali di coinvolgimento e attualità.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Le skill ospitate restituiscono byte ZIP deterministici.
  - Le skill correnti basate su GitHub con una scansione `clean` o `suspicious` restituiscono un
    descrittore JSON `public-github` di trasferimento anziché byte di ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Le skill ospitate vengono esportate come file archiviati.
  - Le skill correnti basate su GitHub con una scansione `clean` o `suspicious` vengono esportate
    come descrittori `public-github` di trasferimento.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (predefinito), `recommended`, `downloads`, alias precedente `installs`
  - I valori `sort` non validi restituiscono `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (predefinito), `downloads`, `updated`, alias precedente `installs`
- `GET /api/v1/plugins/search?q=...`
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
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Solo amministratori:

- `POST /api/v1/users/reserve` riserva gli slug radice e i segnaposto di pacchetti privati senza release per un identificativo del proprietario.

## Versione precedente

Le versioni precedenti `/api/*` e `/api/cli/*` sono ancora disponibili. Consultare `DEPRECATIONS.md`.
