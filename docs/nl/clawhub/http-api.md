---
read_when:
    - Eindpunten toevoegen/wijzigen
    - CLI ↔ registerverzoeken debuggen
summary: HTTP-API-referentie (openbare + CLI-eindpunten + authenticatie).
x-i18n:
    generated_at: "2026-07-04T10:49:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP-API

Basis-URL: `https://clawhub.ai` (standaard).

Alle v1-paden staan onder `/api/v1/...`.
Verouderde `/api/...` en `/api/cli/...` blijven bestaan voor compatibiliteit (zie `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Hergebruik van openbare catalogus

Externe directories mogen de openbare leesendpoints gebruiken om ClawHub-Skills te tonen of te doorzoeken. Cache resultaten, respecteer `429`/`Retry-After`, link gebruikers terug naar de canonieke ClawHub-vermelding (`https://clawhub.ai/<owner>/skills/<slug>`), en voorkom de indruk dat ClawHub de externe site onderschrijft. Probeer geen verborgen, privé- of door moderatie geblokkeerde inhoud buiten het openbare API-oppervlak te spiegelen.

Webslug-snelkoppelingen worden over registerfamilies heen opgelost, maar API-clients moeten
de canonieke URL's gebruiken die door leesendpoints worden teruggegeven in plaats van route-
prioriteit te reconstrueren.

## Snelheidslimieten

Handhavingsmodel:

- Anonieme verzoeken: gehandhaafd per IP.
- Geauthenticeerde verzoeken (geldig Bearer-token): gehandhaafd per gebruikersbucket.
- Als token ontbreekt/ongeldig is, valt gedrag terug op IP-handhaving.
- Geauthenticeerde schrijfendpoints mogen geen kale `Unauthorized` teruggeven wanneer
  de server de reden kent. Ontbrekende tokens, ongeldige/ingetrokken tokens, en
  verwijderde/gebande/uitgeschakelde accounts moeten elk actiegerichte tekst krijgen zodat CLI-
  clients gebruikers kunnen vertellen wat hen blokkeerde.

- Lezen: 3000/min per IP, 12000/min per sleutel
- Schrijven: 300/min per IP, 3000/min per sleutel
- Downloaden: 1200/min per IP, 6000/min per sleutel (downloadendpoints)

Headers:

- Verouderde compatibiliteit: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Gestandaardiseerd: `RateLimit-Limit`, `RateLimit-Reset`
- Bij `429`: `X-RateLimit-Remaining: 0` en `RateLimit-Remaining: 0`
- Bij `429`: `Retry-After`

Headersemantiek:

- `X-RateLimit-Reset`: absolute Unix-epochtijd in seconden
- `RateLimit-Reset`: seconden tot reset (vertraging)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: exact resterend budget wanneer aanwezig.
  Geslaagde gesharde verzoeken laten deze header weg in plaats van een benaderde globale waarde terug te geven.
- `Retry-After`: seconden om te wachten vóór opnieuw proberen (vertraging) bij `429`

Voorbeeld van `429`-respons:

```http
HTTP/2 429
content-type: text/plain; charset=utf-8
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34

Rate limit exceeded
```

Clientrichtlijnen:

- Als `Retry-After` bestaat, wacht dan dat aantal seconden voordat je opnieuw probeert.
- Gebruik backoff met jitter om gesynchroniseerde nieuwe pogingen te vermijden.
- Als `Retry-After` ontbreekt, val dan terug op `RateLimit-Reset` (of bereken vanuit `X-RateLimit-Reset`).

IP-bron:

- Gebruikt vertrouwde client-IP-headers, waaronder `cf-connecting-ip`, alleen wanneer de
  deployment expliciet vertrouwde doorgestuurde headers inschakelt.
- ClawHub gebruikt vertrouwde forwarding-headers om client-IP's aan de edge te identificeren.
- Als geen vertrouwd client-IP beschikbaar is, gebruiken anonieme verzoeken fallback-buckets
  die alleen zijn gescoped op type snelheidslimiet. Deze fallback-buckets bevatten geen
  door de caller aangeleverde paden, slugs, pakketnamen, versies, querystrings of andere
  artifactparameters.

## Foutresponses

Openbare v1-foutresponses zijn platte tekst met `content-type: text/plain; charset=utf-8`.
Dit omvat validatiefouten (`400`), ontbrekende openbare resources (`404`), auth- en
machtigingsfouten (`401`/`403`), snelheidslimieten (`429`) en geblokkeerde downloads. Clients
moeten de responsebody lezen als een voor mensen leesbare tekenreeks. Onbekende queryparameters worden
genegeerd voor compatibiliteit, maar herkende queryparameters met ongeldige waarden geven
`400` terug.

## Openbare endpoints (geen auth)

### `GET /api/v1/search`

Queryparameters:

- `q` (vereist): querystring
- `limit` (optioneel): geheel getal
- `highlightedOnly` (optioneel): `true` om te filteren op uitgelichte Skills
- `nonSuspiciousOnly` (optioneel): `true` om verdachte (`flagged.suspicious`) Skills te verbergen
- `nonSuspicious` (optioneel): verouderde alias voor `nonSuspiciousOnly`

Respons:

```json
{
  "results": [
    {
      "score": 0.123,
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "version": "1.2.3",
      "updatedAt": 1730000000000,
      "ownerHandle": "openclaw",
      "owner": {
        "handle": "openclaw",
        "displayName": "OpenClaw",
        "image": "https://example.com/avatar.png"
      }
    }
  ]
}
```

Opmerkingen:

- Resultaten worden teruggegeven in volgorde van relevantie (embeddingsgelijkenis + exacte slug-/naamtokenboosts + een kleine populariteitsprior).
- Relevantie is sterker dan populariteit. Een precieze slug- of weergavenaamtokenmatch kan hoger scoren dan een lossere match met veel sterkere betrokkenheid.
- ASCII-tekst wordt getokenized op woord- en interpunctiegrenzen. Bijvoorbeeld: `personal-map` bevat een losse `map`-token, terwijl `amap-jsapi-skill` `amap`, `jsapi` en `skill` bevat; zoeken naar `map` geeft `personal-map` daarom een sterkere lexicale match dan `amap-jsapi-skill`.
- Populariteit is loggeschaald en begrensd. Skills met hoge betrokkenheid kunnen lager ranken wanneer de querytekst een zwakkere match is.
- Verdachte of verborgen moderatiestatus kan een Skill uit openbare zoekresultaten verwijderen, afhankelijk van callerfilters en huidige moderatiestatus.

Richtlijnen voor vindbaarheid voor publishers:

- Zet de termen waar gebruikers letterlijk naar zoeken in de weergavenaam, samenvatting en tags. Gebruik alleen een losse slug-token wanneer die ook een stabiele identiteit is die je wilt behouden.
- Hernoem geen slug alleen om één query na te jagen, tenzij de nieuwe slug een betere canonieke naam voor de lange termijn is. Oude slugs worden redirect-aliassen, maar de canonieke URL, getoonde slug en toekomstige zoekdigests gebruiken de nieuwe slug.
- Hernoemaliassen behouden resolutie voor oude URL's en installaties die via het register worden opgelost, maar zoekranking is gebaseerd op de canonieke Skill-metadata nadat de hernoeming is geïndexeerd. Bestaande statistieken blijven bij de Skill.
- Als een Skill onverwacht onzichtbaar is, controleer dan eerst de moderatiestatus met `clawhub inspect @owner/slug` terwijl je bent ingelogd voordat je rankinggerelateerde metadata wijzigt.

### `GET /api/v1/skills`

Queryparameters:

- `limit` (optioneel): geheel getal (1-200)
- `cursor` (optioneel): paginatiecursor voor elke niet-`trending`-sortering
- `sort` (optioneel): `updated` (standaard), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), verouderde installatiealiassen `installsCurrent`/`installs`/`installsAllTime` mappen naar `downloads`, `trending`
- `nonSuspiciousOnly` (optioneel): `true` om verdachte (`flagged.suspicious`) Skills te verbergen
- `nonSuspicious` (optioneel): verouderde alias voor `nonSuspiciousOnly`

