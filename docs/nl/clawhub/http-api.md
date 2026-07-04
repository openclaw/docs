---
read_when:
    - Endpoints toevoegen/wijzigen
    - CLI ↔ registeraanvragen debuggen
summary: HTTP API-referentie (openbare + CLI-eindpunten + authenticatie).
x-i18n:
    generated_at: "2026-07-04T15:23:35Z"
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

Mappen van derden mogen de openbare lees-eindpunten gebruiken om ClawHub-skills weer te geven of te doorzoeken. Cache de resultaten, respecteer `429`/`Retry-After`, link gebruikers terug naar de canonieke ClawHub-vermelding (`https://clawhub.ai/<owner>/skills/<slug>`) en vermijd de indruk dat ClawHub de site van derden onderschrijft. Probeer geen verborgen, privé- of door moderatie geblokkeerde inhoud buiten het openbare API-oppervlak te spiegelen.

Web-slug-snelkoppelingen worden over registerfamilies heen opgelost, maar API-clients moeten
de canonieke URL's gebruiken die door lees-eindpunten worden teruggegeven in plaats van route-
voorrang te reconstrueren.

## Snelheidslimieten

Handhavingsmodel:

- Anonieme aanvragen: gehandhaafd per IP.
- Geauthenticeerde aanvragen (geldig Bearer-token): gehandhaafd per gebruikersbucket.
- Als het token ontbreekt/ongeldig is, valt het gedrag terug op IP-handhaving.
- Geauthenticeerde schrijf-eindpunten mogen geen kale `Unauthorized` teruggeven wanneer
  de server de reden kent. Ontbrekende tokens, ongeldige/ingetrokken tokens en
  verwijderde/gebande/uitgeschakelde accounts moeten elk bruikbare tekst krijgen zodat CLI-
  clients gebruikers kunnen vertellen wat hen blokkeerde.

- Lezen: 3000/min per IP, 12000/min per sleutel
- Schrijven: 300/min per IP, 3000/min per sleutel
- Downloaden: 1200/min per IP, 6000/min per sleutel (download-eindpunten)

Headers:

- Verouderde compatibiliteit: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Gestandaardiseerd: `RateLimit-Limit`, `RateLimit-Reset`
- Bij `429`: `X-RateLimit-Remaining: 0` en `RateLimit-Remaining: 0`
- Bij `429`: `Retry-After`

Headersemantiek:

- `X-RateLimit-Reset`: absolute Unix-epochseconden
- `RateLimit-Reset`: seconden tot reset (vertraging)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: exact resterend budget indien aanwezig.
  Geslaagde gesharde aanvragen laten deze header weg in plaats van een benaderde globale waarde terug te geven.
- `Retry-After`: seconden wachten vóór opnieuw proberen (vertraging) bij `429`

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
- Als `Retry-After` ontbreekt, val dan terug op `RateLimit-Reset` (of bereken dit op basis van `X-RateLimit-Reset`).

IP-bron:

- Gebruikt vertrouwde client-IP-headers, waaronder `cf-connecting-ip`, alleen wanneer de
  implementatie vertrouwde doorgestuurde headers expliciet inschakelt.
- ClawHub gebruikt vertrouwde forwarding-headers om client-IP's aan de edge te identificeren.
- Als er geen vertrouwd client-IP beschikbaar is, gebruiken anonieme aanvragen fallback-buckets
  die alleen zijn afgebakend per soort snelheidslimiet. Deze fallback-buckets bevatten geen
  door de aanroeper aangeleverde paden, slugs, pakketnamen, versies, querystrings of andere
  artefactparameters.

## Foutresponsen

Openbare v1-foutresponsen zijn platte tekst met `content-type: text/plain; charset=utf-8`.
Dit omvat validatiefouten (`400`), ontbrekende openbare resources (`404`), auth- en
machtigingsfouten (`401`/`403`), snelheidslimieten (`429`) en geblokkeerde downloads. Clients
moeten de responsbody lezen als een voor mensen leesbare tekenreeks. Onbekende queryparameters worden
genegeerd voor compatibiliteit, maar herkende queryparameters met ongeldige waarden retourneren
`400`.

## Openbare eindpunten (geen auth)

### `GET /api/v1/search`

Queryparameters:

- `q` (vereist): querytekenreeks
- `limit` (optioneel): integer
- `highlightedOnly` (optioneel): `true` om te filteren op uitgelichte skills
- `nonSuspiciousOnly` (optioneel): `true` om verdachte (`flagged.suspicious`) skills te verbergen
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

- Resultaten worden teruggegeven in relevantievolgorde (embedding-overeenkomst + exacte slug-/naamtoken-boosts + een kleine populariteitsprior).
- Relevantie is sterker dan populariteit. Een precieze slug- of weergavenaamtoken-match kan hoger scoren dan een lossere match met veel sterkere betrokkenheid.
- ASCII-tekst wordt getokeniseerd op woord- en interpunctiegrenzen. Bijvoorbeeld: `personal-map` bevat een zelfstandig `map`-token, terwijl `amap-jsapi-skill` `amap`, `jsapi` en `skill` bevat; zoeken naar `map` geeft `personal-map` daarom een sterkere lexicale match dan `amap-jsapi-skill`.
- Populariteit is logaritmisch geschaald en afgetopt. Skills met hoge betrokkenheid kunnen lager scoren wanneer de querytekst een zwakkere match is.
- Verdachte of verborgen moderatiestatus kan een skill uit openbare zoekresultaten verwijderen, afhankelijk van aanroeperfilters en huidige moderatiestatus.

Richtlijnen voor vindbaarheid door publishers:

