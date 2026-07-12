---
read_when:
    - Eindpunten toevoegen/wijzigen
    - CLI ↔ registerverzoeken debuggen
summary: HTTP-API-referentie (openbare + CLI-eindpunten + authenticatie).
x-i18n:
    generated_at: "2026-07-12T08:39:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP-API

Basis-URL: `https://clawhub.ai` (standaard).

Alle v1-paden vallen onder `/api/v1/...`.
De verouderde paden `/api/...` en `/api/cli/...` blijven beschikbaar voor compatibiliteit (zie `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Hergebruik van de openbare catalogus

Externe directory's mogen de openbare leesendpoints gebruiken om ClawHub-Skills weer te geven of te doorzoeken. Cache de resultaten, respecteer `429`/`Retry-After`, verwijs gebruikers terug naar de canonieke ClawHub-vermelding (`https://clawhub.ai/<owner>/skills/<slug>`) en wek niet de indruk dat ClawHub de externe site onderschrijft. Probeer geen verborgen, privé- of door moderatie geblokkeerde inhoud buiten het openbare API-oppervlak te spiegelen.

Snelkoppelingen voor webslugs worden opgelost over registerfamilies heen, maar API-clients moeten
de canonieke URL's gebruiken die leesendpoints retourneren, in plaats van de
routeprioriteit te reconstrueren.

## Snelheidslimieten

Handhavingsmodel:

- Anonieme verzoeken: gehandhaafd per IP-adres.
- Geauthenticeerde verzoeken (geldig Bearer-token): gehandhaafd per gebruikersgroep.
- Als het token ontbreekt of ongeldig is, valt het gedrag terug op handhaving per IP-adres.
- Geauthenticeerde schrijfendpoints mogen niet alleen `Unauthorized` retourneren wanneer
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

- `X-RateLimit-Reset`: absolute Unix-epochtijd in seconden
- `RateLimit-Reset`: aantal seconden tot de reset (vertraging)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: exact resterend quotum indien aanwezig.
  Geslaagde gesharde verzoeken laten deze header weg in plaats van een geschatte globale waarde te retourneren.
- `Retry-After`: aantal seconden dat moet worden gewacht voordat opnieuw wordt geprobeerd (vertraging) bij `429`

Voorbeeld van een `429`-antwoord:

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

Snelheidslimiet overschreden
```

Richtlijnen voor clients:

- Als `Retry-After` bestaat, wacht dan dat aantal seconden voordat u het opnieuw probeert.
- Gebruik back-off met jitter om gesynchroniseerde nieuwe pogingen te voorkomen.
- Als `Retry-After` ontbreekt, val dan terug op `RateLimit-Reset` (of bereken de waarde op basis van `X-RateLimit-Reset`).

IP-bron:

- Gebruikt vertrouwde headers voor client-IP-adressen, waaronder `cf-connecting-ip`, alleen wanneer de
  implementatie vertrouwde doorgestuurde headers expliciet inschakelt.
- ClawHub gebruikt vertrouwde doorstuurheaders om client-IP-adressen aan de rand te identificeren.
- Als er geen vertrouwd client-IP-adres beschikbaar is, gebruiken anonieme verzoeken terugvalgroepen
  die alleen zijn afgebakend op basis van het type snelheidslimiet. Deze terugvalgroepen bevatten geen
  door de aanroeper opgegeven paden, slugs, pakketnamen, versies, queryreeksen of andere
  artefactparameters.

## Foutantwoorden

Openbare v1-foutantwoorden zijn platte tekst met `content-type: text/plain; charset=utf-8`.
Dit omvat validatiefouten (`400`), ontbrekende openbare bronnen (`404`), authenticatie- en
machtigingsfouten (`401`/`403`), snelheidslimieten (`429`) en geblokkeerde downloads. Clients
moeten de antwoordtekst lezen als een voor mensen leesbare tekenreeks. Onbekende queryparameters worden
voor compatibiliteit genegeerd, maar herkende queryparameters met ongeldige waarden retourneren
`400`.

## Openbare endpoints (geen authenticatie)

### `GET /api/v1/search`

Queryparameters:

- `q` (verplicht): queryreeks
- `limit` (optioneel): geheel getal
- `highlightedOnly` (optioneel): `true` om te filteren op uitgelichte Skills
- `nonSuspiciousOnly` (optioneel): `true` om verdachte (`flagged.suspicious`) Skills te verbergen
- `nonSuspicious` (optioneel): verouderde alias voor `nonSuspiciousOnly`

Antwoord:

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

- Resultaten worden geretourneerd in volgorde van relevantie (overeenkomst van embeddings + versterking voor exacte slug-/naamtokens + een kleine voorafgaande populariteitsweging).
- Relevantie weegt zwaarder dan populariteit. Een exacte overeenkomst met een slug- of weergavenaamtoken kan hoger scoren dan een minder nauwkeurige overeenkomst met veel meer betrokkenheid.
- ASCII-tekst wordt getokeniseerd op woord- en leestekengrenzen. Zo bevat `personal-map` een zelfstandig `map`-token, terwijl `amap-jsapi-skill` de tokens `amap`, `jsapi` en `skill` bevat; zoeken naar `map` geeft `personal-map` daarom een sterkere lexicale overeenkomst dan `amap-jsapi-skill`.
- Populariteit wordt logaritmisch geschaald en begrensd. Skills met veel betrokkenheid kunnen lager scoren wanneer de querytekst minder goed overeenkomt.
- Een verdachte of verborgen moderatiestatus kan een Skill uit openbare zoekresultaten verwijderen, afhankelijk van de filters van de aanroeper en de huidige moderatiestatus.

Richtlijnen voor vindbaarheid van uitgevers:

- Plaats de termen waarop gebruikers letterlijk zullen zoeken in de weergavenaam, samenvatting en tags. Gebruik alleen een zelfstandig slugtoken als dit ook een stabiele identiteit is die u wilt behouden.
- Wijzig een slug niet alleen om op één query in te spelen, tenzij de nieuwe slug op lange termijn een betere canonieke naam is. Oude slugs worden omleidingsaliassen, maar de canonieke URL, de weergegeven slug en toekomstige zoekoverzichten gebruiken de nieuwe slug.
- Hernoemingsaliassen behouden de resolutie voor oude URL's en installaties die via het register worden opgelost, maar de zoekrangschikking is gebaseerd op de canonieke Skill-metadata nadat de hernoeming is geïndexeerd. Bestaande statistieken blijven bij de Skill.
- Als een Skill onverwacht onzichtbaar is, controleer dan eerst de moderatiestatus met `clawhub inspect @owner/slug` terwijl u bent aangemeld, voordat u metadata wijzigt die verband houden met de rangschikking.

### `GET /api/v1/skills`

Queryparameters:

- `limit` (optioneel): geheel getal (1–200)
- `cursor` (optioneel): pagineringscursor voor elke sortering behalve `trending`
- `sort` (optioneel): `updated` (standaard), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), verouderde installatiealiassen `installsCurrent`/`installs`/`installsAllTime` worden toegewezen aan `downloads`, `trending`
- `nonSuspiciousOnly` (optioneel): `true` om verdachte (`flagged.suspicious`) Skills te verbergen
- `nonSuspicious` (optioneel): verouderde alias voor `nonSuspiciousOnly`

Ongeldige waarden voor `sort` retourneren `400`.

Opmerkingen:

- `recommended` gebruikt signalen voor betrokkenheid en recentheid.
- `trending` rangschikt op basis van installaties in de afgelopen 7 dagen (gebaseerd op telemetrie).
- `createdAt` is stabiel voor crawls van nieuwe Skills; `updated` verandert wanneer bestaande Skills opnieuw worden gepubliceerd.
- Wanneer `nonSuspiciousOnly=true`, kunnen cursorgebaseerde sorteringen minder dan `limit` items op een pagina retourneren, omdat verdachte Skills na het ophalen van de pagina worden uitgefilterd.
- Gebruik `nextCursor` om door te gaan met pagineren wanneer deze aanwezig is. Een korte pagina betekent op zichzelf niet dat het einde van de resultaten is bereikt.

Antwoord:

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

Antwoord:

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

- Oude slugs die door hernoemings-/samenvoegingsprocessen van de eigenaar zijn gemaakt, worden omgezet naar de canonieke Skill.
- `metadata.os`: besturingssysteembeperkingen die in de frontmatter van de Skill zijn opgegeven (bijv. `["macos"]`, `["linux"]`). `null` indien niet opgegeven.
- `metadata.systems`: Nix-systeemdoelen (bijv. `["aarch64-darwin", "x86_64-linux"]`). `null` indien niet opgegeven.
- `metadata` is `null` als de Skill geen platformmetadata heeft.
- `moderation` wordt alleen opgenomen wanneer de Skill is gemarkeerd of wanneer de eigenaar deze bekijkt.

### `GET /api/v1/skills/{slug}/moderation`

Retourneert een gestructureerde moderatiestatus.

Antwoord:

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
- Openbare aanroepers krijgen alleen `200` voor zichtbare Skills die al zijn gemarkeerd.
- Bewijs wordt voor openbare aanroepers geredigeerd en bevat alleen onbewerkte fragmenten voor eigenaren/moderators.

### `POST /api/v1/skills/{slug}/report`

Meld een Skill voor beoordeling door een moderator. Meldingen gelden voor de hele Skill, kunnen optioneel
aan een versie worden gekoppeld en worden toegevoegd aan de wachtrij voor Skill-meldingen.

Authenticatie:

- Vereist een API-token.

Verzoek:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

Antwoord:

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

Endpoint voor moderators/beheerders voor de intake van Skill-meldingen.

Queryparameters:

- `status` (optioneel): `open` (standaard), `confirmed`, `dismissed` of `all`
- `limit` (optioneel): geheel getal (1-200)
- `cursor` (optioneel): pagineringscursor

Antwoord:

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

Endpoint voor moderators/beheerders om Skill-meldingen af te handelen of opnieuw te openen.

Verzoek:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` is verplicht voor `confirmed` en `dismissed`; deze mag worden weggelaten wanneer
`status` weer op `open` wordt ingesteld. Geef `finalAction: "hide"` door met een beoordeelde
melding om de Skill binnen dezelfde controleerbare workflow te verbergen.

### `GET /api/v1/skills/{slug}/versions`

Queryparameters:

- `limit` (optioneel): geheel getal
- `cursor` (optioneel): pagineringscursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Retourneert versiemetadata en een bestandenlijst.

- `version.security` bevat de genormaliseerde verificatiestatus van de scan en details van de scanners
  (VirusTotal + LLM), indien beschikbaar.

### `GET /api/v1/skills/{slug}/scan`

Retourneert details over de verificatie van de beveiligingsscan voor een Skill-versie.

Queryparameters:

- `version` (optioneel): specifieke versietekenreeks.
- `tag` (optioneel): een getagde versie omzetten (bijvoorbeeld `latest`).

Opmerkingen:

- Als noch `version` noch `tag` is opgegeven, wordt de nieuwste versie gebruikt.
- Bevat de genormaliseerde verificatiestatus plus scannerspecifieke details.
- `security.hasScanResult` is alleen `true` wanneer een scanner een definitief oordeel heeft gegeven (`clean`, `suspicious` of `malicious`).
- `moderation` is een actuele moderatiemomentopname op Skill-niveau, afgeleid van de nieuwste versie.
- Controleer bij het opvragen van een historische versie `moderation.matchesRequestedVersion` en `moderation.sourceVersion` voordat u `moderation` en `security` als dezelfde versiecontext beschouwt.

### `POST /api/v1/skills/-/scan`

Geauthenticeerd indieningseindpunt voor nieuwe ClawScan-taken.

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

- Payloads van scanverzoeken en downloadbare rapporten verlopen in de opslag voor scanverzoeken nadat de bewaartermijn is verstreken.
- Gepubliceerde scans vereisen beheerstoegang als eigenaar/uitgever, of bevoegdheid als platformmoderator/-beheerder.
- Gepubliceerde scans schrijven resultaten alleen terug wanneer `update: true` is en de scan met succes wordt voltooid.
- Het antwoord is `202` met `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Scantaken zijn asynchroon. Handmatige scanverzoeken krijgen voorrang boven normale publicatie- en aanvulwerkzaamheden, maar voltooiing blijft afhankelijk van de beschikbaarheid van workers.

### `GET /api/v1/skills/-/scan/{scanId}`

Geauthenticeerd poll-eindpunt voor een ingediende scan.

- Retourneert de status in wachtrij/actief/geslaagd/mislukt.
- Retourneert `queue.queuedAhead` en `queue.position` zolang het verzoek in de wachtrij staat, zodat clients kunnen tonen hoeveel handmatige scans met prioriteit vóór het verzoek staan. Zeer grote wachtrijen worden begrensd en gerapporteerd met `queuedAheadIsEstimate: true`.
- Indien beschikbaar bevat `report` de secties `clawscan`, `skillspector`, `staticAnalysis` en `virustotal`.
- Mislukte scantaken retourneren `status: "failed"` met `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Geauthenticeerd eindpunt voor rapportarchieven.

- Vereist een geslaagde scan; niet-afgeronde scans retourneren `409`.
- Retourneert een ZIP-bestand met `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` en `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Geauthenticeerd eindpunt voor opgeslagen rapportarchieven van ingediende versies.

- Vereist beheerstoegang als eigenaar/uitgever tot de Skill of Plugin, of bevoegdheid als platformmoderator/-beheerder.
- Retourneert opgeslagen scanresultaten voor exact de ingediende versie, inclusief geblokkeerde of verborgen versies.
- `kind` is standaard `skill`; gebruik `kind=plugin` voor scans van Plugins/pakketten.
- Retourneert dezelfde ZIP-structuur als downloads van scanverzoeken.

### `POST /api/v1/skills/-/scan/batch`

Canonieke route voor batchgewijs opnieuw scannen, alleen voor beheerders. Deze accepteert dezelfde payloadstructuur als de verouderde route `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Canonieke route voor batchstatus, alleen voor beheerders. Deze accepteert `{ "jobIds": ["..."] }` en retourneert dezelfde geaggregeerde tellers als de verouderde route `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Retourneert de Skill Card-verificatie-envelop die door `clawhub skill verify` wordt gebruikt.

Queryparameters:

- `version` (optioneel): specifieke versietekenreeks.
- `tag` (optioneel): een getagde versie omzetten (bijvoorbeeld `latest`).

Opmerkingen:

- `ok` is alleen `true` wanneer voor de geselecteerde versie een Skill Card is gegenereerd, deze niet wegens malware door moderatie is geblokkeerd en de ClawScan-verificatie schoon is.
- De Skill-identiteit, uitgeversidentiteit en metagegevens van de geselecteerde versie zijn velden op het hoogste niveau van de envelop (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), zodat shellautomatisering ze kan lezen zonder geneste wrappers uit te pakken.
- `security` is het ClawScan-/beveiligingsoordeel op het hoogste niveau. Automatisering moet zich baseren op `ok`, `decision`, `reasons` en `security.status`.
- `security.signals` bevat ondersteunend scannerbewijs, zoals `staticScan`, `virusTotal` en `skillSpector`.
- `security.signals.dependencyRegistry` blijft behouden voor compatibiliteit met v1-antwoorden, maar de scanner voor het bestaan van afhankelijkheden in het register is buiten gebruik gesteld en deze sleutel is altijd `null`.
- `provenance` is alleen `server-resolved-github-import` wanneer ClawHub tijdens publicatie of import een GitHub-repository/-referentie/-commit/-pad heeft omgezet en opgeslagen; anders is de waarde `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Retourneert actuele compacte beveiligingsoordelen voor exacte Skill-versies. Dit
collectie-eindpunt is bedoeld voor clients die al weten welke geïnstalleerde
ClawHub Skill-versies ze moeten weergeven, zoals OpenClaw Control UI.

Verzoek:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Opmerkingen:

- `items` moet 1-100 unieke `{ slug, version }`-paren bevatten.
- Resultaten worden per item geretourneerd; één ontbrekende Skill of versie laat niet het volledige antwoord mislukken.
- Het antwoord bevat uitsluitend beveiligingsgegevens. Het bevat geen Skill Card-gegevens, status van gegenereerde kaarten, lijsten met artefactbestanden of gedetailleerde scannerpayloads.
- `security.signals` bevat alleen ondersteunend bewijs op statusniveau; gebruik `/scan` of de ClawHub-pagina voor beveiligingsaudits voor volledige scannerdetails.
- `security.signals.dependencyRegistry` blijft behouden voor compatibiliteit met v1-antwoorden, maar de scanner voor het bestaan van afhankelijkheden in het register is buiten gebruik gesteld en deze sleutel is altijd `null`.
- Het ontbreken van een Skill Card heeft geen invloed op `ok`, `decision` of `reasons` van dit eindpunt; clients moeten het geïnstalleerde `skill-card.md` lokaal lezen wanneer ze de kaartinhoud nodig hebben.
- Gebruik `/verify` wanneer u de Skill Card-verificatie-envelop voor één Skill nodig hebt, `/card` wanneer u gegenereerde kaart-Markdown nodig hebt en `/scan` wanneer u gedetailleerde scannergegevens nodig hebt.

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

Retourneert onbewerkte tekstinhoud.

Queryparameters:

- `path` (verplicht)
- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste versie.
- Maximale bestandsgrootte: 200 KB.

### `GET /api/v1/packages`

Geünificeerd cataloguseindpunt voor:

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
- `category` (optioneel): filter op plugincategorie. Wordt alleen ondersteund wanneer het
  verzoek is beperkt tot pluginpakketten (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` of pakketeindpunten met
  `family=code-plugin`/`family=bundle-plugin`). Beheerde categorieën en
  verouderde v1-filteraliassen zijn gedocumenteerd onder `GET /api/v1/plugins`.

Opmerkingen:

- Ongeldige waarden voor `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` of `sort` retourneren `400`. Onbekende queryparameters worden genegeerd.
- `GET /api/v1/code-plugins` en `GET /api/v1/bundle-plugins` blijven aliassen met een vaste familie.
- Skill-vermeldingen blijven gebaseerd op het Skill-register en kunnen nog steeds alleen via `POST /api/v1/skills` worden gepubliceerd.
- `POST /api/v1/packages` is nog steeds uitsluitend bedoeld voor releases van codeplugins en bundelplugins.
- Anonieme aanroepers zien alleen openbare pakketkanalen.
- Geverifieerde aanroepers kunnen in lijst- en zoekresultaten privépakketten zien van uitgevers waartoe ze behoren.
- `channel=private` retourneert alleen pakketten die de geverifieerde aanroeper kan lezen.

### `GET /api/v1/packages/search`

Geünificeerd zoeken in de catalogus voor Skills en pluginpakketten.

Queryparameters:

- `q` (verplicht): zoektekst
- `limit` (optioneel): geheel getal (1–100)
- `family` (optioneel): `skill`, `code-plugin` of `bundle-plugin`
- `channel` (optioneel): `official`, `community` of `private`
- `isOfficial` (optioneel): `true` of `false`
- `category` (optioneel): filter op plugincategorie. Wordt alleen ondersteund wanneer het
  verzoek is beperkt tot pluginpakketten. Beheerde categorieën en verouderde
  v1-filteraliassen zijn gedocumenteerd onder `GET /api/v1/plugins`.

Opmerkingen:

- Ongeldige waarden voor `family`, `channel`, `isOfficial`, `featured` of
  `highlightedOnly` retourneren `400`. Onbekende queryparameters worden genegeerd.
- Anonieme aanroepers zien alleen openbare pakketkanalen.
- Geverifieerde aanroepers kunnen zoeken in privépakketten van uitgevers waartoe ze behoren.
- `channel=private` retourneert alleen pakketten die de geverifieerde aanroeper kan lezen.

### `GET /api/v1/plugins`

Catalogusweergave uitsluitend voor plugins, voor codeplugin- en bundelpluginpakketten.

Queryparameters:

- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): pagineringscursor
- `isOfficial` (optioneel): `true` of `false`
- `sort` (optioneel): `recommended` (standaard), `trending`, `downloads`, `updated`, verouderde alias `installs`
- `category` (optioneel): filter op plugincategorie. Huidige waarden:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Verouderde v1-filteraliassen blijven geaccepteerd op leeseindpunten:

- `mcp-tooling`, `data` en `automation` worden omgezet naar `tools`.
- `observability` en `deployment` worden omgezet naar `gateway`.
- `dev-tools` wordt omgezet naar `runtime`.

`trending` is een ranglijst op basis van installaties/downloads over zeven dagen en gebruikt geen totalen over de gehele looptijd.
Op het geünificeerde eindpunt `/api/v1/packages` geldt dit alleen voor plugins; gebruik
`/api/v1/skills?sort=trending` voor de Skill-catalogus.

Verouderde aliassen worden niet geaccepteerd als opgeslagen of door auteurs opgegeven categoriewaarden.

### `GET /api/v1/skills/export`

Bulkexport van de nieuwste openbare Skills voor offlineanalyse.

Authenticatie:

- API-token vereist.

Queryparameters:

- `startDate` (verplicht): ondergrens in Unix-milliseconden voor `updatedAt` van de Skill.
- `endDate` (verplicht): bovengrens in Unix-milliseconden voor `updatedAt` van de Skill.
- `limit` (optioneel): geheel getal (1-250), standaard `250`.
- `cursor` (optioneel): pagineringscursor uit het vorige antwoord.

Antwoord:

- Inhoud: ZIP-archief.
- Elke geëxporteerde Skill heeft `{publisher}/{slug}/` als hoofdmap.
- Gehoste Skills bevatten de bestanden van de laatst opgeslagen versie en worden in
  `_manifest.json` vermeld met `sourceRef: "public-clawhub"`.
- Huidige door GitHub ondersteunde Skills met een scanstatus `clean` of `suspicious` bevatten
  `_source_handoff.json` met `sourceRef: "public-github"`, opslagplaats, commit, pad,
  inhoudshash en archief-URL. Ze bevatten geen door ClawHub gehoste bronbestanden.
- Elke Skill bevat `_export_skill_meta.json`.
- `_manifest.json` wordt altijd in de hoofdmap van het ZIP-archief opgenomen.
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

- `startDate` (vereist): ondergrens in Unix-milliseconden voor `updatedAt` van de Plugin.
- `endDate` (vereist): bovengrens in Unix-milliseconden voor `updatedAt` van de Plugin.
- `limit` (optioneel): geheel getal (1-250), standaard `250`.
- `cursor` (optioneel): pagineringscursor uit het vorige antwoord.
- `family` (optioneel): `code-plugin` of `bundle-plugin`. Weglaten betekent beide
  Plugin-families.

Antwoord:

- Body: ZIP-archief.
- Elke geëxporteerde Plugin heeft `{family}/{packageName}/` als hoofdmap.
- Elke geëxporteerde Plugin bevat de opgeslagen bestanden van de nieuwste release.
- Exportmetadata per Plugin wordt opgeslagen in
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` wordt altijd opgenomen in de hoofdmap van het ZIP-archief.
- `_errors.json` wordt opgenomen wanneer afzonderlijke Plugins of bestanden niet
  konden worden geëxporteerd.

Headers:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Zoeken naar uitsluitend Plugins in pakketten van het type code-plugin en bundle-plugin.

Queryparameters:

- `q` (vereist): zoektekenreeks
- `limit` (optioneel): geheel getal (1-100)
- `isOfficial` (optioneel): `true` of `false`
- `category` (optioneel): filter voor Plugin-categorie. Huidige waarden:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Opmerkingen:

- De verouderde v1-filteraliassen die zijn gedocumenteerd onder `GET /api/v1/plugins`, worden ook
  geaccepteerd.
- Filteren op categorie is een echt API-filter dat wordt ondersteund door digest-
  rijen voor Plugin-categorieën, geen herschrijving van de zoekquery.
- Resultaten worden op relevantie gerangschikt en momenteel niet gepagineerd.
- Sorteerregelaars in de browserinterface voor het zoeken naar Plugins herschikken de geladen relevantieresultaten,
  overeenkomstig het huidige bladergedrag van `/skills`.

### `GET /api/v1/packages/{name}`

Retourneert detailmetadata van het pakket.

Opmerkingen:

- Skills kunnen in de uniforme catalogus ook via deze route worden gevonden.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-uitgever mag lezen.

### `DELETE /api/v1/packages/{name}`

Verwijdert een pakket en alle releases logisch.

Opmerkingen:

- Vereist een API-token voor de pakketeigenaar, een eigenaar/beheerder van de organisatie-uitgever,
  platformmoderator of platformbeheerder.

### `GET /api/v1/packages/{name}/versions`

Retourneert de versiegeschiedenis.

Queryparameters:

- `limit` (optioneel): geheel getal (1–100)
- `cursor` (optioneel): pagineringscursor

Opmerkingen:

- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-uitgever mag lezen.

### `GET /api/v1/packages/{name}/versions/{version}`

Retourneert één pakketversie, inclusief bestandsmetadata, compatibiliteit,
verificatie, artefactmetadata en scangegevens.

Opmerkingen:

- `version.artifact.kind` is `legacy-zip` voor pakketarchieven volgens het oude model of
  `npm-pack` voor releases op basis van ClawPack.
- ClawPack-releases bevatten npm-compatibele velden `npmIntegrity`, `npmShasum` en
  `npmTarballName`.
- `version.sha256hash` is verouderde compatibiliteitsmetadata voor oude clients. Deze
  hasht exact de ZIP-bytes die worden geretourneerd door `/api/v1/packages/{name}/download`.
  Moderne clients moeten `version.artifact.sha256` gebruiken, waarmee het
  canonieke releaseartefact wordt geïdentificeerd.
- `version.vtAnalysis`, `version.llmAnalysis` en `version.staticScan` worden
  opgenomen wanneer scangegevens bestaan.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-uitgever mag lezen.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Retourneert de exacte beveiligings- en vertrouwenssamenvatting van de pakketrelease voor installatieclients.
Dit is het openbare OpenClaw-consumptieoppervlak om te bepalen of een
gevonden release kan worden geïnstalleerd.

Authenticatie:

- Openbaar leeseindpunt. Er is geen token van een eigenaar, uitgever, moderator of beheerder
  vereist.

Antwoord:

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

Antwoordvelden:

- `package.name`, `package.displayName` en `package.family` identificeren het
  gevonden registerpakket.
- `release.releaseId`, `release.version` en `release.createdAt` identificeren de
  exacte release die is beoordeeld.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` en `release.npmTarballName` zijn aanwezig wanneer ze bekend zijn voor
  het releaseartefact.
- `trust.scanStatus` is de effectieve vertrouwensstatus die is afgeleid van scannerinvoer
  en handmatige releasemoderatie.
- `trust.moderationState` kan null zijn. Deze is `null` wanneer er geen handmatige
  releasemoderatie bestaat.
- `trust.blockedFromDownload` is het blokkeersignaal voor installatie. OpenClaw en andere
  installatieclients moeten de installatie blokkeren wanneer deze waarde `true` is, in plaats van
  blokkeerregels opnieuw af te leiden uit scanner- of moderatievelden.
- `trust.reasons` is de voor gebruikers zichtbare lijst met verklaringen en auditinformatie. Redencodes
  zijn stabiele, compacte tekenreeksen zoals `manual:quarantined`, `scan:malicious`
  en `package:malicious`.
- `trust.pending` betekent dat een of meer vertrouwensinvoeren nog op voltooiing wachten.
- `trust.stale` betekent dat de vertrouwenssamenvatting is berekend op basis van verouderde invoer en
  moet worden beschouwd als te vernieuwen voordat met hoge zekerheid toestemming wordt gegeven.

Opmerkingen:

- Dit eindpunt is versiespecifiek. Clients moeten het aanroepen nadat ze de
  pakketversie hebben gevonden die ze willen installeren, niet alleen na het lezen van de nieuwste
  pakketmetadata.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-uitgever mag lezen.
- Dit eindpunt is bewust beperkter dan moderatie-eindpunten voor eigenaars/moderators.
  Het toont de installatiebeslissing en openbare toelichting, niet
  de identiteiten van melders, meldingsteksten, privébewijsmateriaal of interne beoordelingstijdlijnen.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Retourneert de expliciete metadata van de artefactresolver voor een pakketversie.

Opmerkingen:

- Verouderde pakketversies retourneren een `legacy-zip`-artefact en een verouderde ZIP-
  `downloadUrl`.
- ClawPack-versies retourneren een `npm-pack`-artefact, npm-integriteitsvelden, een
  `tarballUrl` en de verouderde ZIP-compatibiliteits-URL.
- Dit is het OpenClaw-resolveroppervlak; hiermee hoeft het archiefformaat niet te worden
  afgeleid uit een gedeelde URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Downloadt het versieartefact via het expliciete resolverpad.

Opmerkingen:

- ClawPack-versies streamen exact de geüploade npm-pack-`.tgz`-bytes.
- Verouderde ZIP-versies verwijzen door naar `/api/v1/packages/{name}/download?version=`.
- Gebruikt de snelheidslimietgroep voor downloads.

### `GET /api/v1/packages/{name}/readiness`

Retourneert de berekende gereedheid voor toekomstig gebruik door OpenClaw.

Gereedheidscontroles omvatten:

- officiële kanaalstatus
- beschikbaarheid van de nieuwste versie
- beschikbaarheid van het ClawPack npm-pack-artefact
- artefactdigest
- herkomst van bronrepository en commit
- OpenClaw-compatibiliteitsmetadata
- hostdoelen
- scanstatus

Antwoord:

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

Moderatoreindpunt voor het weergeven van officiële OpenClaw Plugin-migratierijen.

Authenticatie:

- Vereist een API-token voor een moderator- of beheerdersgebruiker.

Queryparameters:

- `phase` (optioneel): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` of
  `all` (standaard).
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): pagineringscursor

Antwoord:

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

Beheerdereindpunt voor het maken of bijwerken van een officiële Plugin-migratierij.

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
  "blockers": ["missing ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "waiting on publisher upload"
}
```

Opmerkingen:

- `bundledPluginId` wordt naar kleine letters genormaliseerd en is de stabiele upsert-sleutel.
- `packageName` wordt als npm-naam genormaliseerd; het pakket kan ontbreken voor geplande
  migraties.
- Hiermee wordt alleen de migratiegereedheid bijgehouden. OpenClaw wordt niet gewijzigd en er worden geen
  ClawPacks gegenereerd.

### `GET /api/v1/packages/moderation/queue`

Moderator-/beheerdereindpunt voor beoordelingswachtrijen van pakketreleases.

Authenticatie:

- Vereist een API-token voor een moderator- of beheerdersgebruiker.

Queryparameters:

- `status` (optioneel): `open` (standaard), `blocked`, `manual` of `all`
- `limit` (optioneel): geheel getal (1-100)
- `cursor` (optioneel): pagineringscursor

Betekenissen van statussen:

- `open`: verdachte, schadelijke, wachtende, in quarantaine geplaatste, ingetrokken of gemelde releases.
- `blocked`: in quarantaine geplaatste, ingetrokken of schadelijke releases.
- `manual`: elke release met een handmatige moderatie-override.
- `all`: elke release met een handmatige override, niet-schone scanstatus of pakketmelding.

Antwoord:

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

Meldt een pakket voor beoordeling door een moderator. Meldingen gelden voor het pakketniveau en zijn optioneel
gekoppeld aan een versie. Ze worden aan de moderatiewachtrij toegevoegd, maar verbergen niet automatisch
downloads en blokkeren deze ook niet zelfstandig; moderators moeten releasemoderatie gebruiken om
artefacten goed te keuren, in quarantaine te plaatsen of in te trekken.

Authenticatie:

- Vereist een API-token.

Aanvraag:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

Antwoord:

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

Moderator-/beheerdersendpoint voor de ontvangst van pakketmeldingen.

Authenticatie:

- Vereist een API-token voor een moderator of beheerder.

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

Endpoint voor eigenaren/moderators om inzicht te krijgen in pakketmoderatie.

Authenticatie:

- Vereist een API-token voor de pakketeigenaar, een lid van de uitgever, een moderator of
  een beheerder.

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

Moderator-/beheerdersendpoint voor het afhandelen of heropenen van pakketmeldingen.

Verzoek:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` is vereist voor `confirmed` en `dismissed`; deze mag worden weggelaten wanneer
`status` weer op `open` wordt gezet. Geef bij een bevestigde melding
`finalAction: "quarantine"` of `finalAction: "revoke"` door om releasemoderatie binnen
dezelfde controleerbare workflow toe te passen.

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

Verzoek:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Ondersteunde statussen:

- `approved`: handmatig beoordeeld en toegestaan.
- `quarantined`: geblokkeerd in afwachting van vervolgonderzoek.
- `revoked`: geblokkeerd nadat een release eerder werd vertrouwd.

In quarantaine geplaatste en ingetrokken releases retourneren `403` via routes voor het downloaden van artefacten.
Elke wijziging schrijft een vermelding naar het auditlogboek.

### `GET /api/v1/packages/{name}/file`

Retourneert de onbewerkte tekstinhoud van een pakketbestand.

Queryparameters:

- `path` (vereist)
- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste release.
- Gebruikt de leeslimietgroep, niet de downloadlimietgroep.
- Binaire bestanden retourneren `415`.
- Maximale bestandsgrootte: 200 KB.
- Lopende VirusTotal-scans blokkeren het lezen niet; schadelijke releases kunnen elders nog steeds worden achtergehouden.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar-uitgever mag lezen.

### `GET /api/v1/packages/{name}/download`

Downloadt het verouderde deterministische ZIP-archief voor een pakketrelease.

Queryparameters:

- `version` (optioneel)
- `tag` (optioneel)

Opmerkingen:

- Gebruikt standaard de nieuwste release.
- Skills worden omgeleid naar `GET /api/v1/download`.
- Plugin-/pakketarchieven zijn zipbestanden met een `package/`-hoofdmap, zodat oude OpenClaw-
  clients blijven werken.
- Deze route blijft uitsluitend voor ZIP. ClawPack-`.tgz`-bestanden worden niet gestreamd.
- Responsen bevatten de headers `ETag`, `Digest`, `X-ClawHub-Artifact-Type` en
  `X-ClawHub-Artifact-Sha256` voor integriteitscontroles door de resolver.
- Metagegevens die alleen voor het register zijn bedoeld, worden niet in het gedownloade archief geïnjecteerd.
- Lopende VirusTotal-scans blokkeren downloads niet; schadelijke releases retourneren `403`.
- Privépakketten retourneren `404`, tenzij de aanroeper de eigenaar is.

### `GET /api/npm/{package}`

Retourneert een npm-compatibele packument voor pakketversies die door ClawPack worden ondersteund.

Opmerkingen:

- Alleen versies met geüploade ClawPack-npm-pack-tarballs worden vermeld.
- Verouderde versies die alleen als ZIP beschikbaar zijn, worden opzettelijk weggelaten.
- `dist.tarball`, `dist.integrity` en `dist.shasum` gebruiken npm-compatibele
  velden, zodat gebruikers npm desgewenst naar de mirror kunnen verwijzen.
- Packuments van pakketten met een scope ondersteunen zowel `/api/npm/@scope/name` als het
  gecodeerde npm-verzoekpad `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Streamt exact de geüploade ClawPack-tarballbytes voor npm-mirrorclients.

Opmerkingen:

- Gebruikt de downloadlimietgroep.
- Downloadheaders bevatten de ClawHub-SHA-256 en npm-metagegevens voor integriteit/shasum.
- Controles op moderatie en toegang tot privépakketten blijven van toepassing.

### `GET /api/v1/resolve`

Wordt door de CLI gebruikt om een lokale vingerafdruk aan een bekende versie te koppelen.

Queryparameters:

- `slug` (vereist)
- `hash` (vereist): SHA-256 van 64 hexadecimale tekens van de bundelvingerafdruk

Respons:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Downloadt een ZIP van een gehoste Skill-versie of retourneert een overdracht naar de GitHub-bron voor een
huidige door GitHub ondersteunde Skill met een `clean`- of `suspicious`-scan en zonder gehoste
versie.

Queryparameters:

- `slug` (vereist)
- `version` (optioneel): semver-tekenreeks
- `tag` (optioneel): tagnaam (bijv. `latest`)

Opmerkingen:

- Als noch `version` noch `tag` is opgegeven, wordt de nieuwste versie gebruikt.
- Zacht verwijderde versies retourneren `410`.
- Overdrachten van door GitHub ondersteunde Skills proxyen of spiegelen geen bytes. De JSON-respons
  bevat `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  en `archiveUrl`; de scan-/huidige status dient als poortwachter en wordt niet als metagegeven
  in de succesrespons opgenomen.
- Downloadstatistieken worden per UTC-dag als unieke identiteiten geteld (`userId` wanneer het API-token geldig is, anders het IP-adres).

## Authenticatie-endpoints (Bearer-token)

Alle endpoints vereisen:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Valideert het token en retourneert de gebruikershandle.

### `POST /api/v1/skills`

Publiceert een nieuwe versie.

- Bij voorkeur: `multipart/form-data` met `payload`-JSON en `files[]`-blobs.
- Een JSON-body met `files` (op basis van storage-id's) wordt ook geaccepteerd.
- Optioneel payloadveld: `ownerHandle`. Indien aanwezig, zoekt de API die
  uitgever server-side op en moet de actor toegang tot de uitgever hebben.
- Optioneel payloadveld: `migrateOwner`. Wanneer dit `true` is met `ownerHandle`, mag een
  bestaande Skill naar die eigenaar worden verplaatst als de actor beheerder/eigenaar is bij zowel
  de huidige als de doeluitgever. Zonder deze expliciete inschakeling worden eigenaarswijzigingen
  geweigerd.

### `POST /api/v1/packages`

Publiceert een release van een code-Plugin of bundel-Plugin.

- Vereist authenticatie met een Bearer-token.
- Vereist `multipart/form-data`.
- Toegestane formuliervelden zijn `payload`, herhaalde `files`-blobs of één `clawpack`-
  tarballverwijzing. `clawpack` mag een `.tgz`-blob zijn of een storage-id die door
  de upload-URL-flow is geretourneerd. Publicaties met een klaargezette storage-id moeten ook het
  `clawpackUploadTicket` bevatten dat samen met die upload-URL is geretourneerd.
- Gebruik `files` of `clawpack`, maar nooit beide in hetzelfde verzoek.
- JSON-body's en door de aanroeper aangeleverde metagegevens in `payload.files` / `payload.artifact`
  worden geweigerd.
- Rechtstreekse multipart-publicatieverzoeken zijn beperkt tot 18 MB. ClawPack-tarballs mogen
  de upload-URL-flow gebruiken tot de tarballlimiet van 120 MB.
- Optioneel payloadveld: `ownerHandle`. Indien aanwezig, mogen alleen beheerders namens die eigenaar publiceren.

Belangrijkste validaties:

- `family` moet `code-plugin` of `bundle-plugin` zijn.
- Plugin-pakketten vereisen `openclaw.plugin.json`. ClawPack-`.tgz`-uploads moeten
  dit bestand bevatten op `package/openclaw.plugin.json`.
- Code-Plugins vereisen `package.json`, metagegevens van de bronrepository, metagegevens
  van de broncommit, metagegevens van het configuratieschema, `openclaw.compat.pluginApi` en
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` en `openclaw.environment` zijn optionele metagegevens.
- Alleen de uitgever van de `openclaw`-organisatie en persoonlijke uitgevers van huidige leden van de
  `openclaw`-organisatie mogen naar het `official`-kanaal publiceren.
- Bij publicaties namens een ander wordt de geschiktheid voor het officiële kanaal nog steeds gecontroleerd aan de hand van het account van de doeleigenaar.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Een Skill zacht verwijderen/herstellen (eigenaar, moderator of beheerder).

Optionele JSON-body:

```json
{ "reason": "Held for moderation pending legal review." }
```

Indien aanwezig, wordt `reason` opgeslagen als moderatienotitie van de Skill en naar het auditlogboek gekopieerd.
Door de eigenaar geïnitieerde zachte verwijderingen reserveren de slug gedurende 30 dagen; daarna kan de slug door
een andere uitgever worden geclaimd. De verwijderingsrespons bevat `slugReservedUntil` wanneer deze vervaldatum van toepassing is.
Verbergacties door moderators/beheerders en verwijderingen om veiligheidsredenen verlopen niet op deze manier.

Verwijderingsrespons:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Statuscodes:

- `200`: geslaagd
- `401`: niet geauthenticeerd
- `403`: verboden
- `404`: Skill/gebruiker niet gevonden
- `500`: interne serverfout

### `POST /api/v1/users/publisher`

Alleen voor beheerders. Zorgt dat er een organisatie-uitgever bestaat voor een handle. Als de handle nog naar een
verouderde gedeelde gebruiker/persoonlijke uitgever verwijst, migreert het endpoint deze eerst naar een organisatie-uitgever.
Geef voor een nieuw aangemaakte organisatie `memberHandle` op; de uitvoerende beheerder wordt niet als lid toegevoegd.
`memberRole` is standaard `owner`.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Respons: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Geauthenticeerde selfservice voor het aanmaken van een organisatie-uitgever. Maakt een nieuwe organisatie-uitgever aan en voegt de
aanroeper als eigenaar toe. Dit endpoint migreert geen bestaande gebruikers-/persoonlijke handles en markeert
de uitgever niet als vertrouwd/officieel.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Respons: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Retourneert `409` wanneer de handle al door een uitgever, gebruiker of persoonlijke uitgever wordt gebruikt.

### `POST /api/v1/users/reserve`

Alleen voor beheerders. Reserveert hoofdslugs en pakketnamen voor een rechtmatige eigenaar zonder een
release te publiceren. Pakketnamen worden privéplaatsaanduidingspakketten zonder releaserijen, zodat dezelfde
eigenaar later de echte code-Plugin- of bundel-Plugin-release onder die naam kan publiceren.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Respons: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Alleen voor beheerders. Herstelt een persoonlijke uitgever voor een geverifieerde vervangende GitHub OAuth-principal
zonder Convex Auth-accountregels te bewerken. Het verzoek moet beide onveranderlijke account-id's van de GitHub-
provider vermelden; veranderlijke handles worden alleen gebruikt als controle voor de beheerder.

Het eindpunt gebruikt standaard een dry-run. Voor het toepassen van herstel zijn `dryRun: false` en
`confirmIdentityVerified: true` vereist nadat medewerkers onafhankelijk de continuïteit tussen beide
GitHub-principals hebben geverifieerd. Herstel wordt veilig geweigerd wanneer de huidige persoonlijke
publisher van de doelgebruiker Skills, pakketten of GitHub-Skill-bronnen heeft.
Herstel migreert ook verouderde `ownerUserId`-velden voor de Skills van de herstelde publisher,
Skill-slugaliassen, pakketten, waarschuwingen van de pakketinspecteur en afgeleide zoekdigest-rijen, zodat
paden voor rechtstreeks eigenaarschap overeenkomen met de nieuwe publisherbevoegdheid. Een actieve reservering
van een beveiligde handle voor de herstelde handle wordt ook opnieuw toegewezen aan de vervangende gebruiker, zodat
latere profielsynchronisatie de concurrerende bevoegdheid van de voormalige gebruiker niet kan herstellen. Elke primaire tabel is beperkt tot
100 rijen per toepassingstransactie; grotere herstelacties moeten eerst een hervatbare eigenaarsmigratie gebruiken.
GitHub-Skill-bronnen vallen onder de publisher en worden gerapporteerd als gecontroleerd in plaats van herschreven.

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
- `merge` verbergt de bronvermelding en leidt de bron-slug om naar de doelvermelding.

### Eindpunten voor eigendomsoverdracht

- `POST /api/v1/skills/{slug}/transfer`
  - Body: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Respons: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Respons (accepteren/afwijzen/annuleren): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Responsstructuur: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Blokkeer een gebruiker en verwijder de Skills waarvan deze eigenaar is permanent (alleen moderator/beheerder).

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

Deblokkeer een gebruiker en herstel in aanmerking komende Skills (alleen beheerder).

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

Wijzig de opgeslagen reden voor een bestaande blokkering zonder de gebruiker te deblokkeren of
inhoud te herstellen (alleen beheerder). Gebruikt standaard een dry-run, tenzij `dryRun` `false` is.

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

Wijzig de rol van een gebruiker (alleen beheerder).

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

Geef gebruikers weer of zoek naar gebruikers (alleen beheerder).

Queryparameters:

- `q` (optioneel): zoekopdracht
- `query` (optioneel): alias voor `q`
- `limit` (optioneel): maximaal aantal resultaten (standaard 20, maximaal 200)

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

Voeg een ster toe of verwijder deze (markeringen). Beide eindpunten zijn idempotent.

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

`POST /api/cli/upload-url` retourneert `uploadUrl` en `uploadTicket`. Bij het publiceren van pakketten
waarbij een ClawPack-tarball wordt klaargezet, moet de resulterende opslag-id als
`clawpack` en het geretourneerde ticket als `clawpackUploadTicket` worden verzonden.

## Registry-detectie (`/.well-known/clawhub.json`)

De CLI kan registry-/authenticatie-instellingen op de site detecteren:

- `/.well-known/clawhub.json` (JSON, aanbevolen)
- `/.well-known/clawdhub.json` (verouderd)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Als u zelf host, biedt u dit bestand aan (of stelt u `CLAWHUB_REGISTRY` expliciet in; verouderd: `CLAWDHUB_REGISTRY`).