Ongeldige `sort`-waarden geven `400` terug.

Opmerkingen:

- `recommended` gebruikt betrokkenheids- en recentheidssignalen.
- `trending` rangschikt op installaties in de laatste 7 dagen (op telemetrie gebaseerd).
- `createdAt` is stabiel voor crawls van nieuwe Skills; `updated` verandert wanneer bestaande Skills opnieuw worden gepubliceerd.
- Wanneer `nonSuspiciousOnly=true`, kunnen cursorgebaseerde sorteringen minder dan `limit` items op een pagina teruggeven omdat verdachte Skills na het ophalen van de pagina worden gefilterd.
- Gebruik `nextCursor` om paginatie voort te zetten wanneer aanwezig. Een korte pagina betekent op zichzelf niet het einde van de resultaten.

Respons:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "topics": ["Productivity"],
      "tags": { "latest": "1.2.3" },
      "stats": {},
      "createdAt": 0,
      "updatedAt": 0,
      "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
      "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] }
    }
  ],
  "nextCursor": null
}
```

### `GET /api/v1/skills/{slug}`

Respons:

```json
{
  "skill": {
    "slug": "gifgrep",
    "displayName": "GifGrep",
    "summary": "…",
    "topics": ["Productivity"],
    "tags": { "latest": "1.2.3" },
    "stats": {},
    "createdAt": 0,
    "updatedAt": 0
  },
  "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
  "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] },
  "owner": { "handle": "steipete", "displayName": "Peter", "image": null },
  "moderation": {
    "isSuspicious": false,
    "isMalwareBlocked": false,
    "verdict": "clean",
    "reasonCodes": [],
    "summary": null,
    "engineVersion": "v2.0.0",
    "updatedAt": 0
  }
}
```

Opmerkingen:

- Oude slugs die zijn aangemaakt door owner-hernoemings-/mergeflows worden opgelost naar de canonieke Skill.
- `metadata.os`: OS-beperkingen gedeclareerd in Skill-frontmatter (bijv. `["macos"]`, `["linux"]`). `null` als niet gedeclareerd.
- `metadata.systems`: Nix-systeemdoelen (bijv. `["aarch64-darwin", "x86_64-linux"]`). `null` als niet gedeclareerd.
- `metadata` is `null` als de Skill geen platformmetadata heeft.
- `moderation` wordt alleen opgenomen wanneer de Skill is geflagd of de owner deze bekijkt.

### `GET /api/v1/skills/{slug}/moderation`

Geeft gestructureerde moderatiestatus terug.

Respons:

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Detected: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dynamic code execution detected.",
        "evidence": ""
      }
    ]
  }
}
```

Opmerkingen:

- Owners en moderators hebben toegang tot moderatiedetails voor verborgen Skills.
- Openbare callers krijgen alleen `200` voor al geflagde zichtbare Skills.
- Bewijs wordt geredigeerd voor openbare callers en bevat alleen ruwe snippets voor owners/moderators.

### `POST /api/v1/skills/{slug}/report`

Rapporteer een Skill voor beoordeling door moderators. Rapporten zijn op Skill-niveau, optioneel gekoppeld
aan een versie, en voeden de wachtrij voor Skill-rapporten.

Auth:

- Vereist een API-token.

Verzoek:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