- Zet de termen waar gebruikers letterlijk naar zullen zoeken in de weergavenaam, samenvatting en tags. Gebruik alleen een zelfstandig slug-token wanneer dit ook een stabiele identiteit is die je wilt behouden.
- Hernoem een slug niet alleen om één query na te jagen, tenzij de nieuwe slug een betere canonieke naam voor de lange termijn is. Oude slugs worden redirect-aliassen, maar de canonieke URL, weergegeven slug en toekomstige zoekdigests gebruiken de nieuwe slug.
- Hernoemingsaliassen behouden resolutie voor oude URL's en installaties die via het register worden opgelost, maar zoekranking is gebaseerd op de canonieke skillmetadata nadat de hernoeming is geïndexeerd. Bestaande statistieken blijven bij de skill.
- Als een skill onverwacht onzichtbaar is, controleer dan eerst de moderatiestatus met `clawhub inspect @owner/slug` terwijl je bent ingelogd, voordat je rankinggerelateerde metadata wijzigt.

### `GET /api/v1/skills`

Queryparameters:

- `limit` (optioneel): integer (1–200)
- `cursor` (optioneel): pagineringscursor voor elke niet-`trending`-sortering
- `sort` (optioneel): `updated` (standaard), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), verouderde installatie-aliassen `installsCurrent`/`installs`/`installsAllTime` verwijzen naar `downloads`, `trending`
- `nonSuspiciousOnly` (optioneel): `true` om verdachte (`flagged.suspicious`) skills te verbergen
- `nonSuspicious` (optioneel): verouderde alias voor `nonSuspiciousOnly`

Ongeldige `sort`-waarden retourneren `400`.

Opmerkingen:

- `recommended` gebruikt signalen voor betrokkenheid en recentheid.
- `trending` rangschikt op installaties in de afgelopen 7 dagen (op basis van telemetrie).
- `createdAt` is stabiel voor crawls van nieuwe skills; `updated` verandert wanneer bestaande skills opnieuw worden gepubliceerd.
- Wanneer `nonSuspiciousOnly=true`, kunnen cursorgebaseerde sorteringen minder dan `limit` items op een pagina retourneren omdat verdachte skills na het ophalen van de pagina worden gefilterd.
- Gebruik `nextCursor` om paginering voort te zetten wanneer aanwezig. Een korte pagina betekent op zichzelf niet dat het einde van de resultaten is bereikt.

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

- Oude slugs die zijn aangemaakt door hernoem-/samenvoegflows van eigenaren worden opgelost naar de canonieke skill.
- `metadata.os`: OS-beperkingen die in de frontmatter van de skill zijn gedeclareerd (bijv. `["macos"]`, `["linux"]`). `null` als niet gedeclareerd.
- `metadata.systems`: Nix-systeemdoelen (bijv. `["aarch64-darwin", "x86_64-linux"]`). `null` als niet gedeclareerd.
- `metadata` is `null` als de skill geen platformmetadata heeft.
- `moderation` wordt alleen opgenomen wanneer de skill is gemarkeerd of de eigenaar deze bekijkt.

### `GET /api/v1/skills/{slug}/moderation`

Retourneert gestructureerde moderatiestatus.

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

- Eigenaren en moderators hebben toegang tot moderatiedetails voor verborgen skills.
- Openbare aanroepers krijgen alleen `200` voor reeds gemarkeerde zichtbare skills.
- Bewijs wordt geredigeerd voor openbare aanroepers en bevat alleen ruwe fragmenten voor eigenaren/moderators.

### `POST /api/v1/skills/{slug}/report`

Rapporteer een skill voor beoordeling door een moderator. Rapporten zijn op skillniveau, optioneel gekoppeld
aan een versie, en voeden de rapportwachtrij voor skills.

Auth:

- Vereist een API-token.

Aanvraag:

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

Moderator-/admin-eindpunt voor inname van skillrapporten.

Queryparameters:

- `status` (optioneel): `open` (standaard), `confirmed`, `dismissed` of `all`
- `limit` (optioneel): integer (1-200)
- `cursor` (optioneel): pagineringscursor

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

Moderator-/admin-eindpunt voor het oplossen of heropenen van skillrapporten.

Aanvraag:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` is vereist voor `confirmed` en `dismissed`; het mag worden weggelaten wanneer
`status` terug naar `open` wordt gezet. Geef `finalAction: "hide"` mee met een getriageerd
rapport om de skill in dezelfde controleerbare workflow te verbergen.

### `GET /api/v1/skills/{slug}/versions`

Queryparameters:

- `limit` (optioneel): integer
- `cursor` (optioneel): pagineringscursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Retourneert versiemetadata + bestandenlijst.

- `version.security` bevat genormaliseerde verificatiestatus van scans en scannerdetails
  (VirusTotal + LLM), indien beschikbaar.

### `GET /api/v1/skills/{slug}/scan`

Retourneert verificatiedetails van de beveiligingsscan voor een skillversie.

Queryparameters:

- `version` (optioneel): specifieke versietekenreeks.
- `tag` (optioneel): los een getagde versie op (bijvoorbeeld `latest`).

Opmerkingen:

- Als noch `version` noch `tag` is opgegeven, wordt de nieuwste versie gebruikt.
- Bevat genormaliseerde verificatiestatus plus scannerspecifieke details.
- `security.hasScanResult` is alleen `true` wanneer een scanner een definitief oordeel heeft opgeleverd (`clean`, `suspicious` of `malicious`).
- `moderation` is een actuele moderatiesnapshot op vaardigheidsniveau, afgeleid van de nieuwste versie.
- Controleer bij het opvragen van een historische versie `moderation.matchesRequestedVersion` en `moderation.sourceVersion` voordat je `moderation` en `security` als dezelfde versiecontext behandelt.

### `POST /api/v1/skills/-/scan`

Geauthenticeerd indieneindpunt voor nieuwe ClawScan-taken.

Scans van lokale uploads worden niet meer ondersteund. Verzoeken met
`multipart/form-data` of `{ "source": { "kind": "upload" } }` retourneren `410`.

Gepubliceerde scans gebruiken JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Opmerkingen:

- Scanverzoekpayloads en downloadbare rapporten verlopen uit de scanverzoekopslag na de bewaartermijn.
- Gepubliceerde scans vereisen beheerstoegang als eigenaar/uitgever, of moderator-/beheerdersrechten op platformniveau.
- Gepubliceerde scans schrijven alleen terug wanneer `update: true` en de scan succesvol is voltooid.
- Het antwoord is `202` met `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Scantaken zijn asynchroon. Handmatige scanverzoeken krijgen voorrang boven normale publicatie-/aanvulwerkzaamheden, maar voltooiing hangt nog steeds af van de beschikbaarheid van workers.

