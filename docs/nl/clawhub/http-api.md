---
read_when:
    - Eindpunten toevoegen/wijzigen
    - CLI ↔ registry-verzoeken debuggen
summary: HTTP-API-referentie (openbare + CLI-eindpunten + authenticatie).
x-i18n:
    generated_at: "2026-07-16T15:28:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP-API

Basis-URL: `https://clawhub.ai` (standaard).

Alle v1-paden vallen onder `/api/v1/...`.
Verouderde `/api/...` en `/api/cli/...` blijven beschikbaar voor compatibiliteit (zie `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Hergebruik van de openbare catalogus

Externe directory's mogen de openbare leesendpoints gebruiken om ClawHub-Skills weer te geven of te doorzoeken. Cache resultaten, respecteer `429`/`Retry-After`, verwijs gebruikers terug naar de canonieke ClawHub-vermelding (`https://clawhub.ai/<owner>/skills/<slug>`) en wek niet de indruk dat ClawHub de externe site onderschrijft. Probeer verborgen, privé- of door moderatie geblokkeerde inhoud niet buiten het openbare API-oppervlak te spiegelen.

Websnelkoppelingen voor slugs worden voor alle registerfamilies omgezet, maar API-clients moeten
de canonieke URL's gebruiken die door leesendpoints worden geretourneerd, in plaats van de
routeprioriteit te reconstrueren.

## Limieten voor aanvraagfrequentie

Handhavingsmodel:

- Anonieme aanvragen: gehandhaafd per IP-adres.
- Geverifieerde aanvragen (geldig Bearer-token): gehandhaafd per gebruikersbucket.
- Als het token ontbreekt of ongeldig is, valt het gedrag terug op handhaving per IP-adres.
- Geverifieerde schrijfendpoints mogen geen kale `Unauthorized` retourneren wanneer
  de server de reden kent. Ontbrekende tokens, ongeldige/ingetrokken tokens en
  verwijderde/verbannen/uitgeschakelde accounts moeten elk bruikbare tekst krijgen, zodat CLI-
  clients gebruikers kunnen vertellen waardoor ze zijn geblokkeerd.

- Lezen: 3000/min per IP-adres, 12000/min per sleutel
- Schrijven: 300/min per IP-adres, 3000/min per sleutel
- Downloaden: 1200/min per IP-adres, 6000/min per sleutel (downloadendpoints)

Headers:

- Compatibiliteit met verouderde clients: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Gestandaardiseerd: `RateLimit-Limit`, `RateLimit-Reset`
- Bij `429`: `X-RateLimit-Remaining: 0` en `RateLimit-Remaining: 0`
- Bij `429`: `Retry-After`

Betekenis van headers:

- `X-RateLimit-Reset`: absolute Unix-epochseconden
- `RateLimit-Reset`: seconden tot de reset (vertraging)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: exact resterend budget indien aanwezig.
  Geslaagde gesharde aanvragen laten deze header weg in plaats van een benaderde globale waarde te retourneren.
- `Retry-After`: aantal seconden dat moet worden gewacht voordat opnieuw wordt geprobeerd (vertraging) bij `429`

Voorbeeld van een `429`-respons:

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

Limiet voor aanvraagfrequentie overschreden
```

Richtlijnen voor clients:

- Als `Retry-After` bestaat, wacht dan dat aantal seconden voordat je het opnieuw probeert.
- Gebruik back-off met jitter om gesynchroniseerde nieuwe pogingen te voorkomen.
- Als `Retry-After` ontbreekt, val dan terug op `RateLimit-Reset` (of bereken dit op basis van `X-RateLimit-Reset`).

IP-bron:

- Gebruikt vertrouwde headers voor client-IP-adressen, waaronder `cf-connecting-ip`, alleen wanneer de
  implementatie vertrouwde doorgestuurde headers expliciet inschakelt.
- ClawHub gebruikt vertrouwde doorstuurheaders om client-IP-adressen aan de rand te identificeren.
- Als er geen vertrouwd client-IP-adres beschikbaar is, gebruiken anonieme aanvragen fallbackbuckets
  die alleen zijn afgebakend op soort frequentielimiet. Deze fallbackbuckets bevatten geen
  door de aanroeper opgegeven paden, slugs, pakketnamen, versies, querystrings of andere
  artefactparameters.

## Foutresponsen

Openbare v1-foutresponsen zijn platte tekst met `content-type: text/plain; charset=utf-8`.
Dit omvat validatiefouten (`400`), ontbrekende openbare resources (`404`), verificatie- en
machtigingsfouten (`401`/`403`), frequentielimieten (`429`) en geblokkeerde downloads. Clients
moeten de responsbody als een voor mensen leesbare tekenreeks lezen. Onbekende queryparameters worden
voor compatibiliteit genegeerd, maar herkende queryparameters met ongeldige waarden retourneren
`400`.

## Openbare endpoints (geen verificatie)

### `GET /api/v1/search`

Queryparameters:

- `q` (verplicht): querytekenreeks
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

- Resultaten worden in relevantievolgorde geretourneerd (overeenkomst van embeddings + boosts voor exacte slug-/naamtokenovereenkomsten + een kleine populariteitsprior).
- Relevantie weegt zwaarder dan populariteit. Een exacte overeenkomst met een slug- of weergavenaamtoken kan hoger eindigen dan een minder exacte overeenkomst met veel sterkere betrokkenheid.
- ASCII-tekst wordt getokeniseerd op woord- en interpunctiegrenzen. `personal-map` bevat bijvoorbeeld een zelfstandig `map`-token, terwijl `amap-jsapi-skill` de tokens `amap`, `jsapi` en `skill` bevat; zoeken naar `map` geeft `personal-map` daarom een sterkere lexicale overeenkomst dan `amap-jsapi-skill`.
- Populariteit wordt logaritmisch geschaald en begrensd. Skills met hoge betrokkenheid kunnen lager eindigen wanneer de querytekst minder goed overeenkomt.
- Een verdachte of verborgen moderatiestatus kan een Skill uit openbare zoekresultaten verwijderen, afhankelijk van de filters van de aanroeper en de huidige moderatiestatus.

Richtlijnen voor vindbaarheid van uitgevers:

- Zet de termen waarop gebruikers letterlijk zullen zoeken in de weergavenaam, samenvatting en tags. Gebruik alleen een zelfstandig slugtoken als dit ook een stabiele identiteit is die je wilt behouden.
- Wijzig een slug niet alleen om voor één query beter te scoren, tenzij de nieuwe slug op lange termijn een betere canonieke naam is. Oude slugs worden omleidingsaliassen, maar de canonieke URL, weergegeven slug en toekomstige zoekoverzichten gebruiken de nieuwe slug.
- Aliassen na een naamswijziging behouden de resolutie voor oude URL's en installaties die via het register worden omgezet, maar de zoekrangschikking is gebaseerd op de canonieke Skill-metadata nadat de naamswijziging is geïndexeerd. Bestaande statistieken blijven bij de Skill.
- Als een Skill onverwacht onzichtbaar is, controleer dan eerst de moderatiestatus met `clawhub inspect @owner/slug` terwijl je bent ingelogd, voordat je metadata voor de rangschikking wijzigt.

### `GET /api/v1/skills`

Queryparameters:

- `limit` (optioneel): geheel getal (1–200)
- `cursor` (optioneel): pagineringscursor voor elke sortering behalve `trending`
- `sort` (optioneel): `updated` (standaard), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), verouderde installatiealiassen `installsCurrent`/`installs`/`installsAllTime` verwijzen naar `downloads`, `trending`
- `nonSuspiciousOnly` (optioneel): `true` om verdachte (`flagged.suspicious`) Skills te verbergen
- `nonSuspicious` (optioneel): verouderde alias voor `nonSuspiciousOnly`

Ongeldige waarden voor `sort` retourneren `400`.

Opmerkingen:

- `recommended` gebruikt signalen voor betrokkenheid en recentheid.
- `trending` rangschikt op installaties in de afgelopen 7 dagen (op basis van telemetrie).
- `createdAt` is stabiel voor crawls van nieuwe Skills; `updated` verandert wanneer bestaande Skills opnieuw worden gepubliceerd.
- Wanneer `nonSuspiciousOnly=true`, kunnen cursorgebaseerde sorteringen minder dan `limit` items op een pagina retourneren, omdat verdachte Skills na het ophalen van de pagina worden uitgefilterd.
- Gebruik `nextCursor` om door te gaan met pagineren wanneer deze aanwezig is. Een korte pagina betekent op zichzelf niet dat het einde van de resultaten is bereikt.

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

- Oude slugs die via naamswijzigings-/samenvoegingsflows van de eigenaar zijn gemaakt, verwijzen naar de canonieke Skill.
- `metadata.os`: OS-beperkingen die in de frontmatter van de Skill zijn gedeclareerd (bijv. `["macos"]`, `["linux"]`). `null` indien niet gedeclareerd.
- `metadata.systems`: Nix-systeemdoelen (bijv. `["aarch64-darwin", "x86_64-linux"]`). `null` indien niet gedeclareerd.
- `metadata` is `null` als de Skill geen platformmetadata heeft.
- `moderation` wordt alleen opgenomen wanneer de Skill is gemarkeerd of de eigenaar deze bekijkt.

### `GET /api/v1/skills/{slug}/moderation`

Retourneert een gestructureerde moderatiestatus.

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

- Eigenaren en moderators hebben toegang tot moderatiedetails voor verborgen Skills.
- Openbare aanroepers krijgen `200` alleen voor reeds gemarkeerde zichtbare Skills.
- Bewijs wordt voor openbare aanroepers geredigeerd en bevat alleen voor eigenaren/moderators onbewerkte fragmenten.

### `POST /api/v1/skills/{slug}/report`

Meld een Skill voor beoordeling door een moderator. Meldingen gelden voor de hele Skill, kunnen optioneel aan
een versie worden gekoppeld en worden aan de wachtrij voor Skill-meldingen toegevoegd.

Verificatie:

- Vereist een API-token.

Aanvraag:

```json
{ "reason": "Verdachte installatiestap", "version": "1.2.3" }
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

Endpoint voor moderators/beheerders voor de ontvangst van Skill-meldingen.

Queryparameters:

- `status` (optioneel): `open` (standaard), `confirmed`, `dismissed` of `all`
- `limit` (optioneel): geheel getal (1-200)
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
      "reason": "Verdachte installatiestap",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Melder"
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

Moderator-/beheerdersendpoint voor het afhandelen of heropenen van Skill-meldingen.

Verzoek:

```json
{ "status": "confirmed", "note": "Beoordeeld en betreffende versie verborgen.", "finalAction": "hide" }
```

`note` is vereist voor `confirmed` en `dismissed`; het mag worden weggelaten wanneer
`status` wordt teruggezet naar `open`. Geef `finalAction: "hide"` door met een getriageerde
melding om de Skill binnen dezelfde controleerbare workflow te verbergen.

### `GET /api/v1/skills/{slug}/versions`

Queryparameters:

- `limit` (optioneel): geheel getal
- `cursor` (optioneel): pagineringscursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Retourneert versiemetadata en een bestandenlijst.

- `version.security` bevat de genormaliseerde verificatiestatus van de scan en scannergegevens
  (VirusTotal + LLM), indien beschikbaar.

### `GET /api/v1/skills/{slug}/scan`

Retourneert verificatiegegevens van de beveiligingsscan voor een Skill-versie.

Queryparameters:

- `version` (optioneel): specifieke versietekenreeks.
- `tag` (optioneel): een getagde versie herleiden (bijvoorbeeld `latest`).

Opmerkingen:

- Als noch `version` noch `tag` is opgegeven, wordt de nieuwste versie gebruikt.
- Bevat de genormaliseerde verificatiestatus en scannerspecifieke gegevens.
- `security.hasScanResult` is alleen `true` wanneer een scanner een definitief oordeel heeft opgeleverd (`clean`, `suspicious` of `malicious`).
- `moderation` is een actuele moderatiemomentopname op Skill-niveau, afgeleid van de nieuwste versie.
- Controleer bij het opvragen van een historische versie `moderation.matchesRequestedVersion` en `moderation.sourceVersion` voordat je `moderation` en `security` als dezelfde versiecontext beschouwt.

### `POST /api/v1/skills/-/scan`

Geauthenticeerd indieningsendpoint voor nieuwe ClawScan-taken.

Scans van lokale uploads worden niet meer ondersteund. Verzoeken die
`multipart/form-data` of `{ "source": { "kind": "upload" } }` gebruiken, retourneren `410`.

Gepubliceerde scans gebruiken JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Opmerkingen:

- Payloads van scanverzoeken en downloadbare rapporten verlopen na de bewaartermijn in de opslag voor scanverzoeken.
- Gepubliceerde scans vereisen beheertoegang als eigenaar/uitgever of bevoegdheid als platformmoderator/-beheerder.
- Gepubliceerde scans schrijven alleen terug wanneer `update: true` en de scan succesvol wordt voltooid.
- Het antwoord is `202` met `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Scantaken zijn asynchroon. Handmatige scanverzoeken krijgen voorrang op normaal publicatie-/aanvulwerk, maar voltooiing blijft afhankelijk van de beschikbaarheid van workers.

### `GET /api/v1/skills/-/scan/{scanId}`

Geauthenticeerd pollingendpoint voor een ingediende scan.

- Retourneert de status in wachtrij/actief/geslaagd/mislukt.
- Retourneert `queue.queuedAhead` en `queue.position` zolang het verzoek in de wachtrij staat, zodat clients kunnen tonen hoeveel handmatige scans met prioriteit nog vóór het verzoek komen. Zeer grote wachtrijen worden begrensd en gerapporteerd met `queuedAheadIsEstimate: true`.
- Indien beschikbaar bevat `report` de secties `clawscan`, `skillspector`, `staticAnalysis` en `virustotal`.
- Mislukte scantaken retourneren `status: "failed"` met `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Geauthenticeerd endpoint voor rapportarchieven.

- Vereist een geslaagde scan; niet-definitieve scans retourneren `409`.
- Retourneert een ZIP-bestand met `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` en `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Geauthenticeerd endpoint voor opgeslagen rapportarchieven van ingediende versies.

- Vereist beheertoegang als eigenaar/uitgever tot de Skill of Plugin, of bevoegdheid als platformmoderator/-beheerder.
- Retourneert opgeslagen scanresultaten voor de exact ingediende versie, inclusief geblokkeerde of verborgen versies.
- `kind` is standaard `skill`; gebruik `kind=plugin` voor scans van plugins/pakketten.
- Retourneert dezelfde ZIP-structuur als downloads van scanverzoeken.

### `POST /api/v1/skills/-/scan/batch`

Canonieke batchroute voor herscans, uitsluitend voor beheerders. Deze accepteert dezelfde payloadstructuur als de verouderde `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Canonieke batchstatusroute, uitsluitend voor beheerders. Deze accepteert `{ "jobIds": ["..."] }` en retourneert dezelfde geaggregeerde tellers als de verouderde `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Retourneert de Skill Card-verificatie-envelop die door `clawhub skill verify` wordt gebruikt.

Queryparameters:

- `version` (optioneel): specifieke versietekenreeks.
- `tag` (optioneel): een getagde versie herleiden (bijvoorbeeld `latest`).

Opmerkingen:

- `ok` is alleen `true` wanneer voor de geselecteerde versie een Skill Card is gegenereerd, deze niet door moderatie wegens malware is geblokkeerd en de ClawScan-verificatie schoon is.
- De Skill-identiteit, uitgeversidentiteit en metadata van de geselecteerde versie zijn velden op het hoogste niveau van de envelop (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), zodat shellautomatisering ze kan lezen zonder geneste wrappers uit te pakken.
- `security` is het ClawScan-/beveiligingsoordeel op het hoogste niveau. Automatisering moet zich baseren op `ok`, `decision`, `reasons` en `security.status`.
- `security.signals` bevat ondersteunend scannerbewijs, zoals `staticScan`, `virusTotal` en `skillSpector`.
- `security.signals.dependencyRegistry` blijft behouden voor compatibiliteit met v1-antwoorden, maar de scanner voor het bestaan van afhankelijkheden in het register is buiten gebruik gesteld en deze sleutel is altijd `null`.
- `provenance` is alleen `server-resolved-github-import` wanneer ClawHub tijdens publicatie of import een GitHub-repository/ref/commit/pad heeft herleid en opgeslagen; anders is dit `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Retourneert actuele, compacte beveiligingsoordelen voor exacte Skill-versies. Dit
verzamelingseindpoint is bedoeld voor clients die al weten welke geïnstalleerde
ClawHub Skill-versies ze moeten weergeven, zoals OpenClaw Control UI.

Verzoek:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Opmerkingen:

- `items` moet 1-100 unieke `{ slug, version }`-paren bevatten.
- Resultaten worden per item geretourneerd; één ontbrekende Skill of versie laat niet het hele antwoord mislukken.
- Het antwoord bevat uitsluitend beveiligingsgegevens. Het bevat geen Skill Card-gegevens, status van gegenereerde kaarten, lijsten met artefactbestanden of gedetailleerde scannerpayloads.
- `security.signals` bevat alleen ondersteunend bewijs op statusniveau; gebruik `/scan` of de beveiligingsauditpagina van ClawHub voor volledige scannergegevens.
- `security.signals.dependencyRegistry` blijft behouden voor compatibiliteit met v1-antwoorden, maar de scanner voor het bestaan van afhankelijkheden in het register is buiten gebruik gesteld en deze sleutel is altijd `null`.
- De afwezigheid van een Skill Card heeft geen invloed op `ok`, `decision` of `reasons` van dit endpoint; clients moeten de geïnstalleerde `skill-card.md` lokaal lezen wanneer ze kaartinhoud nodig hebben.
- Gebruik `/verify` wanneer je de Skill Card-verificatie-envelop voor één Skill nodig hebt, `/card` wanneer je gegenereerde kaart-Markdown nodig hebt en `/scan` wanneer je gedetailleerde scannergegevens nodig hebt.

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
      "error": { "code": "version_not_found", "message": "Versie niet gevonden" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

Retourneert onbewerkte tekstinhoud.

Queryparameters:

- `path` (vereist)
- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste versie.
- Limiet voor bestandsgrootte: 200KB.

### `GET /api/v1/packages`

Uniform cataloguseindpoint voor:

- Skills
- codeplugins
- bundelplugins

Queryparameters:

- `limit` (optioneel): geheel getal (1–100)
- `cursor` (optioneel): pagineringscursor
- `family` (optioneel): `skill`, `code-plugin` of `bundle-plugin`
- `channel` (optioneel): `official`, `community` of `private`
- `isOfficial` (optioneel): `true` of `false`
- `sort` (optioneel): `updated` (standaard), `recommended`, `trending`, `downloads`, verouderde alias `installs`
- `category` (optioneel): filter voor plugincategorieën. Wordt alleen ondersteund wanneer het
  verzoek is beperkt tot pluginpakketten (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` of pakketeindpoints met
  `family=code-plugin`/`family=bundle-plugin`). Beheerde categorieën en
  verouderde v1-filteraliassen worden beschreven onder `GET /api/v1/plugins`.

Opmerkingen:

- Ongeldige waarden voor `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` of `sort` retourneren `400`. Onbekende queryparameters worden genegeerd.
- `GET /api/v1/code-plugins` en `GET /api/v1/bundle-plugins` blijven aliassen voor een vaste familie.
- Skill-vermeldingen blijven gebaseerd op het Skill-register en kunnen nog steeds uitsluitend via `POST /api/v1/skills` worden gepubliceerd.
- `POST /api/v1/packages` is nog steeds uitsluitend voor releases van codeplugins en bundelplugins.
- Anonieme aanroepers zien alleen openbare pakketkanalen.
- Geauthenticeerde aanroepers kunnen in lijst-/zoekresultaten privépakketten zien van uitgevers waartoe ze behoren.
- `channel=private` retourneert alleen pakketten die de geauthenticeerde aanroeper mag lezen.

### `GET /api/v1/packages/search`

Uniform zoeken in de catalogus voor Skills en pluginpakketten.

Queryparameters:

- `q` (vereist): querytekenreeks
- `limit` (optioneel): geheel getal (1–100)
- `family` (optioneel): `skill`, `code-plugin` of `bundle-plugin`
- `channel` (optioneel): `official`, `community` of `private`
- `isOfficial` (optioneel): `true` of `false`
- `category` (optioneel): filter voor Plugin-categorieën. Wordt alleen ondersteund wanneer de
  aanvraag is beperkt tot Plugin-pakketten. Beheerde categorieën en verouderde v1-
  filteraliassen worden beschreven onder `GET /api/v1/plugins`.

Opmerkingen:

- Ongeldige waarden voor `family`, `channel`, `isOfficial`, `featured` of
  `highlightedOnly` retourneren `400`. Onbekende queryparameters worden genegeerd.
- Anonieme aanroepers zien alleen openbare pakketkanalen.
- Geverifieerde aanroepers kunnen zoeken in privépakketten van uitgevers waartoe ze behoren.
- `channel=private` retourneert alleen pakketten die de geverifieerde aanroeper kan lezen.

### `GET /api/v1/plugins`

Bladeren door de catalogus, uitsluitend voor Plugins, in code-Plugin- en bundel-Plugin-pakketten.

Queryparameters:

- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): pagineringscursor
- `isOfficial` (optioneel): `true` of `false`
- `sort` (optioneel): `recommended` (standaard), `trending`, `downloads`, `updated`, verouderde alias `installs`
- `category` (optioneel): filter voor Plugin-categorieën. Huidige waarden:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Verouderde v1-filteraliassen worden nog steeds geaccepteerd op leeseindpunten:

- `mcp-tooling`, `data` en `automation` worden omgezet naar `tools`.
- `observability` en `deployment` worden omgezet naar `gateway`.
- `dev-tools` wordt omgezet naar `runtime`.

`trending` is een ranglijst voor installaties/downloads over zeven dagen en gebruikt geen totalen over de volledige periode.
Op het uniforme eindpunt `/api/v1/packages` geldt dit alleen voor Plugins; gebruik
`/api/v1/skills?sort=trending` voor de Skills-catalogus.

Verouderde aliassen worden niet geaccepteerd als opgeslagen of door auteurs opgegeven categoriewaarden.

### `GET /api/v1/skills/export`

Bulkexport van de nieuwste openbare Skills voor offlineanalyse.

Authenticatie:

- API-token vereist.

Queryparameters:

- `startDate` (vereist): ondergrens in Unix-milliseconden voor Skill-`updatedAt`.
- `endDate` (vereist): bovengrens in Unix-milliseconden voor Skill-`updatedAt`.
- `limit` (optioneel): geheel getal (1-250), standaard `250`.
- `cursor` (optioneel): pagineringscursor uit het vorige antwoord.

Antwoord:

- Hoofdtekst: ZIP-archief.
- Elke geëxporteerde Skill heeft zijn hoofdmap op `{publisher}/{slug}/`.
- Gehoste Skills bevatten de nieuwste opgeslagen versiebestanden en worden vermeld in
  `_manifest.json` met `sourceRef: "public-clawhub"`.
- Huidige door GitHub ondersteunde Skills met een `clean`- of `suspicious`-scan bevatten
  `_source_handoff.json` met `sourceRef: "public-github"`, opslagplaats, commit, pad,
  inhoudshash en archief-URL. Ze bevatten geen door ClawHub gehoste bronbestanden.
- Elke Skill bevat `_export_skill_meta.json`.
- `_manifest.json` wordt altijd opgenomen in de hoofdmap van het ZIP-bestand.
- `_errors.json` wordt opgenomen wanneer afzonderlijke Skills of bestanden niet konden worden
  geëxporteerd.

Headers:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Bulkexport van de nieuwste openbare Plugin-releases voor offlineanalyse.

Authenticatie:

- API-token vereist.

Queryparameters:

- `startDate` (vereist): ondergrens in Unix-milliseconden voor Plugin-`updatedAt`.
- `endDate` (vereist): bovengrens in Unix-milliseconden voor Plugin-`updatedAt`.
- `limit` (optioneel): geheel getal (1-250), standaard `250`.
- `cursor` (optioneel): pagineringscursor uit het vorige antwoord.
- `family` (optioneel): `code-plugin` of `bundle-plugin`. Weglaten betekent beide
  Plugin-families.

Antwoord:

- Hoofdtekst: ZIP-archief.
- Elke geëxporteerde Plugin heeft zijn hoofdmap op `{family}/{packageName}/`.
- Elke geëxporteerde Plugin bevat de opgeslagen bestanden van de nieuwste release.
- Exportmetagegevens per Plugin worden opgeslagen in
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` wordt altijd opgenomen in de hoofdmap van het ZIP-bestand.
- `_errors.json` wordt opgenomen wanneer afzonderlijke Plugins of bestanden niet konden worden
  geëxporteerd.

Headers:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Zoeken uitsluitend naar Plugins in code-Plugin- en bundel-Plugin-pakketten.

Queryparameters:

- `q` (vereist): querytekenreeks
- `limit` (optioneel): geheel getal (1-100)
- `isOfficial` (optioneel): `true` of `false`
- `category` (optioneel): filter voor Plugin-categorieën. Huidige waarden:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Opmerkingen:

- De verouderde v1-filteraliassen die onder `GET /api/v1/plugins` worden beschreven, worden ook
  geaccepteerd.
- Categoriefiltering is een echt API-filter dat wordt ondersteund door digest-
  rijen voor Plugin-categorieën, geen herschrijving van een zoekquery.
- Resultaten worden in volgorde van relevantie geretourneerd en worden momenteel niet gepagineerd.
- Sorteerbesturingselementen in de browserinterface voor het zoeken naar Plugins herschikken de geladen relevantiresultaten,
  overeenkomstig het huidige bladergedrag van `/skills`.

### `GET /api/v1/packages/{name}`

Retourneert detailmetagegevens van het pakket.

Opmerkingen:

- Skills kunnen in de uniforme catalogus ook via deze route worden gevonden.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-uitgever kan lezen.

### `DELETE /api/v1/packages/{name}`

Verwijdert een pakket en alle releases voorlopig.

Opmerkingen:

- Vereist een API-token voor de pakketeigenaar, een eigenaar/beheerder van de organisatie-uitgever,
  platformmoderator of platformbeheerder.

### `GET /api/v1/packages/{name}/versions`

Retourneert de versiegeschiedenis.

Queryparameters:

- `limit` (optioneel): geheel getal (1–100)
- `cursor` (optioneel): pagineringscursor

Opmerkingen:

- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-uitgever kan lezen.

### `GET /api/v1/packages/{name}/versions/{version}`

Retourneert één pakketversie, inclusief bestandsmetagegevens, compatibiliteit,
verificatie, artefactmetagegevens en scangegevens.

Opmerkingen:

- `version.artifact.kind` is `legacy-zip` voor pakketarchieven uit het oude systeem of
  `npm-pack` voor door ClawPack ondersteunde releases.
- ClawPack-releases bevatten npm-compatibele velden `npmIntegrity`, `npmShasum` en
  `npmTarballName`.
- `version.sha256hash` zijn verouderde compatibiliteitsmetagegevens voor oude clients. Deze
  hashen de exacte ZIP-bytes die door `/api/v1/packages/{name}/download` worden geretourneerd.
  Moderne clients moeten `version.artifact.sha256` gebruiken, waarmee het
  canonieke releaseartefact wordt geïdentificeerd.
- `version.vtAnalysis`, `version.llmAnalysis` en `version.staticScan` worden
  opgenomen wanneer er scangegevens bestaan.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-uitgever kan lezen.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Retourneert de exacte samenvatting van de beveiliging en betrouwbaarheid van de pakketrelease voor installatieclients. Dit is het openbare OpenClaw-consumptieoppervlak om te bepalen of een
gevonden release kan worden geïnstalleerd.

Authenticatie:

- Openbaar leeseindpunt. Er is geen token van een eigenaar, uitgever, moderator of beheerder
  vereist.

Antwoord:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Voorbeeld-Plugin",
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

Antwoordvelden:

- `package.name`, `package.displayName` en `package.family` identificeren het
  gevonden registerpakket.
- `release.releaseId`, `release.version` en `release.createdAt` identificeren de
  exacte release die is geëvalueerd.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` en `release.npmTarballName` zijn aanwezig wanneer ze bekend zijn voor
  het releaseartefact.
- `trust.scanStatus` is de effectieve betrouwbaarheidsstatus die is afgeleid van scannerinvoer
  en handmatige releasemoderatie.
- `trust.moderationState` kan null zijn. Deze is `null` wanneer er geen handmatige
  releasemoderatie bestaat.
- `trust.blockedFromDownload` is het blokkeringssignaal voor installatie. OpenClaw en andere
  installatieclients moeten de installatie blokkeren wanneer deze waarde `true` is, in plaats van
  blokkeringsregels opnieuw af te leiden uit scanner- of moderatievelden.
- `trust.reasons` is de lijst met uitleg voor gebruikers en audits. Redencodes
  zijn stabiele, compacte tekenreeksen zoals `manual:quarantined`, `scan:malicious`
  en `package:malicious`.
- `trust.pending` betekent dat één of meer betrouwbaarheidsinvoerwaarden nog op voltooiing wachten.
- `trust.stale` betekent dat de betrouwbaarheidssamenvatting is berekend op basis van verouderde invoer en
  moet worden beschouwd als aan vernieuwing toe voordat met hoge zekerheid een toestemmingsbeslissing wordt genomen.

Opmerkingen:

- Dit eindpunt is versiespecifiek. Clients moeten het aanroepen nadat ze de
  pakketversie hebben gevonden die ze willen installeren, niet alleen nadat ze de nieuwste
  pakketmetagegevens hebben gelezen.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-uitgever kan lezen.
- Dit eindpunt is bewust beperkter dan moderatie-eindpunten voor eigenaren/moderators.
  Het maakt de installatiebeslissing en openbare uitleg zichtbaar, maar niet
  de identiteit van melders, de inhoud van meldingen, privébewijs of interne
  beoordelingstijdlijnen.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Retourneert de expliciete metagegevens van de artefactresolver voor een pakketversie.

Opmerkingen:

- Verouderde pakketversies retourneren een `legacy-zip`-artefact en een verouderde ZIP-
  `downloadUrl`.
- ClawPack-versies retourneren een `npm-pack`-artefact, npm-integriteitsvelden, een
  `tarballUrl` en de verouderde ZIP-compatibiliteits-URL.
- Dit is het OpenClaw-resolveroppervlak; hiermee wordt vermeden dat de archiefindeling op basis van
  een gedeelde URL wordt geraden.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Downloadt het versieartefact via het expliciete resolverpad.

Opmerkingen:

- ClawPack-versies streamen exact de geüploade npm-pack-`.tgz`-bytes.
- Verouderde ZIP-versies leiden om naar `/api/v1/packages/{name}/download?version=`.
- Gebruikt de downloadlimietbucket.

### `GET /api/v1/packages/{name}/readiness`

Retourneert de berekende gereedheid voor toekomstig gebruik door OpenClaw.

Gereedheidscontroles omvatten:

- status van het officiële kanaal
- beschikbaarheid van de nieuwste versie
- beschikbaarheid van het ClawPack npm-pack-artefact
- artefactdigest
- herkomst van bronrepository en commit
- OpenClaw-compatibiliteitsmetadata
- hostdoelen
- scanstatus

Respons:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Voorbeeldplugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack-artefact",
      "status": "fail",
      "message": "De nieuwste versie is uitsluitend beschikbaar als verouderde ZIP."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

Moderatorendpoint voor het weergeven van migratieregels voor officiële OpenClaw-plugins.

Authenticatie:

- Vereist een API-token voor een moderator- of beheerdersgebruiker.

Queryparameters:

- `phase` (optioneel): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` of
  `all` (standaard).
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): pagineringscursor

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
      "blockers": ["ClawPack ontbreekt"],
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

Beheerdersendpoint voor het maken of bijwerken van een migratieregel voor een officiële plugin.

Authenticatie:

- Vereist een API-token voor een beheerdersgebruiker.

Aanvraagbody:

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["ClawPack ontbreekt"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "wachten op upload door de uitgever"
}
```

Opmerkingen:

- `bundledPluginId` wordt genormaliseerd naar kleine letters en is de stabiele upsert-sleutel.
- `packageName` wordt genormaliseerd als npm-naam; het pakket mag ontbreken voor geplande
  migraties.
- Dit houdt alleen de migratiegereedheid bij. Het wijzigt OpenClaw niet en genereert
  geen ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Moderator-/beheerdersendpoint voor wachtrijen voor beoordeling van pakketreleases.

Authenticatie:

- Vereist een API-token voor een moderator- of beheerdersgebruiker.

Queryparameters:

- `status` (optioneel): `open` (standaard), `blocked`, `manual` of `all`
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): pagineringscursor

Betekenis van statussen:

- `open`: verdachte, schadelijke, openstaande, in quarantaine geplaatste, ingetrokken of gemelde releases.
- `blocked`: in quarantaine geplaatste, ingetrokken of schadelijke releases.
- `manual`: elke release met een handmatige moderatie-override.
- `all`: elke release met een handmatige override, een niet-schone scanstatus of een pakketmelding.

Respons:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Voorbeeldplugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "handmatige beoordeling",
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

Meld een pakket voor beoordeling door een moderator. Meldingen gelden op pakketniveau en kunnen
optioneel aan een versie worden gekoppeld. Ze worden aan de moderatiewachtrij toegevoegd, maar verbergen
of blokkeren downloads niet automatisch; moderators moeten releasemoderatie gebruiken om
artefacten goed te keuren, in quarantaine te plaatsen of in te trekken.

Authenticatie:

- Vereist een API-token.

Aanvraag:

```json
{ "reason": "Verdacht native binair bestand", "version": "1.2.3" }
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

Moderator-/beheerdersendpoint voor de intake van pakketmeldingen.

Authenticatie:

- Vereist een API-token voor een moderator- of beheerdersgebruiker.

Queryparameters:

- `status` (optioneel): `open` (standaard), `confirmed`, `dismissed` of `all`
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): pagineringscursor

Respons:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Voorbeeldplugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Verdacht native binair bestand",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Melder"
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

Eigenaar-/moderatorendpoint voor de zichtbaarheid van pakketmoderatie.

Authenticatie:

- Vereist een API-token voor de pakketeigenaar, een lid van de uitgever, een moderator of
  een beheerdersgebruiker.

Respons:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Voorbeeldplugin",
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
    "moderationReason": "handmatige beoordeling",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

Moderator-/beheerdersendpoint voor het afhandelen of heropenen van pakketmeldingen.

Aanvraag:

```json
{
  "status": "confirmed",
  "note": "Beoordeeld en de betreffende release in quarantaine geplaatst.",
  "finalAction": "quarantine"
}
```

`note` is vereist voor `confirmed` en `dismissed`; het mag worden weggelaten wanneer
`status` weer op `open` wordt ingesteld. Geef `finalAction: "quarantine"` of
`finalAction: "revoke"` door met een bevestigde melding om releasemoderatie toe te passen in dezelfde
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

Moderator-/beheerdersendpoint voor de beoordeling van pakketreleases.

Aanvraag:

```json
{ "state": "quarantined", "reason": "Verdachte native payload." }
```

Ondersteunde statussen:

- `approved`: handmatig beoordeeld en toegestaan.
- `quarantined`: geblokkeerd in afwachting van opvolging.
- `revoked`: geblokkeerd nadat een release eerder werd vertrouwd.

In quarantaine geplaatste en ingetrokken releases retourneren `403` vanuit routes voor het downloaden van artefacten.
Elke wijziging schrijft een vermelding naar het auditlogboek.

### `GET /api/v1/packages/{name}/file`

Retourneert onbewerkte tekstinhoud voor een pakketbestand.

Queryparameters:

- `path` (vereist)
- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste release.
- Gebruikt de leeslimietbucket, niet de downloadbucket.
- Binaire bestanden retourneren `415`.
- Limiet voor bestandsgrootte: 200KB.
- Openstaande VirusTotal-scans blokkeren leesbewerkingen niet; schadelijke releases kunnen elders nog steeds worden tegengehouden.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-uitgever mag lezen.

### `GET /api/v1/packages/{name}/download`

Downloadt het verouderde deterministische ZIP-archief voor een pakketrelease.

Queryparameters:

- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste release.
- Skills leiden om naar `GET /api/v1/download`.
- Plugin-/pakketarchieven zijn zipbestanden met een `package/`-hoofdmap, zodat oude OpenClaw-
  clients blijven werken.
- Deze route blijft uitsluitend ZIP gebruiken. Deze streamt geen ClawPack-`.tgz`-bestanden.
- Responsen bevatten de headers `ETag`, `Digest`, `X-ClawHub-Artifact-Type` en
  `X-ClawHub-Artifact-Sha256` voor integriteitscontroles door de resolver.
- Metadata die alleen in het register voorkomt, wordt niet in het gedownloade archief geïnjecteerd.
- Openstaande VirusTotal-scans blokkeren downloads niet; schadelijke releases retourneren `403`.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar is.

### `GET /api/npm/{package}`

Retourneert een npm-compatibele packument voor pakketversies die door ClawPack worden ondersteund.

Opmerkingen:

- Alleen versies met geüploade ClawPack npm-pack-tarballs worden weergegeven.
- Verouderde versies die uitsluitend als ZIP beschikbaar zijn, worden opzettelijk weggelaten.
- `dist.tarball`, `dist.integrity` en `dist.shasum` gebruiken npm-compatibele
  velden, zodat gebruikers npm desgewenst naar de mirror kunnen verwijzen.
- Packuments van pakketten met een scope ondersteunen zowel `/api/npm/@scope/name` als het
  gecodeerde aanvraagpad `/api/npm/@scope%2Fname` van npm.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Streamt exact de geüploade ClawPack-tarballbytes voor npm-mirrorclients.

Opmerkingen:

- Gebruikt de downloadlimietbucket.
- Downloadheaders bevatten de ClawHub SHA-256 plus npm-integriteits-/shasum-metadata.
- Controles voor moderatie en toegang tot privépakketten blijven van toepassing.

### `GET /api/v1/resolve`

Wordt door de CLI gebruikt om een lokale vingerafdruk aan een bekende versie te koppelen.

Queryparameters:

- `slug` (vereist)
- `hash` (vereist): hexadecimale sha256 van 64 tekens van de bundelvingerafdruk

Respons:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Downloadt een ZIP van een gehoste Skills-versie of retourneert een overdracht naar GitHub-broncode voor een
huidige door GitHub ondersteunde Skill met een `clean`- of `suspicious`-scan en zonder gehoste
versie.

Queryparameters:

- `slug` (vereist)
- `version` (optioneel): semver-tekenreeks
- `tag` (optioneel): tagnaam (bijv. `latest`)

Opmerkingen:

- Als noch `version` noch `tag` is opgegeven, wordt de nieuwste versie gebruikt.
- Zacht verwijderde versies retourneren `410`.
- Overdrachten van door GitHub ondersteunde Skills proxyen of spiegelen geen bytes. Het JSON-antwoord
  bevat `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  en `archiveUrl`; de scan-/huidige status is een poort en wordt niet opgenomen als metadata
  van de succesrespons.
- Downloadstatistieken worden geteld als unieke identiteiten per UTC-dag (`userId` wanneer het API-token geldig is, anders het IP-adres).

## Authenticatie-eindpunten (Bearer-token)

Alle eindpunten vereisen:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Valideert het token en retourneert de gebruikershandle.

### `POST /api/v1/skills`

Publiceert een nieuwe versie.

- Bij voorkeur: `multipart/form-data` met `payload`-JSON + `files[]`-blobs.
- Een JSON-body met `files` (gebaseerd op storageId) wordt ook geaccepteerd.
- Optioneel payloadveld: `ownerHandle`. Indien aanwezig, lost de API die
  uitgever server-side op en moet de actor uitgeverstoegang hebben.
- Optioneel payloadveld: `migrateOwner`. Wanneer `true` met `ownerHandle`, kan
  een bestaande Skill naar die eigenaar worden verplaatst als de actor beheerder/eigenaar is bij zowel
  de huidige als de doeluitgever. Zonder deze expliciete toestemming worden eigenaarswijzigingen
  geweigerd.

### `POST /api/v1/packages`

Publiceert een release van een codeplugin of bundelplugin.

- Vereist authenticatie met een Bearer-token.
- Vereist `multipart/form-data`.
- Toegestane formuliervelden zijn `payload`, herhaalde `files`-blobs of één `clawpack`-
  tarballverwijzing. `clawpack` mag een `.tgz`-blob zijn of een opslag-ID die door
  de upload-URL-stroom is geretourneerd. Gefaseerde publicaties met een opslag-ID moeten ook het
  met die upload-URL geretourneerde `clawpackUploadTicket` bevatten.
- Gebruik `files` of `clawpack`, nooit beide in hetzelfde verzoek.
- JSON-body's en door de aanroeper aangeleverde `payload.files`- / `payload.artifact`-
  metadata worden geweigerd.
- Rechtstreekse multipart-publicatieverzoeken zijn beperkt tot 18MB. ClawPack-tarballs mogen
  de upload-URL-stroom gebruiken tot de tarballlimiet van 120MB.
- Optioneel payloadveld: `ownerHandle`. Indien aanwezig, mogen alleen beheerders namens die eigenaar publiceren.

Hoogtepunten van de validatie:

- `family` moet `code-plugin` of `bundle-plugin` zijn.
- Pluginpakketten vereisen `openclaw.plugin.json`. ClawPack-uploads van `.tgz` moeten
  dit bevatten op `package/openclaw.plugin.json`.
- Codeplugins vereisen `package.json`, metadata van de bronrepository, metadata van de
  broncommit, metadata van het configuratieschema, `openclaw.compat.pluginApi` en
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` en `openclaw.environment` zijn optionele metadata.
- Alleen de organisatie-uitgever `openclaw` en de persoonlijke uitgevers van huidige leden
  van de organisatie `openclaw` mogen naar het kanaal `official` publiceren.
- Bij publicaties namens anderen wordt de geschiktheid voor het officiële kanaal nog steeds gevalideerd aan de hand van het account van de doeleigenaar.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Een Skill zacht verwijderen/herstellen (eigenaar, moderator of beheerder).

Optionele JSON-body:

```json
{ "reason": "Vastgehouden voor moderatie in afwachting van juridische beoordeling." }
```

Indien aanwezig, wordt `reason` opgeslagen als moderatienotitie voor de Skill en naar het auditlogboek gekopieerd.
Bij door de eigenaar geïnitieerde zachte verwijderingen blijft de slug 30 dagen gereserveerd, waarna de slug door
een andere uitgever kan worden geclaimd. De verwijderingsrespons bevat `slugReservedUntil` wanneer deze vervaldatum van toepassing is.
Verbergingen door moderators/beheerders en verwijderingen om veiligheidsredenen verlopen niet op deze manier.

Verwijderingsrespons:

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

Alleen voor beheerders. Zorgt dat er een organisatie-uitgever voor een handle bestaat. Als de handle nog steeds naar een
verouderde gedeelde gebruikers-/persoonlijke uitgever verwijst, migreert het eindpunt deze eerst naar een organisatie-uitgever.
Geef voor een nieuw aangemaakte organisatie `memberHandle` op; de handelende beheerder wordt niet als lid toegevoegd.
`memberRole` is standaard `owner`.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Respons: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Zelfbedieningsaanmaak van een organisatie-uitgever met authenticatie. Maakt een nieuwe organisatie-uitgever aan en voegt de
aanroeper toe als eigenaar. Dit eindpunt migreert geen bestaande gebruikers-/persoonlijke handles en markeert
de uitgever niet als vertrouwd/officieel.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Respons: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Retourneert `409` wanneer de handle al door een uitgever, gebruiker of persoonlijke uitgever wordt gebruikt.

### `POST /api/v1/users/reserve`

Alleen voor beheerders. Reserveert hoofdslugs en pakketnamen voor de rechtmatige eigenaar zonder een
release te publiceren. Pakketnamen worden privé-placeholderpakketten zonder releaserijen, zodat dezelfde
eigenaar later de echte release van de codeplugin of bundelplugin onder die naam kan publiceren.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Respons: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Alleen voor beheerders. Herstelt een persoonlijke uitgever voor een geverifieerde vervangende GitHub OAuth-principal
zonder Convex Auth-accountrijen te bewerken. Het verzoek moet beide onveranderlijke GitHub-
provideraccount-ID's vermelden; veranderlijke handles worden alleen gebruikt als beveiliging voor de operator.

Het eindpunt voert standaard een proefrun uit. Voor het toepassen van herstel zijn `dryRun: false` en
`confirmIdentityVerified: true` vereist nadat medewerkers onafhankelijk de continuïteit tussen beide
GitHub-principals hebben geverifieerd. Herstel wordt veilig geweigerd wanneer de huidige persoonlijke
uitgever van de doelgebruiker Skills, pakketten of GitHub-Skillbronnen heeft.
Herstel migreert ook verouderde `ownerUserId`-velden voor de Skills van de herstelde uitgever,
Skill-slugaliassen, pakketten, waarschuwingen van de pakketinspecteur en afgeleide zoekdigest-rijen, zodat
paden met directe eigenaars overeenkomen met de nieuwe uitgeversautoriteit. Een actieve reservering van een
beschermde handle voor de herstelde handle wordt ook opnieuw toegewezen aan de vervangende gebruiker, zodat latere
profielsynchronisatie de concurrerende autoriteit van de voormalige gebruiker niet kan herstellen. Elke primaire tabel is beperkt tot
100 rijen per toepassingstransactie; grotere herstelacties moeten eerst een hervatbare eigenaarsmigratie gebruiken.
GitHub-Skillbronnen hebben een uitgeversbereik en worden gerapporteerd als gecontroleerd in plaats van herschreven.

- Body: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Respons: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Eindpunten voor beheer van eigenaars-slugs

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Respons: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Respons: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Opmerkingen:

- Beide eindpunten vereisen authenticatie met een API-token en werken alleen voor de eigenaar van de Skill.
- `rename` behoudt de vorige slug als omleidingsalias.
- `merge` verbergt de bronvermelding en leidt de bronslug om naar de doelvermelding.

### Eindpunten voor eigendomsoverdracht

- `POST /api/v1/skills/{slug}/transfer`
  - Body: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Respons: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Respons (accepteren/weigeren/annuleren): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Responsstructuur: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Verban een gebruiker en verwijder diens Skills permanent (alleen moderator/beheerder).

Body:

```json
{ "handle": "user_handle", "reason": "optionele reden voor verbanning" }
```

of

```json
{ "userId": "users_...", "reason": "optionele reden voor verbanning" }
```

Respons:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Hef de verbanning van een gebruiker op en herstel in aanmerking komende Skills (alleen beheerder).

Body:

```json
{ "handle": "user_handle", "reason": "optionele reden voor opheffing van verbanning" }
```

of

```json
{ "userId": "users_...", "reason": "optionele reden voor opheffing van verbanning" }
```

Respons:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Wijzig de opgeslagen reden voor een bestaande verbanning zonder de verbanning op te heffen of
inhoud te herstellen (alleen beheerder). Voert standaard een proefrun uit, tenzij `dryRun` `false` is.

Body:

```json
{ "handle": "user_handle", "reason": "spam door massapublicatie", "dryRun": true }
```

of

```json
{ "userId": "users_...", "reason": "spam door massapublicatie", "dryRun": false }
```

Respons:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "automatische verbanning wegens malware",
  "nextReason": "spam door massapublicatie",
  "changed": true
}
```

### `POST /api/v1/users/role`

Wijzig een gebruikersrol (alleen beheerder).

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

Gebruikers weergeven of zoeken (alleen beheerder).

Queryparameters:

- `q` (optioneel): zoekopdracht
- `query` (optioneel): alias voor `q`
- `limit` (optioneel): maximumaantal resultaten (standaard 20, maximaal 200)

Respons:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "Gebruiker",
      "name": "Gebruiker",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

Een ster toevoegen/verwijderen (uitgelichte items). Beide eindpunten zijn idempotent.

Responsen:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Verouderde CLI-eindpunten (afgeraden)

Nog steeds ondersteund voor oudere CLI-versies:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Zie `DEPRECATIONS.md` voor het verwijderingsplan.

`POST /api/cli/upload-url` retourneert `uploadUrl` en `uploadTicket`. Pakketpublicaties
die een ClawPack-tarball klaarzetten, moeten het resulterende opslag-ID verzenden als
`clawpack` en het geretourneerde ticket als `clawpackUploadTicket`.

## Registerdetectie (`/.well-known/clawhub.json`)

De CLI kan register-/authenticatie-instellingen van de site detecteren:

- `/.well-known/clawhub.json` (JSON, bij voorkeur)
- `/.well-known/clawdhub.json` (verouderd)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Als je zelf host, bied je dit bestand aan (of stel je `CLAWHUB_REGISTRY` expliciet in; verouderd: `CLAWDHUB_REGISTRY`).