Respons:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "reportId": "skillReports:...",
  "skillId": "skills:...",
  "reportCount": 1
}
```

### `GET /api/v1/skills/-/reports`

Moderator-/adminendpoint voor inname van Skill-rapporten.

Queryparameters:

- `status` (optioneel): `open` (standaard), `confirmed`, `dismissed`, of `all`
- `limit` (optioneel): geheel getal (1-200)
- `cursor` (optioneel): paginatiecursor

Respons:

```json
{
  "items": [
    {
      "reportId": "skillReports:...",
      "skillId": "skills:...",
      "skillVersionId": "skillVersions:...",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "version": "1.2.3",
      "reason": "Suspicious install step",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/skills/-/reports/{reportId}/triage`

Moderator-/adminendpoint voor het oplossen of heropenen van Skill-rapporten.

Verzoek:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` is vereist voor `confirmed` en `dismissed`; het mag worden weggelaten wanneer
`status` terug naar `open` wordt gezet. Geef `finalAction: "hide"` mee met een getriaged
rapport om de Skill in dezelfde auditeerbare workflow te verbergen.

### `GET /api/v1/skills/{slug}/versions`

Queryparameters:

- `limit` (optioneel): geheel getal
- `cursor` (optioneel): paginatiecursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Geeft versiemetadata + bestandenlijst terug.

- `version.security` bevat genormaliseerde verificatiestatus van de scan en scannerdetails
  (VirusTotal + LLM), wanneer beschikbaar.

### `GET /api/v1/skills/{slug}/scan`

Geeft verificatiedetails van de beveiligingsscan voor een Skill-versie terug.

Queryparameters:

- `version` (optioneel): specifieke versietekenreeks.
- `tag` (optioneel): los een getagde versie op (bijvoorbeeld `latest`).

Opmerkingen:

- Als noch `version` noch `tag` is opgegeven, wordt de nieuwste versie gebruikt.
- Bevat genormaliseerde verificatiestatus plus scannerspecifieke details.
- `security.hasScanResult` is alleen `true` wanneer een scanner een definitief oordeel heeft geproduceerd (`clean`, `suspicious` of `malicious`).
- `moderation` is een actuele moderatiesnapshot op skillniveau, afgeleid van de nieuwste versie.
- Controleer bij het opvragen van een historische versie `moderation.matchesRequestedVersion` en `moderation.sourceVersion` voordat u `moderation` en `security` als dezelfde versiecontext behandelt.

### `POST /api/v1/skills/-/scan`

Geauthenticeerd indieningsendpoint voor nieuwe ClawScan-taken.

Lokale uploadscans worden niet meer ondersteund. Verzoeken met
`multipart/form-data` of `{ "source": { "kind": "upload" } }` retourneren `410`.

Gepubliceerde scans gebruiken JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Opmerkingen:

- Payloads van scanverzoeken en downloadbare rapporten verlopen uit de opslag voor scanverzoeken na de retentieperiode.
- Gepubliceerde scans vereisen beheerstoegang als eigenaar/uitgever, of platformbevoegdheid als moderator/admin.
- Gepubliceerde scans schrijven alleen terug wanneer `update: true` en de scan succesvol is voltooid.
- Reactie is `202` met `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Scantaken zijn asynchroon. Handmatige scanverzoeken krijgen prioriteit boven normaal publicatie-/backfillwerk, maar voltooiing hangt nog steeds af van de beschikbaarheid van workers.

### `GET /api/v1/skills/-/scan/{scanId}`

Geauthenticeerd poll-endpoint voor een ingediende scan.

- Retourneert de status queued/running/succeeded/failed.
- Retourneert `queue.queuedAhead` en `queue.position` zolang de taak in de wachtrij staat, zodat clients kunnen tonen hoeveel geprioriteerde handmatige scans voor dit verzoek staan. Zeer grote wachtrijen worden begrensd en gerapporteerd met `queuedAheadIsEstimate: true`.
- Indien beschikbaar bevat `report` secties voor `clawscan`, `skillspector`, `staticAnalysis` en `virustotal`.
- Mislukte scantaken retourneren `status: "failed"` met `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Geauthenticeerd endpoint voor rapportarchieven.

- Vereist een geslaagde scan; niet-terminale scans retourneren `409`.
- Retourneert een ZIP met `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` en `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Geauthenticeerd endpoint voor opgeslagen rapportarchieven voor ingediende versies.

- Vereist beheerstoegang als eigenaar/uitgever tot de skill of Plugin, of platformbevoegdheid als moderator/admin.
- Retourneert opgeslagen scanresultaten voor de exacte ingediende versie, inclusief geblokkeerde of verborgen versies.
- `kind` staat standaard op `skill`; gebruik `kind=plugin` voor plugin-/pakketscans.
- Retourneert dezelfde ZIP-vorm als downloads van scanverzoeken.

### `POST /api/v1/skills/-/scan/batch`

Canonical batchrescanroute alleen voor admins. Deze accepteert dezelfde payloadvorm als de verouderde `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Canonical batchstatusroute alleen voor admins. Deze accepteert `{ "jobIds": ["..."] }` en retourneert dezelfde geaggregeerde tellers als de verouderde `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Retourneert de Skill Card-verificatie-envelop die wordt gebruikt door `clawhub skill verify`.

Queryparameters:

- `version` (optioneel): specifieke versietekenreeks.
- `tag` (optioneel): los een getagde versie op (bijvoorbeeld `latest`).

Opmerkingen:

- `ok` is alleen `true` wanneer de geselecteerde versie een gegenereerde Skill Card heeft, niet door moderatie als malware is geblokkeerd, en ClawScan-verificatie clean is.
- Skillidentiteit, uitgeversidentiteit en metadata van de geselecteerde versie zijn envelopvelden op topniveau (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), zodat shellautomatisering ze kan lezen zonder geneste wrappers uit te pakken.
- `security` is het ClawScan-/beveiligingsoordeel op topniveau. Automatisering moet zich baseren op `ok`, `decision`, `reasons` en `security.status`.
- `security.signals` bevat ondersteunend scannerbewijs zoals `staticScan`, `virusTotal` en `skillSpector`.
- `security.signals.dependencyRegistry` blijft behouden voor compatibiliteit met v1-reacties, maar de scanner voor het bestaan van dependency registry is buiten gebruik gesteld en deze sleutel is altijd `null`.
- `provenance` is alleen `server-resolved-github-import` wanneer ClawHub tijdens publicatie of import een GitHub-repo/ref/commit/pad heeft opgelost en opgeslagen; anders is dit `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Retourneert actuele compacte beveiligingsoordelen voor exacte skillversies. Dit
collectie-endpoint is bedoeld voor clients die al weten welke geïnstalleerde
ClawHub-skillversies ze moeten weergeven, zoals OpenClaw Control UI.

Verzoek:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Opmerkingen:

- `items` moet 1-100 unieke paren `{ slug, version }` bevatten.
- Resultaten zijn per item; één ontbrekende skill of versie laat niet de hele reactie mislukken.
- De reactie is alleen voor beveiliging. Deze bevat geen Skill Card-gegevens, gegenereerde kaartstatus, lijsten met artefactbestanden of gedetailleerde scannerpayloads.
- `security.signals` bevat alleen ondersteunend bewijs op statusniveau; gebruik `/scan` of de ClawHub-pagina voor security-audit voor volledige scannerdetails.
- `security.signals.dependencyRegistry` blijft behouden voor compatibiliteit met v1-reacties, maar de scanner voor het bestaan van dependency registry is buiten gebruik gesteld en deze sleutel is altijd `null`.
- Het ontbreken van een Skill Card heeft geen invloed op `ok`, `decision` of `reasons` van dit endpoint; clients moeten geïnstalleerde `skill-card.md` lokaal lezen wanneer ze kaartinhoud nodig hebben.
- Gebruik `/verify` wanneer u de Skill Card-verificatie-envelop voor één skill nodig hebt, `/card` wanneer u gegenereerde kaartmarkdown nodig hebt, en `/scan` wanneer u gedetailleerde scannergegevens nodig hebt.

Reactie:

```json
{
  "schema": "clawhub.skill.security-verdicts.v1",
  "items": [
    {
      "ok": true,
      "decision": "pass",
      "reasons": [],
      "requestedSlug": "gifgrep",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "publisherHandle": "steipete",
      "publisherDisplayName": "Peter",
      "requestedVersion": "1.2.3",
      "version": "1.2.3",
      "createdAt": 0,
      "checkedAt": 0,
      "skillUrl": "https://clawhub.ai/steipete/skills/gifgrep",
      "securityAuditUrl": "https://clawhub.ai/steipete/skills/gifgrep/security-audit?version=1.2.3",
      "security": {
        "status": "clean",
        "passed": true,
        "signals": {
          "staticScan": { "status": "clean", "reasonCodes": [] },
          "virusTotal": null,
          "skillSpector": null,
          "dependencyRegistry": null
        }
      }
    },
    {
      "ok": false,
      "decision": "fail",
      "reasons": ["version.not_found"],
      "requestedSlug": "missing-version",
      "requestedVersion": "1.0.0",
      "error": { "code": "version_not_found", "message": "Version not found" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

Retourneert ruwe tekstinhoud.

Queryparameters:

- `path` (vereist)
- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste versie.
- Bestandsgroottelimiet: 200KB.

### `GET /api/v1/packages`

Uniform cataloguseindpunt voor:

- skills
- code-plugins
- bundel-plugins

Queryparameters:

- `limit` (optioneel): geheel getal (1–100)
- `cursor` (optioneel): pagineringscursor
- `family` (optioneel): `skill`, `code-plugin` of `bundle-plugin`
- `channel` (optioneel): `official`, `community` of `private`
- `isOfficial` (optioneel): `true` of `false`
- `sort` (optioneel): `updated` (standaard), `recommended`, `trending`, `downloads`, verouderde alias `installs`
- `category` (optioneel): filter op plugincategorie. Alleen ondersteund wanneer de
  aanvraag is beperkt tot pluginpakketten (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, of pakketeindpunten met
  `family=code-plugin`/`family=bundle-plugin`). Beheerde categorieën en
  verouderde v1-filteraliassen zijn gedocumenteerd onder `GET /api/v1/plugins`.

Opmerkingen:

- Ongeldige waarden voor `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` of `sort` retourneren `400`. Onbekende queryparameters worden genegeerd.
- `GET /api/v1/code-plugins` en `GET /api/v1/bundle-plugins` blijven aliassen met een vaste familie.
- Skill-vermeldingen blijven ondersteund door het skill-register en kunnen nog steeds alleen via `POST /api/v1/skills` worden gepubliceerd.
- `POST /api/v1/packages` is nog steeds alleen voor releases van code-plugins en bundel-plugins.
- Anonieme aanroepers zien alleen openbare pakketkanalen.
- Geverifieerde aanroepers kunnen privé-pakketten zien voor uitgevers waartoe ze behoren in lijst-/zoekresultaten.
- `channel=private` retourneert alleen pakketten die de geverifieerde aanroeper kan lezen.

### `GET /api/v1/packages/search`

Uniform zoeken in de catalogus over skills + pluginpakketten.

Queryparameters:

- `q` (vereist): querytekenreeks
- `limit` (optioneel): geheel getal (1–100)
- `family` (optioneel): `skill`, `code-plugin` of `bundle-plugin`
- `channel` (optioneel): `official`, `community` of `private`
- `isOfficial` (optioneel): `true` of `false`
- `category` (optioneel): filter op plugincategorie. Alleen ondersteund wanneer de
  aanvraag is beperkt tot pluginpakketten. Beheerde categorieën en verouderde v1
  filteraliassen zijn gedocumenteerd onder `GET /api/v1/plugins`.

Opmerkingen:

- Ongeldige waarden voor `family`, `channel`, `isOfficial`, `featured` of
  `highlightedOnly` retourneren `400`. Onbekende queryparameters worden genegeerd.
- Anonieme aanroepers zien alleen openbare pakketkanalen.
- Geverifieerde aanroepers kunnen privé-pakketten doorzoeken voor uitgevers waartoe ze behoren.
- `channel=private` retourneert alleen pakketten die de geverifieerde aanroeper kan lezen.

### `GET /api/v1/plugins`

Alleen-Plugin catalogusweergave over code-plugin- en bundel-pluginpakketten.

Queryparameters:

- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): pagineringscursor
- `isOfficial` (optioneel): `true` of `false`
- `sort` (optioneel): `recommended` (standaard), `trending`, `downloads`, `updated`, verouderde alias `installs`
- `category` (optioneel): filter op plugincategorie. Huidige waarden:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Verouderde v1-filteraliassen blijven geaccepteerd op lees-eindpunten:

- `mcp-tooling`, `data` en `automation` worden opgelost naar `tools`.
- `observability` en `deployment` worden opgelost naar `gateway`.
- `dev-tools` wordt opgelost naar `runtime`.

`trending` is een ranglijst van installaties/downloads over zeven dagen en gebruikt geen totalen over de volledige tijd.
Op het uniforme eindpunt `/api/v1/packages` is dit alleen voor plugins; gebruik
`/api/v1/skills?sort=trending` voor de skill-catalogus.

Verouderde aliassen worden niet geaccepteerd als opgeslagen of door auteurs gedeclareerde categoriewaarden.

### `GET /api/v1/skills/export`

Bulkexport van nieuwste openbare skills voor offline analyse.

Auth:

- API-token vereist.

Queryparameters:

- `startDate` (vereist): ondergrens in Unix-milliseconden voor skill `updatedAt`.
- `endDate` (vereist): bovengrens in Unix-milliseconden voor skill `updatedAt`.
- `limit` (optioneel): geheel getal (1-250), standaard `250`.
- `cursor` (optioneel): pagineringscursor uit het vorige antwoord.

Antwoord:

- Body: ZIP-archief.
- Elke geëxporteerde skill heeft `{publisher}/{slug}/` als root.
- Gehoste skills bevatten de nieuwste opgeslagen versiebestanden en worden vermeld in
  `_manifest.json` met `sourceRef: "public-clawhub"`.
- Huidige GitHub-backed skills met een `clean`- of `suspicious`-scan bevatten
  `_source_handoff.json` met `sourceRef: "public-github"`, repo, commit, pad,
  inhoudshash en archief-URL. Ze bevatten geen door ClawHub gehoste bronbestanden.
- Elke skill bevat `_export_skill_meta.json`.
- `_manifest.json` wordt altijd opgenomen in de ZIP-root.
- `_errors.json` wordt opgenomen wanneer afzonderlijke skills of bestanden niet konden worden
  geëxporteerd.

Headers:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Bulkexport van de nieuwste openbare Plugin-releases voor offline analyse.

Authenticatie:

- API-token vereist.

Queryparameters:

- `startDate` (vereist): ondergrens in Unix-milliseconden voor Plugin `updatedAt`.
- `endDate` (vereist): bovengrens in Unix-milliseconden voor Plugin `updatedAt`.
- `limit` (optioneel): geheel getal (1-250), standaard `250`.
- `cursor` (optioneel): paginatiecursor uit de vorige respons.
- `family` (optioneel): `code-plugin` of `bundle-plugin`. Weglaten betekent beide
  Plugin-families.

Respons:

- Body: ZIP-archief.
- Elke geëxporteerde Plugin heeft als root `{family}/{packageName}/`.
- Elke geëxporteerde Plugin bevat de opgeslagen bestanden van de nieuwste release.
- Exportmetadata per Plugin wordt opgeslagen in
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` wordt altijd opgenomen in de ZIP-root.
- `_errors.json` wordt opgenomen wanneer afzonderlijke Plugins of bestanden niet konden worden
  geëxporteerd.

Headers:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Zoeken alleen voor Plugins in code-plugin- en bundle-plugin-pakketten.

Queryparameters:

- `q` (vereist): zoekreeks
- `limit` (optioneel): geheel getal (1-100)
- `isOfficial` (optioneel): `true` of `false`
- `category` (optioneel): Plugin-categoriefilter. Huidige waarden:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Opmerkingen:

- De verouderde v1-filteraliassen die zijn gedocumenteerd onder `GET /api/v1/plugins` worden ook
  geaccepteerd.
- Categoriefiltering is een echte API-filter, ondersteund door Plugin-categoriedigest-
  rijen, geen herschrijving van de zoekquery.
- Resultaten worden geretourneerd op relevantievolgorde en ondersteunen momenteel geen paginatie.
- Sorteerknoppen in de browser-UI voor Plugin-zoeken herschikken de geladen relevantieresultaten,
  passend bij het huidige browsegedrag van `/skills`.

### `GET /api/v1/packages/{name}`

Retourneert detailmetadata van het pakket.

Opmerkingen:

- Skills kunnen ook via deze route worden opgelost in de uniforme catalogus.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-uitgever kan lezen.

### `DELETE /api/v1/packages/{name}`

Verwijdert een pakket en alle releases via soft-delete.

Opmerkingen:

- Vereist een API-token voor de pakketeigenaar, een eigenaar/beheerder van de organisatie-uitgever,
  platformmoderator of platformbeheerder.

### `GET /api/v1/packages/{name}/versions`

Retourneert de versiegeschiedenis.

Queryparameters:

- `limit` (optioneel): geheel getal (1–100)
- `cursor` (optioneel): paginatiecursor

Opmerkingen:

- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-uitgever kan lezen.

### `GET /api/v1/packages/{name}/versions/{version}`

Retourneert één pakketversie, inclusief bestandsmetadata, compatibiliteit,
verificatie, artifactmetadata en scangegevens.

Opmerkingen:

- `version.artifact.kind` is `legacy-zip` voor pakketarchieven uit de oude wereld of
  `npm-pack` voor releases die door ClawPack worden ondersteund.
- ClawPack-releases bevatten npm-compatibele velden `npmIntegrity`, `npmShasum` en
  `npmTarballName`.
- `version.sha256hash` is verouderde compatibiliteitsmetadata voor oude clients. Het
  hasht de exacte ZIP-bytes die door `/api/v1/packages/{name}/download` worden geretourneerd.
  Moderne clients moeten `version.artifact.sha256` gebruiken, dat het
  canonieke release-artifact identificeert.
- `version.vtAnalysis`, `version.llmAnalysis` en `version.staticScan` worden
  opgenomen wanneer scangegevens bestaan.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-uitgever kan lezen.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Retourneert de exacte beveiligings- en vertrouwenssamenvatting van de pakketrelease voor installatie-
clients. Dit is het openbare OpenClaw-consumptieoppervlak om te bepalen of een
opgeloste release kan worden geïnstalleerd.

Authenticatie:

- Openbaar leesendpoint. Er is geen eigenaar-, uitgever-, moderator- of beheerders-token
  vereist.

Respons:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin"
  },
  "release": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "artifactSha256": "0123456789abcdef...",
    "npmIntegrity": "sha512-...",
    "npmShasum": "0123456789abcdef0123456789abcdef01234567",
    "npmTarballName": "example-plugin-1.2.3.tgz",
    "createdAt": 1730000000000
  },
  "trust": {
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious"],
    "pending": false,
    "stale": false
  }
}
```

Responsvelden:

- `package.name`, `package.displayName` en `package.family` identificeren het
  opgeloste registerpakket.
- `release.releaseId`, `release.version` en `release.createdAt` identificeren de
  exacte release die is geëvalueerd.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` en `release.npmTarballName` zijn aanwezig wanneer bekend voor
  het release-artifact.