### `GET /api/v1/skills/-/scan/{scanId}`

Geauthenticeerd polling-eindpunt voor een ingediende scan.

- Retourneert status queued/running/succeeded/failed.
- Retourneert `queue.queuedAhead` en `queue.position` terwijl het verzoek in de wachtrij staat, zodat clients kunnen tonen hoeveel geprioriteerde handmatige scans vóór het verzoek staan. Zeer grote wachtrijen worden begrensd en gerapporteerd met `queuedAheadIsEstimate: true`.
- Wanneer beschikbaar bevat `report` secties voor `clawscan`, `skillspector`, `staticAnalysis` en `virustotal`.
- Mislukte scantaken retourneren `status: "failed"` met `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Geauthenticeerd eindpunt voor rapportarchieven.

- Vereist een geslaagde scan; niet-terminale scans retourneren `409`.
- Retourneert een ZIP met `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` en `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Geauthenticeerd eindpunt voor opgeslagen rapportarchieven voor ingediende versies.

- Vereist beheerstoegang als eigenaar/uitgever tot de skill of plugin, of moderator-/beheerdersrechten op platformniveau.
- Retourneert opgeslagen scanresultaten voor de exact ingediende versie, inclusief geblokkeerde of verborgen versies.
- `kind` gebruikt standaard `skill`; gebruik `kind=plugin` voor plugin-/pakketscans.
- Retourneert dezelfde ZIP-vorm als downloads van scanverzoeken.

### `POST /api/v1/skills/-/scan/batch`

Canonieke batchroute voor opnieuw scannen, alleen voor beheerders. Deze accepteert dezelfde payloadvorm als de verouderde `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Canonieke batchstatusroute, alleen voor beheerders. Deze accepteert `{ "jobIds": ["..."] }` en retourneert dezelfde geaggregeerde tellers als de verouderde `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Retourneert de verificatie-envelop van de Skill Card die wordt gebruikt door `clawhub skill verify`.

Queryparameters:

- `version` (optioneel): specifieke versietekenreeks.
- `tag` (optioneel): herleid een getagde versie (bijvoorbeeld `latest`).

Opmerkingen:

