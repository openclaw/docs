---
read_when:
    - API-clients bouwen
    - Eindpunten of schema's toevoegen
summary: Overzicht en conventies van de openbare REST API (v1).
x-i18n:
    generated_at: "2026-05-13T04:17:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: b47be9d71678924ec43f061a1013776695facc1ee8017397b07e24faa65fc154
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Basis: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Hergebruik van de openbare catalogus

Je kunt een externe catalogus, directory of zoekinterface bouwen bovenop de openbare lees-API's van ClawHub. Openbare skillmetadata en skillbestanden worden gepubliceerd onder de skilllicentieregels van ClawHub, terwijl de API zelf rate-limited is en verantwoord moet worden gebruikt.

Richtlijnen:

- Gebruik openbare leesendpoints zoals `GET /api/v1/skills`, `GET /api/v1/search` en `GET /api/v1/skills/{slug}` voor catalogusvermeldingen.
- Cache responses en respecteer `429`, `Retry-After` en rate-limit-headers in plaats van agressief te pollen.
- Link terug naar de canonieke ClawHub-skill-URL wanneer je vermeldingen weergeeft, zodat gebruikers de bronregistratierecord kunnen inspecteren.
- Gebruik canonieke pagina-URL's in de vorm `https://clawhub.ai/<owner>/<slug>`.
- Impliceer niet dat ClawHub de externe site onderschrijft, verifieert of exploiteert.
- Spiegel geen verborgen, private of door moderatie geblokkeerde content door openbare API-filters of auth-grenzen te omzeilen.

## Auth

- Openbaar lezen: geen token vereist.
- Schrijven + account: `Authorization: Bearer clh_...`.

## Rate limits

Auth-bewuste handhaving:

- Anonieme requests: per IP.
- Geauthenticeerde requests (geldige Bearer-token): per gebruikersbucket.
- Ontbrekende/ongeldige token valt terug op IP-handhaving.

- Lezen: 600/min per IP, 2400/min per key
- Schrijven: 45/min per IP, 180/min per key

Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (bij 429).

Semantiek:

- `X-RateLimit-Reset`: Unix-epochtijd in seconden (absolute resettijd)
- `RateLimit-Reset`: vertraging in seconden tot reset
- `Retry-After`: vertraging in seconden om te wachten bij `429`

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
- Voeg jitter toe aan retries.

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
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Auth vereist:

- `POST /api/v1/skills` (publiceren, multipart heeft de voorkeur)
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

Alleen admin:

- `POST /api/v1/users/reserve` reserveert root-slugs en private placeholderpakketten zonder release voor een owner-handle.

## Legacy

Legacy `/api/*` en `/api/cli/*` blijven beschikbaar. Zie `DEPRECATIONS.md`.