- `trust.scanStatus` is de effectieve vertrouwensstatus, afgeleid van scannerinputs
  en handmatige releasemoderatie.
- `trust.moderationState` is nullable. Het is `null` wanneer er geen handmatige release-
  moderatie bestaat.
- `trust.blockedFromDownload` is het install-blokkeersignaal. OpenClaw en andere
  installatieclients moeten installatie blokkeren wanneer deze waarde `true` is, in plaats van
  blokkeerregels opnieuw af te leiden uit scanner- of moderatievelden.
- `trust.reasons` is de gebruikersgerichte en audit-uitleglijst. Redencodes
  zijn stabiele, compacte tekenreeksen zoals `manual:quarantined`, `scan:malicious`,
  en `package:malicious`.
- `trust.pending` betekent dat een of meer vertrouwensinputs nog wachten op voltooiing.
- `trust.stale` betekent dat de vertrouwenssamenvatting is berekend uit verouderde inputs en
  moet worden behandeld als iets dat een vernieuwing vereist vóór een toestemmingsbeslissing met hoge zekerheid.

Opmerkingen:

- Dit endpoint is versie-exact. Clients moeten het aanroepen nadat zij de
  pakketversie hebben opgelost die zij willen installeren, niet alleen na het lezen van de nieuwste
  pakketmetadata.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-uitgever kan lezen.