- `ok` is alleen `true` wanneer de geselecteerde versie een gegenereerde Skill Card heeft, niet door moderatie als malware is geblokkeerd, en ClawScan-verificatie schoon is.
- Skill-identiteit, uitgeversidentiteit en metadata van de geselecteerde versie zijn envelopvelden op het hoogste niveau (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), zodat shellautomatisering ze kan lezen zonder geneste wrappers uit te pakken.
- `security` is het ClawScan-/beveiligingsoordeel op het hoogste niveau. Automatisering moet zich baseren op `ok`, `decision`, `reasons` en `security.status`.
- `security.signals` bevat ondersteunend scannerbewijs zoals `staticScan`, `virusTotal` en `skillSpector`.
- `security.signals.dependencyRegistry` blijft behouden voor compatibiliteit met v1-antwoorden, maar de scanner voor het bestaan van het afhankelijkhedenregister is buiten gebruik gesteld en deze sleutel is altijd `null`.
- `provenance` is alleen `server-resolved-github-import` wanneer ClawHub tijdens publicatie of import een GitHub-repo/ref/commit/pad heeft herleid en opgeslagen; anders is deze `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Retourneert actuele compacte beveiligingsoordelen voor exacte skillversies. Dit
collectie-eindpunt is bedoeld voor clients die al weten welke geïnstalleerde
ClawHub-skillversies ze moeten weergeven, zoals OpenClaw Control UI.

Verzoek:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Opmerkingen:

- `items` moet 1-100 unieke `{ slug, version }`-paren bevatten.
- Resultaten zijn per item; één ontbrekende skill of versie laat niet het hele antwoord mislukken.
- Het antwoord is alleen beveiligingsgericht. Het bevat geen Skill Card-gegevens, gegenereerde kaartstatus, lijsten met artefactbestanden of gedetailleerde scannerpayloads.
- `security.signals` bevat alleen ondersteunend bewijs op statusniveau; gebruik `/scan` of de beveiligingsauditpagina van ClawHub voor volledige scannerdetails.
- `security.signals.dependencyRegistry` blijft behouden voor compatibiliteit met v1-antwoorden, maar de scanner voor het bestaan van het afhankelijkhedenregister is buiten gebruik gesteld en deze sleutel is altijd `null`.
- Het ontbreken van een Skill Card heeft geen invloed op `ok`, `decision` of `reasons` van dit eindpunt; clients moeten de geïnstalleerde `skill-card.md` lokaal lezen wanneer ze kaartinhoud nodig hebben.
- Gebruik `/verify` wanneer je de verificatie-envelop van de Skill Card voor één skill nodig hebt, `/card` wanneer je gegenereerde kaart-Markdown nodig hebt, en `/scan` wanneer je gedetailleerde scannergegevens nodig hebt.

Antwoord:

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

Geeft ruwe tekstinhoud terug.

Queryparameters:

- `path` (vereist)
- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Standaard ingesteld op de nieuwste versie.
- Limiet voor bestandsgrootte: 200KB.

### `GET /api/v1/packages`

Geünificeerd cataloguseindpunt voor:

- Skills
- code-Plugins
- bundel-Plugins

Queryparameters:

- `limit` (optioneel): geheel getal (1–100)
- `cursor` (optioneel): pagineringscursor
- `family` (optioneel): `skill`, `code-plugin`, of `bundle-plugin`
- `channel` (optioneel): `official`, `community`, of `private`
- `isOfficial` (optioneel): `true` of `false`
- `sort` (optioneel): `updated` (standaard), `recommended`, `trending`, `downloads`, verouderde alias `installs`
- `category` (optioneel): categoriefilter voor Plugins. Alleen ondersteund wanneer de
  aanvraag is beperkt tot Plugin-pakketten (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, of pakketeindpunten met
  `family=code-plugin`/`family=bundle-plugin`). Beheerde categorieën en
  verouderde v1-filteraliassen zijn gedocumenteerd onder `GET /api/v1/plugins`.

Opmerkingen:

- Ongeldige waarden voor `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, of `sort` geven `400` terug. Onbekende queryparameters worden genegeerd.
- `GET /api/v1/code-plugins` en `GET /api/v1/bundle-plugins` blijven aliassen met vaste familie.
- Skill-items blijven ondersteund door het Skill-register en kunnen nog steeds alleen via `POST /api/v1/skills` worden gepubliceerd.
- `POST /api/v1/packages` is nog steeds alleen bedoeld voor code-plugin- en bundle-plugin-releases.
- Anonieme aanroepers zien alleen openbare pakketkanalen.
- Geverifieerde aanroepers kunnen privé-pakketten zien voor uitgevers waartoe ze behoren in lijst-/zoekresultaten.
- `channel=private` geeft alleen pakketten terug die de geverifieerde aanroeper kan lezen.

### `GET /api/v1/packages/search`

Geünificeerd zoeken in de catalogus voor Skills + Plugin-pakketten.

Queryparameters:

- `q` (vereist): querytekenreeks
- `limit` (optioneel): geheel getal (1–100)
- `family` (optioneel): `skill`, `code-plugin`, of `bundle-plugin`
- `channel` (optioneel): `official`, `community`, of `private`
- `isOfficial` (optioneel): `true` of `false`
- `category` (optioneel): categoriefilter voor Plugins. Alleen ondersteund wanneer de
  aanvraag is beperkt tot Plugin-pakketten. Beheerde categorieën en verouderde v1-
  filteraliassen zijn gedocumenteerd onder `GET /api/v1/plugins`.

Opmerkingen:

- Ongeldige waarden voor `family`, `channel`, `isOfficial`, `featured`, of
  `highlightedOnly` geven `400` terug. Onbekende queryparameters worden genegeerd.
- Anonieme aanroepers zien alleen openbare pakketkanalen.
- Geverifieerde aanroepers kunnen privé-pakketten zoeken voor uitgevers waartoe ze behoren.
- `channel=private` geeft alleen pakketten terug die de geverifieerde aanroeper kan lezen.

### `GET /api/v1/plugins`

Alleen-Plugin catalogusnavigatie over code-plugin- en bundle-plugin-pakketten.

Queryparameters:

- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): pagineringscursor
- `isOfficial` (optioneel): `true` of `false`
- `sort` (optioneel): `recommended` (standaard), `trending`, `downloads`, `updated`, verouderde alias `installs`
- `category` (optioneel): categoriefilter voor Plugins. Huidige waarden:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Verouderde v1-filteraliassen blijven geaccepteerd op leeseindpunten:

- `mcp-tooling`, `data`, en `automation` worden herleid tot `tools`.
- `observability` en `deployment` worden herleid tot `gateway`.
- `dev-tools` wordt herleid tot `runtime`.

`trending` is een zeven-daags installatie-/downloadklassement en gebruikt geen totalen over de volledige looptijd.
Op het geünificeerde `/api/v1/packages`-eindpunt is dit alleen voor Plugins; gebruik
`/api/v1/skills?sort=trending` voor de Skill-catalogus.

Verouderde aliassen worden niet geaccepteerd als opgeslagen of door auteurs gedeclareerde categoriewaarden.

### `GET /api/v1/skills/export`

Bulkexport van nieuwste openbare Skills voor offline-analyse.

Auth:

- API-token vereist.

Queryparameters:

- `startDate` (vereist): ondergrens in Unix-milliseconden voor Skill `updatedAt`.
- `endDate` (vereist): bovengrens in Unix-milliseconden voor Skill `updatedAt`.
- `limit` (optioneel): geheel getal (1-250), standaard `250`.
- `cursor` (optioneel): pagineringscursor uit de vorige respons.

Respons:

- Body: ZIP-archief.
- Elke geëxporteerde Skill is geworteld in `{publisher}/{slug}/`.
- Gehoste Skills bevatten de nieuwste opgeslagen versiebestanden en worden vermeld in
  `_manifest.json` met `sourceRef: "public-clawhub"`.
