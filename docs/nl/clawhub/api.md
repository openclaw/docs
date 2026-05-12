---
read_when:
    - API-clients bouwen
    - Eindpunten of schema's toevoegen
summary: Overzicht en conventies van de openbare REST-API (v1).
x-i18n:
    generated_at: "2026-05-12T00:55:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b6bb020fec1f8aca039dab4d1a09f7a42c64158ad48bf061ce5dbda819d1987
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Basis: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Hergebruik van openbare catalogus

Je kunt een catalogus, directory of zoekinterface van derden bouwen boven op de openbare lees-API's van ClawHub. Openbare skillmetadata en skillbestanden worden gepubliceerd onder de skilllicentieregels van ClawHub, terwijl de API zelf rate-limited is en verantwoord moet worden gebruikt.

Richtlijnen:

- Gebruik openbare leesendpoints zoals `GET /api/v1/skills`, `GET /api/v1/search` en `GET /api/v1/skills/{slug}` voor catalogusvermeldingen.
- Cache responses en respecteer `429`, `Retry-After` en rate-limit-headers in plaats van agressief te pollen.
- Link terug naar de canonieke ClawHub-skill-URL wanneer je vermeldingen toont, zodat gebruikers de bronregistratierecord kunnen inspecteren.
- Gebruik canonieke pagina-URL's in de vorm `https://clawhub.ai/<owner>/<slug>`.
- Impliceer niet dat ClawHub de site van derden onderschrijft, verifieert of beheert.
- Spiegel geen verborgen, privé- of door moderatie geblokkeerde content door openbare API-filters of authenticatiegrenzen te omzeilen.

## Authenticatie

- Openbaar lezen: geen token vereist.
- Schrijven + account: `Authorization: Bearer clh_...`.

## Snelheidslimieten

Handhaving op basis van authenticatie:

- Anonieme requests: per IP.
- Geauthenticeerde requests (geldig Bearer-token): per gebruikersbucket.
- Ontbrekend/ongeldig token valt terug op IP-handhaving.

- Lezen: 600/min per IP, 2400/min per sleutel
- Schrijven: 45/min per IP, 180/min per sleutel

Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (bij 429).

Semantiek:

- `X-RateLimit-Reset`: Unix-epochseconden (absolute resettijd)
- `RateLimit-Reset`: vertragingsseconden tot reset
- `Retry-After`: vertragingsseconden om te wachten bij `429`

Voorbeeld `429`:

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

Clientafhandeling:

- Geef de voorkeur aan `Retry-After` wanneer aanwezig.
- Gebruik anders `RateLimit-Reset` of leid de vertraging af uit `X-RateLimit-Reset`.
- Voeg jitter toe aan nieuwe pogingen.

## Endpoints

Openbaar lezen:

- `GET /api/v1/search?q=...`
  - Optionele filters: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Legacy-alias: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (standaard), `createdAt` (`newest`), `downloads`, `stars` (`rating`), `installsCurrent` (`installs`), `installsAllTime`, `trending`
  - `cursor` is van toepassing op niet-`trending`-sorteringen
  - Optioneel filter: `nonSuspiciousOnly=true`
  - Legacy-alias: `nonSuspicious=true`
  - Met `nonSuspiciousOnly=true` kunnen cursorgebaseerde pagina's minder dan `limit` items bevatten; gebruik `nextCursor` om door te gaan.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Authenticatie vereist:

- `POST /api/v1/skills` (publiceren, multipart aanbevolen)
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

Alleen beheerder:

- `POST /api/v1/users/reserve` reserveert root-slugs en privépakketplaatsaanduidingen zonder release voor een eigenaarshandle.

## Legacy

Legacy `/api/*` en `/api/cli/*` zijn nog beschikbaar. Zie `DEPRECATIONS.md`.