- Dit endpoint is opzettelijk smaller dan moderatie-endpoints voor eigenaars/moderators.
  Het maakt de installatiebeslissing en openbare uitleg zichtbaar, niet
  identiteiten van melders, meldingsinhoud, privébewijs of interne beoordelings-
  tijdlijnen.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Retourneert de expliciete artifactresolvermetadata voor een pakketversie.

Opmerkingen:

- Verouderde pakketversies retourneren een `legacy-zip`-artifact en een verouderde ZIP-
  `downloadUrl`.
- ClawPack-versies retourneren een `npm-pack`-artifact, npm-integriteitsvelden, een
  `tarballUrl` en de verouderde ZIP-compatibiliteits-URL.
- Dit is het OpenClaw-resolveroppervlak; het voorkomt dat het archiefformaat uit
  een gedeelde URL moet worden geraden.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Downloadt het versie-artifact via het expliciete resolverpad.

Opmerkingen:

- ClawPack-versies streamen de exacte geüploade npm-pack `.tgz`-bytes.
- Verouderde ZIP-versies verwijzen door naar `/api/v1/packages/{name}/download?version=`.
- Gebruikt de downloadsnelheidsbucket.

### `GET /api/v1/packages/{name}/readiness`

Retourneert berekende gereedheid voor toekomstige OpenClaw-consumptie.