- Huidige door GitHub ondersteunde Skills met een `clean`- of `suspicious`-scan bevatten
  `_source_handoff.json` met `sourceRef: "public-github"`, repo, commit, pad,
  contenthash en archief-URL. Ze bevatten geen door ClawHub gehoste bronbestanden.
- Elke Skill bevat `_export_skill_meta.json`.
- `_manifest.json` wordt altijd opgenomen in de ZIP-root.
- `_errors.json` wordt opgenomen wanneer afzonderlijke Skills of bestanden niet konden worden
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

- `startDate` (verplicht): ondergrens in Unix-milliseconden voor Plugin `updatedAt`.
- `endDate` (verplicht): bovengrens in Unix-milliseconden voor Plugin `updatedAt`.
- `limit` (optioneel): geheel getal (1-250), standaard `250`.
- `cursor` (optioneel): paginatiecursor uit de vorige respons.
- `family` (optioneel): `code-plugin` of `bundle-plugin`. Weglaten betekent beide
  Plugin-families.

Respons:

- Body: ZIP-archief.
- Elke geexporteerde Plugin heeft `{family}/{packageName}/` als root.
- Elke geexporteerde Plugin bevat de opgeslagen bestanden van de nieuwste release.
- Exportmetadata per Plugin wordt opgeslagen op
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` wordt altijd opgenomen in de ZIP-root.
- `_errors.json` wordt opgenomen wanneer afzonderlijke Plugins of bestanden niet konden worden
  geexporteerd.

Headers:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Alleen-Plugin-zoekfunctie over `code-plugin`- en `bundle-plugin`-pakketten.

Queryparameters:

- `q` (verplicht): zoekreeks
- `limit` (optioneel): geheel getal (1-100)
- `isOfficial` (optioneel): `true` of `false`
- `category` (optioneel): filter voor Plugin-categorie. Huidige waarden:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Opmerkingen:

- De legacy v1-filteraliassen die onder `GET /api/v1/plugins` zijn gedocumenteerd, worden ook
  geaccepteerd.
- Categoriefiltering is een echte API-filter, ondersteund door Plugin-categorie-digest-
  rijen, geen herschrijving van de zoekquery.
- Resultaten worden in relevantievolgorde geretourneerd en worden momenteel niet gepagineerd.
- Sorteerknoppen in de browser-UI voor Plugin-zoeken herschikken de geladen relevatieresultaten,
  overeenkomstig het huidige `/skills`-bladergedrag.

### `GET /api/v1/packages/{name}`

Retourneert metadata met pakketdetails.

Opmerkingen:

- Skills kunnen ook via deze route worden opgelost in de uniforme catalogus.
- Privepakketten retourneren `404`, tenzij de aanroeper de eigenaar-publisher kan lezen.

### `DELETE /api/v1/packages/{name}`

Verwijdert een pakket en alle releases zacht.

Opmerkingen:

- Vereist een API-token voor de pakketeigenaar, een eigenaar/beheerder van de org-publisher,
  platformmoderator of platformbeheerder.

### `GET /api/v1/packages/{name}/versions`

Retourneert versiegeschiedenis.

Queryparameters:

- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): paginatiecursor

Opmerkingen:

- Privepakketten retourneren `404`, tenzij de aanroeper de eigenaar-publisher kan lezen.

### `GET /api/v1/packages/{name}/versions/{version}`

Retourneert een pakketversie, inclusief bestandsmetadata, compatibiliteit,
verificatie, artifactmetadata en scandata.

Opmerkingen:

- `version.artifact.kind` is `legacy-zip` voor pakketarchieven uit de oude wereld of
  `npm-pack` voor door ClawPack ondersteunde releases.
- ClawPack-releases bevatten npm-compatibele velden `npmIntegrity`, `npmShasum` en
  `npmTarballName`.
- `version.sha256hash` is verouderde compatibiliteitsmetadata voor oude clients. Het
  hasht de exacte ZIP-bytes die door `/api/v1/packages/{name}/download` worden geretourneerd.
  Moderne clients moeten `version.artifact.sha256` gebruiken, dat het
  canonieke release-artifact identificeert.
- `version.vtAnalysis`, `version.llmAnalysis` en `version.staticScan` worden
  opgenomen wanneer scandata bestaat.
- Privepakketten retourneren `404`, tenzij de aanroeper de eigenaar-publisher kan lezen.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Retourneert de exacte beveiligings- en vertrouwenssamenvatting van de pakketreleased voor installatieclients. Dit is het openbare OpenClaw-consumptieoppervlak om te bepalen of een
opgeloste release kan worden geinstalleerd.

Authenticatie:

- Openbaar leeseindpunt. Geen token van eigenaar, publisher, moderator of beheerder
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
  opgeloste registrypakket.
- `release.releaseId`, `release.version` en `release.createdAt` identificeren de
  exacte release die is geevalueerd.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` en `release.npmTarballName` zijn aanwezig wanneer ze bekend zijn voor
  het release-artifact.
- `trust.scanStatus` is de effectieve vertrouwensstatus die is afgeleid van scannerinputs
  en handmatige releasemoderatie.
- `trust.moderationState` is nullable. Het is `null` wanneer er geen handmatige release-
  moderatie bestaat.
- `trust.blockedFromDownload` is het installatieblokkeringssignaal. OpenClaw en andere
  installatieclients moeten installatie blokkeren wanneer deze waarde `true` is, in plaats van
  blokkeringsregels opnieuw af te leiden uit scanner- of moderatievelden.
- `trust.reasons` is de lijst met uitleg voor gebruikers en audit. Redencodes
  zijn stabiele, compacte strings zoals `manual:quarantined`, `scan:malicious`,
  en `package:malicious`.
- `trust.pending` betekent dat een of meer vertrouwensinputs nog op voltooiing wachten.
- `trust.stale` betekent dat de vertrouwenssamenvatting is berekend uit verouderde inputs en
  moet worden behandeld alsof vernieuwing vereist is voordat een allow-beslissing met hoge zekerheid wordt genomen.

Opmerkingen:

- Dit eindpunt is versie-exact. Clients moeten het aanroepen nadat ze de
  pakketversie hebben opgelost die ze willen installeren, niet alleen na het lezen van de nieuwste
  pakketmetadata.
- Privepakketten retourneren `404`, tenzij de aanroeper de eigenaar-publisher kan lezen.
- Dit eindpunt is opzettelijk smaller dan eigenaar-/moderator-moderatie-
  eindpunten. Het toont de installatiebeslissing en openbare uitleg, niet
  identiteiten van melders, rapportinhoud, privebewijs of interne review-
  tijdlijnen.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Retourneert de expliciete artifact-resolvermetadata voor een pakketversie.

Opmerkingen:

- Legacy pakketversies retourneren een `legacy-zip`-artifact en een legacy ZIP-
  `downloadUrl`.
- ClawPack-versies retourneren een `npm-pack`-artifact, npm-integriteitsvelden, een
  `tarballUrl` en de legacy ZIP-compatibiliteits-URL.
- Dit is het OpenClaw-resolveroppervlak; het voorkomt gokken naar het archiefformaat op basis van
  een gedeelde URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Downloadt het versie-artifact via het expliciete resolverpad.

Opmerkingen:

- ClawPack-versies streamen de exacte geuploade npm-pack `.tgz`-bytes.
- Legacy ZIP-versies verwijzen door naar `/api/v1/packages/{name}/download?version=`.
- Gebruikt de downloadsnelheidsbucket.

### `GET /api/v1/packages/{name}/readiness`

Retourneert berekende gereedheid voor toekomstig OpenClaw-gebruik.

Gereedheidscontroles omvatten:

- officiele kanaalstatus
- beschikbaarheid van nieuwste versie
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

Moderatoreindpunt voor het weergeven van officiele OpenClaw Plugin-migratierijen.

Authenticatie:

- Vereist een API-token voor een moderator- of beheerdergebruiker.

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

Beheerdereindpunt voor het maken of bijwerken van een officiele Plugin-migratierij.

Authenticatie:

- Vereist een API-token voor een beheerdergebruiker.

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
- `packageName` wordt genormaliseerd als npm-naam; het pakket kan ontbreken voor geplande
  migraties.
- Dit houdt alleen migratiegereedheid bij. Het wijzigt OpenClaw niet en genereert geen
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Moderator-/beheerdereindpunt voor reviewwachtrijen van pakketreleases.

Authenticatie:

- Vereist een API-token voor een moderator- of beheerdergebruiker.

Queryparameters:

- `status` (optioneel): `open` (standaard), `blocked`, `manual`, of `all`
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): paginatiecursor

Statusbetekenissen:

- `open`: verdachte, schadelijke, wachtende, in quarantaine geplaatste, ingetrokken of gemelde releases.
- `blocked`: in quarantaine geplaatste, ingetrokken of schadelijke releases.
- `manual`: elke release met een handmatige moderatie-override.
- `all`: elke release met een handmatige override, niet-schone scanstatus of pakketrapport.

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

Meld een pakket voor moderatorreview. Rapporten zijn op pakketniveau, optioneel
gekoppeld aan een versie. Ze voeden de moderatiewachtrij, maar verbergen of
blokkeren downloads niet automatisch op zichzelf; moderators moeten releasemoderatie gebruiken om
artifacts goed te keuren, in quarantaine te plaatsen of in te trekken.

Authenticatie:

- Vereist een API-token.

Verzoek:

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

Moderator-/admin-eindpunt voor inname van pakketrapporten.

Authenticatie:

- Vereist een API-token voor een moderator- of admin-gebruiker.

Queryparameters:

- `status` (optioneel): `open` (standaard), `confirmed`, `dismissed` of `all`
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): pagineringscursor

Antwoord:

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

- Vereist een API-token voor de pakketeigenaar, een publisher-lid, moderator of
  admin-gebruiker.

Antwoord:

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

Moderator-/admin-eindpunt voor het oplossen of heropenen van pakketrapporten.