Gereedheidscontroles omvatten:

- officiële-kanaalstatus
- beschikbaarheid van de nieuwste versie
- beschikbaarheid van ClawPack npm-pack-artifact
- artifactdigest
- herkomst van bronrepo en commit
- OpenClaw-compatibiliteitsmetadata
- hostdoelen
- scanstatus

Respons:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack artifact",
      "status": "fail",
      "message": "Latest version is legacy ZIP-only."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

Moderatorendpoint voor het weergeven van officiële OpenClaw Plugin-migratierijen.

Authenticatie:

- Vereist een API-token voor een moderator of beheerder.

Queryparameters:

- `phase` (optioneel): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw`, of
  `all` (standaard).
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): paginatiecursor

Respons:

```json
{
  "items": [
    {
      "migrationId": "officialPluginMigrations:...",
      "bundledPluginId": "core.search",
      "packageName": "@openclaw/search-plugin",
      "packageId": "packages:...",
      "owner": "platform",
      "sourceRepo": "openclaw/openclaw",
      "sourcePath": "plugins/search",
      "sourceCommit": "abc123",
      "phase": "blocked",
      "blockers": ["missing ClawPack"],
      "hostTargetsComplete": true,
      "scanClean": false,
      "moderationApproved": false,
      "runtimeBundlesReady": false,
      "notes": null,
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/migrations`

Beheerdersendpoint voor het maken of bijwerken van een officiële Plugin-migratierij.

Authenticatie:

- Vereist een API-token voor een beheerder.

Requestbody:

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["missing ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "waiting on publisher upload"
}
```

Opmerkingen:

- `bundledPluginId` wordt genormaliseerd naar kleine letters en is de stabiele upsert-sleutel.
- `packageName` wordt als npm-naam genormaliseerd; het pakket kan ontbreken voor geplande
  migraties.
- Dit houdt alleen migratiegereedheid bij. Het wijzigt OpenClaw niet en genereert
  geen ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Moderator-/beheerdersendpoint voor beoordelingswachtrijen van pakketreleases.

Authenticatie:

- Vereist een API-token voor een moderator of beheerder.

Queryparameters:

- `status` (optioneel): `open` (standaard), `blocked`, `manual`, of `all`
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): paginatiecursor

Betekenissen van statussen:

- `open`: verdachte, schadelijke, in behandeling zijnde, in quarantaine geplaatste, ingetrokken of gemelde releases.
- `blocked`: in quarantaine geplaatste, ingetrokken of schadelijke releases.
- `manual`: elke release met een handmatige moderatie-override.
- `all`: elke release met een handmatige override, niet-schone scanstatus of pakketmelding.

Respons:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "manual review",
      "sourceRepo": "openclaw/example-plugin",
      "sourceCommit": "abc123",
      "reportCount": 2,
      "lastReportedAt": 1730000001000,
      "reasons": ["manual:quarantined", "scan:malicious", "reports:2"]
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/{name}/report`

Meld een pakket voor beoordeling door moderators. Meldingen zijn op pakketniveau en optioneel
gekoppeld aan een versie. Ze voeden de moderatiewachtrij, maar verbergen niet automatisch en
blokkeren op zichzelf geen downloads; moderators moeten releasemoderatie gebruiken om
artifacts goed te keuren, in quarantaine te plaatsen of in te trekken.

Authenticatie:

- Vereist een API-token.

Request:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

Respons:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "reportCount": 1
}
```

### `GET /api/v1/packages/reports`

Moderator-/admin-eindpunt voor het innemen van pakketmeldingen.

Authenticatie:

- Vereist een API-token voor een moderator- of admingebruiker.

Queryparameters:

- `status` (optioneel): `open` (standaard), `confirmed`, `dismissed` of `all`
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): paginatiecursor

Respons:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Suspicious native binary",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `GET /api/v1/packages/{name}/moderation`

Eigenaar-/moderator-eindpunt voor zichtbaarheid van pakketmoderatie.

Authenticatie:

- Vereist een API-token voor de pakketeigenaar, een uitgeverslid, moderator of
  admingebruiker.

Respons:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "channel": "community",
    "isOfficial": false,
    "reportCount": 2,
    "lastReportedAt": 1730000001000,
    "scanStatus": "malicious"
  },
  "latestRelease": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "moderationReason": "manual review",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

Moderator-/admin-eindpunt voor het oplossen of heropenen van pakketmeldingen.