Verzoek:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` is vereist voor `confirmed` en `dismissed`; het mag worden weggelaten bij het
terugzetten van `status` naar `open`. Geef `finalAction: "quarantine"` of
`finalAction: "revoke"` mee met een bevestigd rapport om releasemoderatie toe te passen in dezelfde
controleerbare workflow.

Antwoord:

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

Releases met quarantaine of intrekking retourneren `403` vanuit artifact-downloadroutes.
Elke wijziging schrijft een auditlogvermelding.

### `GET /api/v1/packages/{name}/file`

Retourneert ruwe tekstinhoud voor een pakketbestand.

Queryparameters:

- `path` (vereist)
- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste release.
- Gebruikt de read-ratebucket, niet de downloadbucket.
- Binaire bestanden retourneren `415`.
- Limiet voor bestandsgrootte: 200 KB.
- Lopende VirusTotal-scans blokkeren leesacties niet; schadelijke releases kunnen elders nog steeds worden achtergehouden.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-publisher kan lezen.

### `GET /api/v1/packages/{name}/download`

Downloadt het verouderde deterministische ZIP-archief voor een pakketrelease.

Queryparameters:

- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste release.
- Skills verwijzen door naar `GET /api/v1/download`.
- Plugin-/pakketarchieven zijn zip-bestanden met een `package/`-root zodat oude OpenClaw
  clients blijven werken.
- Deze route blijft alleen ZIP. Ze streamt geen ClawPack `.tgz`-bestanden.
- Antwoorden bevatten `ETag`-, `Digest`-, `X-ClawHub-Artifact-Type`- en
  `X-ClawHub-Artifact-Sha256`-headers voor integriteitscontroles door resolvers.
- Metadata die alleen in het registry staat, wordt niet in het gedownloade archief geïnjecteerd.
- Lopende VirusTotal-scans blokkeren downloads niet; schadelijke releases retourneren `403`.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar is.

### `GET /api/npm/{package}`

Retourneert een npm-compatibele packument voor pakketversies die door ClawPack worden ondersteund.

Opmerkingen:

- Alleen versies met geüploade ClawPack npm-pack-tarballs worden vermeld.
- Verouderde versies die alleen ZIP zijn, worden bewust weggelaten.
- `dist.tarball`, `dist.integrity` en `dist.shasum` gebruiken npm-compatibele
  velden zodat gebruikers npm naar de mirror kunnen laten wijzen als ze dat willen.
- Packuments voor scoped pakketten ondersteunen zowel `/api/npm/@scope/name` als npm's
  gecodeerde aanvraagpad `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Streamt de exacte geüploade ClawPack-tarballbytes voor npm-mirrorclients.

Opmerkingen:

- Gebruikt de download-ratebucket.
- Downloadheaders bevatten ClawHub SHA-256 plus npm-integrity-/shasum-metadata.
- Controles voor moderatie en toegang tot privépakketten blijven van toepassing.

### `GET /api/v1/resolve`

Wordt door de CLI gebruikt om een lokale fingerprint aan een bekende versie te koppelen.

Queryparameters:

- `slug` (vereist)
- `hash` (vereist): 64-tekens hex sha256 van de bundle-fingerprint

Antwoord:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Downloadt een gehoste skillversie-ZIP, of retourneert een GitHub-bronoverdracht voor een
huidige door GitHub ondersteunde skill met een `clean`- of `suspicious`-scan en zonder gehoste
versie.

Queryparameters:

- `slug` (vereist)
- `version` (optioneel): semver-tekenreeks
- `tag` (optioneel): tagnaam (bijv. `latest`)

Opmerkingen:

- Als noch `version` noch `tag` is opgegeven, wordt de nieuwste versie gebruikt.
- Soft-deleted versies retourneren `410`.
- Overdrachten voor door GitHub ondersteunde skills proxyen of mirroren geen bytes. Het JSON-antwoord
  bevat `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  en `archiveUrl`; scan-/huidige status is een gate en wordt niet opgenomen als metadata voor een geslaagde
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

- Voorkeur: `multipart/form-data` met `payload`-JSON + `files[]`-blobs.
- JSON-body met `files` (op basis van storageId) wordt ook geaccepteerd.
- Optioneel payloadveld: `ownerHandle`. Indien aanwezig, lost de API die
  publisher server-side op en vereist dat de actor publisher-toegang heeft.
- Optioneel payloadveld: `migrateOwner`. Wanneer `true` met `ownerHandle`, kan een
  bestaande skill naar die eigenaar verhuizen als de actor admin/eigenaar is bij zowel
  de huidige als de doel-publishers. Zonder deze opt-in worden eigenaarswijzigingen
  geweigerd.

### `POST /api/v1/packages`

Publiceert een code-plugin- of bundle-plugin-release.

- Vereist Bearer-tokenauthenticatie.
- Vereist `multipart/form-data`.
- Toegestane formuliervelden zijn `payload`, herhaalde `files`-blobs of één `clawpack`
  tarballreferentie. `clawpack` kan een `.tgz`-blob zijn of een storage-id dat is geretourneerd door
  de upload-url-flow. Publicaties met gestagede storage-id moeten ook het
  `clawpackUploadTicket` bevatten dat met die upload-URL is geretourneerd.
- Gebruik óf `files` óf `clawpack`, nooit beide in hetzelfde verzoek.
- JSON-bodies en door de aanroeper aangeleverde `payload.files`- / `payload.artifact`-
  metadata worden geweigerd.
- Directe multipart-publicatieverzoeken zijn begrensd op 18 MB. ClawPack-tarballs mogen
  de upload-url-flow gebruiken tot de tarballlimiet van 120 MB.
- Optioneel payloadveld: `ownerHandle`. Indien aanwezig, mogen alleen admins namens die eigenaar publiceren.

Validatiehoogtepunten:

- `family` moet `code-plugin` of `bundle-plugin` zijn.
- Plugin-pakketten vereisen `openclaw.plugin.json`. ClawPack `.tgz`-uploads moeten
  dit bevatten op `package/openclaw.plugin.json`.
- Code-plugins vereisen `package.json`, bronrepo-metadata, broncommit-
  metadata, configschema-metadata, `openclaw.compat.pluginApi` en
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` en `openclaw.environment` zijn optionele metadata.
- Alleen de `openclaw`-org-publisher en de persoonlijke publishers van huidige leden van de `openclaw`-org
  mogen naar het `official`-kanaal publiceren.
- Publicaties namens iemand anders valideren nog steeds of het doel-eigenaarsaccount in aanmerking komt voor het official-kanaal.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Soft-delete / herstel een skill (eigenaar, moderator of admin).

Optionele JSON-body:

```json
{ "reason": "Held for moderation pending legal review." }
```

Indien aanwezig, wordt `reason` opgeslagen als de moderatienotitie van de skill en naar het auditlog gekopieerd.
Door de eigenaar gestarte soft deletes reserveren de slug 30 dagen, daarna kan de slug worden geclaimd door
een andere publisher. Het delete-antwoord bevat `slugReservedUntil` wanneer deze vervaldatum van toepassing is.
Verbergacties door moderator/admin en beveiligingsverwijderingen verlopen niet op deze manier.

Delete-antwoord:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Statuscodes:

- `200`: ok
- `401`: niet geautoriseerd
- `403`: verboden
- `404`: skill/gebruiker niet gevonden
- `500`: interne serverfout

### `POST /api/v1/users/publisher`

Alleen admin. Zorgt dat er een org-publisher bestaat voor een handle. Als de handle nog naar een
verouderde gedeelde gebruiker/persoonlijke publisher wijst, migreert het eindpunt deze eerst naar een org-publisher.
Geef voor een nieuw aangemaakte org `memberHandle` op; de handelende admin wordt niet als lid toegevoegd.
`memberRole` is standaard `owner`.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Antwoord: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Geauthenticeerde selfservice-aanmaak van org-publishers. Maakt een nieuwe org-publisher aan en voegt de
aanroeper toe als eigenaar. Dit eindpunt migreert geen bestaande gebruikers-/persoonlijke handles en markeert
de publisher niet als vertrouwd/official.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Antwoord: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Retourneert `409` wanneer de handle al wordt gebruikt door een publisher, gebruiker of persoonlijke publisher.

### `POST /api/v1/users/reserve`

Alleen admin. Reserveert rootslugs en pakketnamen voor een rechtmatige eigenaar zonder een
release te publiceren. Pakketnamen worden private placeholder-pakketten zonder releaserijen, zodat dezelfde
eigenaar later de echte code-plugin- of bundle-plugin-release naar die naam kan publiceren.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Antwoord: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Alleen admin. Herstelt een persoonlijke publisher voor een geverifieerde vervangende GitHub OAuth-principal
zonder Convex Auth-accountrows te bewerken. Het verzoek moet beide onveranderlijke GitHub
provideraccount-id's noemen; veranderlijke handles worden alleen gebruikt als operatorgerichte controle.

Het endpoint gebruikt standaard dry-run. Herstel toepassen vereist `dryRun: false` en
`confirmIdentityVerified: true` nadat medewerkers onafhankelijk de continuïteit tussen beide
GitHub-principals hebben geverifieerd. Herstel faalt gesloten wanneer de huidige persoonlijke
publisher van de doelgebruiker skills, pakketten of GitHub-skillbronnen heeft.
Herstel migreert ook legacy `ownerUserId`-velden voor de skills van de herstelde publisher,
skill-slugaliassen, pakketten, pakketinspectiewaarschuwingen en afgeleide zoekdigest-rijen, zodat
direct-owner-paden overeenkomen met de nieuwe publisher-autoriteit. Een actieve beschermde-handle-
reservering voor de herstelde handle wordt ook opnieuw toegewezen aan de vervangende gebruiker, zodat latere
profielsynchronisatie de concurrerende autoriteit van de voormalige gebruiker niet kan herstellen. Elke primaire tabel is begrensd tot
100 rijen per toepastransactie; grotere herstelacties moeten eerst een hervatbare owner-migratie gebruiken.
GitHub-skillbronnen zijn publisher-scoped en worden gerapporteerd als gecontroleerd in plaats van herschreven.

- Body: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Respons: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Endpoints voor owner-slugbeheer

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Respons: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Respons: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Opmerkingen:

- Beide endpoints vereisen API-tokenauthenticatie en werken alleen voor de skill-owner.
- `rename` bewaart de vorige slug als redirect-alias.
- `merge` verbergt de bronvermelding en leidt de bronslug om naar de doelvermelding.

### Endpoints voor eigendomsoverdracht

- `POST /api/v1/skills/{slug}/transfer`
  - Body: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Respons: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Respons (accepteren/afwijzen/annuleren): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Responsvorm: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Ban een gebruiker en verwijder owned skills definitief (alleen moderator/admin).

Body:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

of

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Respons:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Hef de ban van een gebruiker op en herstel in aanmerking komende skills (alleen admin).

Body:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

of

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Respons:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Wijzig de opgeslagen reden voor een bestaande ban zonder de ban op te heffen of
content te herstellen (alleen admin). Gebruikt standaard dry-run tenzij `dryRun` `false` is.

Body:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

of

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

Respons:

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

Respons:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Gebruikers weergeven of zoeken (alleen admin).

Queryparameters:

- `q` (optioneel): zoekquery
- `query` (optioneel): alias voor `q`
- `limit` (optioneel): maximumaantal resultaten (standaard 20, max. 200)

Respons:

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

Voeg een star toe of verwijder er een (highlights). Beide endpoints zijn idempotent.

Responsen:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Legacy CLI-endpoints (verouderd)

Nog steeds ondersteund voor oudere CLI-versies:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Zie `DEPRECATIONS.md` voor het verwijderingsplan.

`POST /api/cli/upload-url` retourneert `uploadUrl` en `uploadTicket`. Pakket-
publicaties die een ClawPack-tarball klaarzetten, moeten de resulterende storage-id verzenden als
`clawpack` en het geretourneerde ticket als `clawpackUploadTicket`.

## Registry-discovery (`/.well-known/clawhub.json`)

De CLI kan registry-/auth-instellingen van de site ontdekken:

- `/.well-known/clawhub.json` (JSON, aanbevolen)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Als je zelf host, serveer dit bestand (of stel `CLAWHUB_REGISTRY` expliciet in; legacy `CLAWDHUB_REGISTRY`).