Verzoek:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` is verplicht voor `confirmed` en `dismissed`; dit mag worden weggelaten wanneer
`status` terug op `open` wordt gezet. Geef `finalAction: "quarantine"` of
`finalAction: "revoke"` mee met een bevestigde melding om releasemoderatie toe te passen in dezelfde
controleerbare workflow.

Respons:

```json
{
  "ok": true,
  "reportId": "packageReports:...",
  "packageId": "packages:...",
  "status": "confirmed",
  "reportCount": 0
}
```

### `POST /api/v1/packages/{name}/versions/{version}/moderation`

Moderator-/admin-eindpunt voor beoordeling van pakketreleases.

Verzoek:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Ondersteunde statussen:

- `approved`: handmatig beoordeeld en toegestaan.
- `quarantined`: geblokkeerd in afwachting van opvolging.
- `revoked`: geblokkeerd nadat een release eerder werd vertrouwd.

In quarantaine geplaatste en ingetrokken releases retourneren `403` vanuit artifact-downloadroutes.
Elke wijziging schrijft een auditlogitem.

### `GET /api/v1/packages/{name}/file`

Retourneert ruwe tekstinhoud voor een pakketbestand.

Queryparameters:

- `path` (verplicht)
- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste release.
- Gebruikt de leeslimietbucket, niet de downloadbucket.
- Binaire bestanden retourneren `415`.
- Maximale bestandsgrootte: 200KB.
- In behandeling zijnde VirusTotal-scans blokkeren leesacties niet; kwaadaardige releases kunnen elders nog worden ingehouden.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-uitgever kan lezen.

### `GET /api/v1/packages/{name}/download`

Downloadt het verouderde deterministische ZIP-archief voor een pakketrelease.

Queryparameters:

- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste release.
- Skills verwijzen door naar `GET /api/v1/download`.
- Plugin-/pakketarchieven zijn zipbestanden met een `package/`-root zodat oude OpenClaw
  clients blijven werken.
- Deze route blijft alleen ZIP. Deze streamt geen ClawPack `.tgz`-bestanden.
- Responsen bevatten `ETag`-, `Digest`-, `X-ClawHub-Artifact-Type`- en
  `X-ClawHub-Artifact-Sha256`-headers voor integriteitscontroles door resolvers.
- Metadata die alleen in het register staat, wordt niet in het gedownloade archief geïnjecteerd.
- In behandeling zijnde VirusTotal-scans blokkeren downloads niet; kwaadaardige releases retourneren `403`.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar is.

### `GET /api/npm/{package}`

Retourneert een npm-compatibele packument voor pakketversies die door ClawPack worden ondersteund.

Opmerkingen:

- Alleen versies met geüploade ClawPack npm-pack-tarballs worden vermeld.
- Verouderde versies met alleen ZIP worden bewust weggelaten.
- `dist.tarball`, `dist.integrity` en `dist.shasum` gebruiken npm-compatibele
  velden zodat gebruikers npm naar de mirror kunnen laten verwijzen als ze dat willen.
- Packuments voor scoped packages ondersteunen zowel `/api/npm/@scope/name` als npm's
  gecodeerde aanvraagpad `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Streamt de exacte geüploade ClawPack-tarballbytes voor npm-mirrorclients.

Opmerkingen:

- Gebruikt de downloadlimietbucket.
- Downloadheaders bevatten ClawHub SHA-256 plus npm-integrity-/shasum-metadata.
- Moderatie en toegangscontroles voor privépakketten blijven van toepassing.

### `GET /api/v1/resolve`

Wordt door de CLI gebruikt om een lokale fingerprint aan een bekende versie te koppelen.

Queryparameters:

- `slug` (verplicht)
- `hash` (verplicht): 64-tekens lange hex sha256 van de bundle-fingerprint

Respons:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Downloadt een gehoste Skill-versie als ZIP, of retourneert een GitHub-bronoverdracht voor een
huidige door GitHub ondersteunde Skill met een `clean`- of `suspicious`-scan en zonder gehoste
versie.

Queryparameters:

- `slug` (verplicht)
- `version` (optioneel): semver-string
- `tag` (optioneel): tagnaam (bijv. `latest`)

Opmerkingen:

- Als noch `version` noch `tag` is opgegeven, wordt de nieuwste versie gebruikt.
- Zacht verwijderde versies retourneren `410`.
- Door GitHub ondersteunde Skill-overdrachten proxyen of mirroren geen bytes. De JSON-respons
  bevat `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  en `archiveUrl`; scan-/huidige status is een gate en wordt niet opgenomen als metadata van een succesvolle
  payload.
- Downloadstatistieken worden geteld als unieke identiteiten per UTC-dag (`userId` wanneer het API-token geldig is, anders IP).

## Authenticatie-eindpunten (Bearer-token)

Alle eindpunten vereisen:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Valideert het token en retourneert de gebruikershandle.

### `POST /api/v1/skills`

Publiceert een nieuwe versie.

- Voorkeur: `multipart/form-data` met `payload` JSON + `files[]` blobs.
- JSON-body met `files` (op basis van storageId) wordt ook geaccepteerd.
- Optioneel payloadveld: `ownerHandle`. Wanneer aanwezig, lost de API die
  uitgever server-side op en vereist dat de actor uitgeverstoegang heeft.
- Optioneel payloadveld: `migrateOwner`. Wanneer `true` met `ownerHandle`, mag een
  bestaande Skill naar die eigenaar verhuizen als de actor admin/eigenaar is bij zowel
  de huidige als de doeluitgever. Zonder deze opt-in worden eigenaarswijzigingen
  geweigerd.

### `POST /api/v1/packages`

Publiceert een code-plugin- of bundle-plugin-release.

- Vereist Bearer-tokenauthenticatie.
- Vereist `multipart/form-data`.
- Toegestane formuliervelden zijn `payload`, herhaalde `files`-blobs, of één `clawpack`
  tarballreferentie. `clawpack` mag een `.tgz`-blob zijn of een storage-id die wordt geretourneerd door
  de upload-url-flow. Publicaties met staged storage-id moeten ook het
  `clawpackUploadTicket` bevatten dat met die upload-URL is geretourneerd.
- Gebruik ofwel `files` of `clawpack`, nooit beide in hetzelfde verzoek.
- JSON-bodies en door de aanroeper aangeleverde `payload.files` / `payload.artifact`-
  metadata worden geweigerd.
- Directe multipart-publicatieverzoeken zijn begrensd op 18MB. ClawPack-tarballs mogen
  de upload-url-flow gebruiken tot de tarballlimiet van 120MB.
- Optioneel payloadveld: `ownerHandle`. Wanneer aanwezig, mogen alleen admins namens die eigenaar publiceren.

Validatiepunten:

- `family` moet `code-plugin` of `bundle-plugin` zijn.
- Plugin-pakketten vereisen `openclaw.plugin.json`. ClawPack `.tgz`-uploads moeten
  dit bevatten op `package/openclaw.plugin.json`.
- Code-plugins vereisen `package.json`, metadata van de bronrepo, metadata van de broncommit,
  metadata van het configschema, `openclaw.compat.pluginApi` en
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` en `openclaw.environment` zijn optionele metadata.
- Alleen de `openclaw`-org-uitgever en persoonlijke uitgevers van huidige leden van de `openclaw`-org
  mogen naar het kanaal `official` publiceren.
- Publicaties namens een ander valideren nog steeds of het doel-eigenaarsaccount in aanmerking komt voor het officiële kanaal.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Zacht verwijderen / herstellen van een Skill (eigenaar, moderator of admin).

Optionele JSON-body:

```json
{ "reason": "Held for moderation pending legal review." }
```

Wanneer aanwezig, wordt `reason` opgeslagen als moderatienotitie van de Skill en gekopieerd naar het auditlog.
Door de eigenaar geïnitieerde zachte verwijderingen reserveren de slug 30 dagen; daarna kan de slug worden geclaimd door
een andere uitgever. De delete-respons bevat `slugReservedUntil` wanneer deze vervaldatum van toepassing is.
Verbergacties door moderator/admin en beveiligingsverwijderingen verlopen niet op deze manier.

Delete-respons:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Statuscodes:

- `200`: ok
- `401`: niet geautoriseerd
- `403`: verboden
- `404`: Skill/gebruiker niet gevonden
- `500`: interne serverfout

### `POST /api/v1/users/publisher`

Alleen voor admins. Zorgt dat er een org-uitgever bestaat voor een handle. Als de handle nog naar een
verouderde gedeelde gebruiker/persoonlijke uitgever wijst, migreert het eindpunt deze eerst naar een org-uitgever.
Geef voor een nieuw aangemaakte org `memberHandle` op; de handelende admin wordt niet als lid toegevoegd.
`memberRole` is standaard `owner`.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Respons: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Geauthenticeerde selfservice-aanmaak van org-uitgevers. Maakt een nieuwe org-uitgever aan en voegt de
aanroeper toe als eigenaar. Dit eindpunt migreert geen bestaande gebruikers-/persoonlijke handles en markeert
de uitgever niet als vertrouwd/officieel.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Respons: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Retourneert `409` wanneer de handle al wordt gebruikt door een uitgever, gebruiker of persoonlijke uitgever.

### `POST /api/v1/users/reserve`

Alleen voor admins. Reserveert root-slugs en pakketnamen voor een rechtmatige eigenaar zonder een
release te publiceren. Pakketnamen worden private placeholder-pakketten zonder releaserijen, zodat dezelfde
eigenaar later de echte code-plugin- of bundle-plugin-release naar die naam kan publiceren.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Respons: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Alleen voor admins. Herstelt een persoonlijke uitgever voor een geverifieerde vervangende GitHub OAuth-principal
zonder Convex Auth-accountregels te bewerken. Het verzoek moet beide onveranderlijke GitHub
provideraccount-id's noemen; wijzigbare handles worden alleen gebruikt als operatorgerichte beveiliging.

Het endpoint gebruikt standaard een proefuitvoering. Herstel toepassen vereist `dryRun: false` en
`confirmIdentityVerified: true` nadat medewerkers onafhankelijk de continuiteit tussen beide
GitHub-principals hebben geverifieerd. Herstel faalt gesloten wanneer de huidige persoonlijke
publisher van de doelgebruiker skills, pakketten of GitHub-skillbronnen heeft.
Herstel migreert ook verouderde `ownerUserId`-velden voor de skills van de herstelde publisher,
skill-slugaliassen, pakketten, waarschuwingen van de pakketinspecteur en afgeleide zoekdigest-rijen, zodat
paden met directe eigenaar overeenkomen met de nieuwe publisher-autoriteit. Een actieve reservering voor een beschermde handle
voor de herstelde handle wordt ook opnieuw toegewezen aan de vervangende gebruiker, zodat latere
profielsynchronisatie de concurrerende autoriteit van de vorige gebruiker niet kan herstellen. Elke primaire tabel is begrensd op
100 rijen per toepassings-transactie; grotere herstelacties moeten eerst een hervatbare eigenaarsmigratie gebruiken.
GitHub-skillbronnen zijn publisher-gescopeerd en worden gerapporteerd als gecontroleerd in plaats van herschreven.

- Body: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Antwoord: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Endpoints voor eigenaar-slugbeheer

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Antwoord: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Antwoord: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Opmerkingen:

- Beide endpoints vereisen authenticatie met een API-token en werken alleen voor de eigenaar van de skill.
- `rename` behoudt de vorige slug als redirect-alias.
- `merge` verbergt de bronvermelding en verwijst de bronslug door naar de doelvermelding.

### Endpoints voor eigendomsoverdracht

- `POST /api/v1/skills/{slug}/transfer`
  - Body: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Antwoord: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Antwoord (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Antwoordvorm: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Verban een gebruiker en verwijder eigen skills definitief (alleen moderator/admin).

Body:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

of

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Antwoord:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Hef een gebruikersverbanning op en herstel in aanmerking komende skills (alleen admin).

Body:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

of

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Antwoord:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Wijzig de opgeslagen reden voor een bestaande verbanning zonder de verbanning op te heffen of
content te herstellen (alleen admin). Gebruikt standaard een proefuitvoering tenzij `dryRun` `false` is.

Body:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

of

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

Antwoord:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "malware auto-ban",
  "nextReason": "bulk publishing spam",
  "changed": true
}
```

### `POST /api/v1/users/role`

Wijzig een gebruikersrol (alleen admin).

Body:

```json
{ "handle": "user_handle", "role": "moderator" }
```

of

```json
{ "userId": "users_...", "role": "admin" }
```

Antwoord:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Geef gebruikers weer of zoek gebruikers (alleen admin).

Queryparameters:

- `q` (optioneel): zoekquery
- `query` (optioneel): alias voor `q`
- `limit` (optioneel): maximaal aantal resultaten (standaard 20, max. 200)

Antwoord:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "User",
      "name": "User",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

Voeg een ster toe of verwijder een ster (highlights). Beide endpoints zijn idempotent.

Antwoorden:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Verouderde CLI-endpoints (afgeschaft)

Nog steeds ondersteund voor oudere CLI-versies:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Zie `DEPRECATIONS.md` voor het verwijderingsplan.

`POST /api/cli/upload-url` retourneert `uploadUrl` en `uploadTicket`. Pakketpublicaties
die in deze fase een ClawPack-tarball klaarzetten, moeten de resulterende opslag-id verzenden als
`clawpack` en het geretourneerde ticket als `clawpackUploadTicket`.

## Registry-discovery (`/.well-known/clawhub.json`)

De CLI kan registry-/auth-instellingen op de site ontdekken:

- `/.well-known/clawhub.json` (JSON, voorkeur)
- `/.well-known/clawdhub.json` (verouderd)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Als je zelf host, serveer dit bestand (of stel `CLAWHUB_REGISTRY` expliciet in; verouderd `CLAWDHUB_REGISTRY`).
