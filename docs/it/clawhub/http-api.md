---
read_when:
    - Aggiunta/modifica degli endpoint
    - Debug delle richieste CLI ↔ registry
summary: Riferimento API HTTP (endpoint pubblici + CLI + autenticazione).
x-i18n:
    generated_at: "2026-06-30T22:19:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL base: `https://clawhub.ai` (predefinito).

Tutti i percorsi v1 sono sotto `/api/v1/...`.
I percorsi legacy `/api/...` e `/api/cli/...` rimangono per compatibilità (vedi `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Riutilizzo del catalogo pubblico

Le directory di terze parti possono usare gli endpoint pubblici in lettura per elencare o cercare Skills di ClawHub. Memorizza i risultati nella cache, rispetta `429`/`Retry-After`, rimanda gli utenti alla scheda canonica di ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) ed evita di suggerire un'approvazione di ClawHub per il sito di terze parti. Non tentare di duplicare contenuti nascosti, privati o bloccati dalla moderazione al di fuori della superficie dell'API pubblica.

Le scorciatoie degli slug web vengono risolte tra le famiglie del registro, ma i client API dovrebbero usare
gli URL canonici restituiti dagli endpoint in lettura invece di ricostruire la precedenza
delle route.

## Limiti di frequenza

Modello di applicazione:

- Richieste anonime: applicate per IP.
- Richieste autenticate (token Bearer valido): applicate per bucket utente.
- Se il token manca o non è valido, il comportamento ricade sull'applicazione per IP.
- Gli endpoint di scrittura autenticati non dovrebbero restituire un semplice `Unauthorized` quando
  il server conosce il motivo. Token mancanti, token non validi/revocati e
  account eliminati/bannati/disabilitati dovrebbero ricevere ciascuno un testo azionabile, così i client
  CLI possono indicare agli utenti che cosa li ha bloccati.

- Lettura: 3000/min per IP, 12000/min per chiave
- Scrittura: 300/min per IP, 3000/min per chiave
- Download: 1200/min per IP, 6000/min per chiave (endpoint di download)

Header:

- Compatibilità legacy: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Standardizzati: `RateLimit-Limit`, `RateLimit-Reset`
- Su `429`: `X-RateLimit-Remaining: 0` e `RateLimit-Remaining: 0`
- Su `429`: `Retry-After`

Semantica degli header:

- `X-RateLimit-Reset`: secondi Unix epoch assoluti
- `RateLimit-Reset`: secondi fino al reset (ritardo)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: budget rimanente esatto quando presente.
  Le richieste riuscite su shard omettono questo header invece di restituire un valore globale approssimativo.
- `Retry-After`: secondi da attendere prima di riprovare (ritardo) su `429`

Esempio di risposta `429`:

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

Indicazioni per i client:

- Se `Retry-After` esiste, attendi quel numero di secondi prima di riprovare.
- Usa un backoff con jitter per evitare tentativi sincronizzati.
- Se `Retry-After` manca, ricadi su `RateLimit-Reset` (oppure calcola da `X-RateLimit-Reset`).

Origine IP:

- Usa header IP client attendibili, incluso `cf-connecting-ip`, solo quando il
  deployment abilita esplicitamente gli header inoltrati attendibili.
- ClawHub usa header di inoltro attendibili per identificare gli IP client all'edge.
- Se non è disponibile alcun IP client attendibile, le richieste anonime usano bucket di fallback
  limitati solo dal tipo di limite di frequenza. Questi bucket di fallback non includono
  percorsi, slug, nomi di pacchetto, versioni, stringhe di query o altri
  parametri di artefatto forniti dal chiamante.

## Risposte di errore

Le risposte di errore pubbliche v1 sono testo semplice con `content-type: text/plain; charset=utf-8`.
Questo include errori di validazione (`400`), risorse pubbliche mancanti (`404`), errori di autenticazione e
autorizzazione (`401`/`403`), limiti di frequenza (`429`) e download bloccati. I client
dovrebbero leggere il corpo della risposta come stringa leggibile da una persona. I parametri di query sconosciuti vengono
ignorati per compatibilità, ma i parametri di query riconosciuti con valori non validi restituiscono
`400`.

## Endpoint pubblici (senza autenticazione)

### `GET /api/v1/search`

Parametri di query:

- `q` (obbligatorio): stringa di query
- `limit` (opzionale): intero
- `highlightedOnly` (opzionale): `true` per filtrare alle Skills evidenziate
- `nonSuspiciousOnly` (opzionale): `true` per nascondere Skills sospette (`flagged.suspicious`)
- `nonSuspicious` (opzionale): alias legacy di `nonSuspiciousOnly`

Risposta:

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

Note:

- I risultati vengono restituiti in ordine di rilevanza (similarità degli embedding + boost per token esatti di slug/nome + un piccolo fattore di popolarità).
- La rilevanza è più forte della popolarità. Una corrispondenza precisa su slug o token del nome visualizzato può superare una corrispondenza più ampia con molto più engagement.
- Il testo ASCII viene tokenizzato sui confini di parole e punteggiatura. Per esempio, `personal-map` contiene un token autonomo `map`, mentre `amap-jsapi-skill` contiene `amap`, `jsapi` e `skill`; cercare `map` quindi assegna a `personal-map` una corrispondenza lessicale più forte rispetto a `amap-jsapi-skill`.
- La popolarità è scalata logaritmicamente e limitata. Skills con alto engagement possono classificarsi più in basso quando il testo della query ha una corrispondenza più debole.
- Uno stato di moderazione sospetto o nascosto può rimuovere una Skill dalla ricerca pubblica a seconda dei filtri del chiamante e dello stato di moderazione corrente.

Indicazioni di reperibilità per publisher:

- Inserisci i termini che gli utenti cercheranno letteralmente nel nome visualizzato, nel riepilogo e nei tag. Usa un token slug autonomo solo quando è anche un'identità stabile che vuoi mantenere.
- Non rinominare uno slug solo per inseguire una query, a meno che il nuovo slug sia un nome canonico migliore sul lungo periodo. I vecchi slug diventano alias di reindirizzamento, ma l'URL canonico, lo slug visualizzato e i digest di ricerca futuri usano il nuovo slug.
- Gli alias di rinomina preservano la risoluzione per vecchi URL e installazioni che si risolvono tramite il registro, ma il ranking di ricerca si basa sui metadati canonici della Skill dopo l'indicizzazione della rinomina. Le statistiche esistenti restano associate alla Skill.
- Se una Skill è inaspettatamente invisibile, controlla prima lo stato di moderazione con `clawhub inspect @owner/slug` dopo l'accesso, prima di modificare metadati legati al ranking.

### `GET /api/v1/skills`

Parametri di query:

- `limit` (opzionale): intero (1–200)
- `cursor` (opzionale): cursore di paginazione per qualsiasi ordinamento non `trending`
- `sort` (opzionale): `updated` (predefinito), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), gli alias di installazione legacy `installsCurrent`/`installs`/`installsAllTime` mappano a `downloads`, `trending`
- `nonSuspiciousOnly` (opzionale): `true` per nascondere Skills sospette (`flagged.suspicious`)
- `nonSuspicious` (opzionale): alias legacy di `nonSuspiciousOnly`

Valori `sort` non validi restituiscono `400`.

Note:

- `recommended` usa segnali di engagement e recenza.
- `trending` classifica in base alle installazioni negli ultimi 7 giorni (basato su telemetria).
- `createdAt` è stabile per le scansioni di nuove Skills; `updated` cambia quando Skills esistenti vengono ripubblicate.
- Quando `nonSuspiciousOnly=true`, gli ordinamenti basati su cursore possono restituire meno elementi di `limit` in una pagina perché le Skills sospette vengono filtrate dopo il recupero della pagina.
- Usa `nextCursor` per continuare la paginazione quando presente. Una pagina corta non significa di per sé fine dei risultati.

Risposta:

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

Risposta:

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

Note:

- I vecchi slug creati dai flussi di rinomina/unione dell'owner si risolvono nella Skill canonica.
- `metadata.os`: restrizioni OS dichiarate nel frontmatter della Skill (per esempio `["macos"]`, `["linux"]`). `null` se non dichiarate.
- `metadata.systems`: target di sistema Nix (per esempio `["aarch64-darwin", "x86_64-linux"]`). `null` se non dichiarati.
- `metadata` è `null` se la Skill non ha metadati di piattaforma.
- `moderation` viene incluso solo quando la Skill è segnalata o l'owner la sta visualizzando.

### `GET /api/v1/skills/{slug}/moderation`

Restituisce lo stato di moderazione strutturato.

Risposta:

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

Note:

- Owner e moderatori possono accedere ai dettagli di moderazione per Skills nascoste.
- I chiamanti pubblici ricevono `200` solo per Skills visibili già segnalate.
- Le prove sono redatte per i chiamanti pubblici e includono frammenti grezzi solo per owner/moderatori.

### `POST /api/v1/skills/{slug}/report`

Segnala una Skill per la revisione dei moderatori. Le segnalazioni sono a livello di Skill, facoltativamente collegate
a una versione, e alimentano la coda delle segnalazioni delle Skill.

Autenticazione:

- Richiede un token API.

Richiesta:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

Risposta:

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

Endpoint moderatore/admin per l'acquisizione delle segnalazioni delle Skill.

Parametri di query:

- `status` (opzionale): `open` (predefinito), `confirmed`, `dismissed` o `all`
- `limit` (opzionale): intero (1-200)
- `cursor` (opzionale): cursore di paginazione

Risposta:

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

Endpoint moderatore/admin per risolvere o riaprire segnalazioni di Skill.

Richiesta:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` è obbligatorio per `confirmed` e `dismissed`; può essere omesso quando
si reimposta `status` su `open`. Passa `finalAction: "hide"` con una segnalazione valutata
per nascondere la Skill nello stesso flusso di lavoro verificabile.

### `GET /api/v1/skills/{slug}/versions`

Parametri di query:

- `limit` (opzionale): intero
- `cursor` (opzionale): cursore di paginazione

### `GET /api/v1/skills/{slug}/versions/{version}`

Restituisce i metadati della versione + elenco dei file.

- `version.security` include lo stato di verifica della scansione normalizzato e i dettagli dello scanner
  (VirusTotal + LLM), quando disponibili.

### `GET /api/v1/skills/{slug}/scan`

Restituisce i dettagli di verifica della scansione di sicurezza per una versione della Skill.

Parametri di query:

- `version` (opzionale): stringa di versione specifica.
- `tag` (opzionale): risolve una versione taggata (per esempio `latest`).

Note:

- Se non viene fornito né `version` né `tag`, usa la versione più recente.
- Include lo stato di verifica normalizzato più i dettagli specifici dello scanner.
- `security.hasScanResult` è `true` solo quando uno scanner ha prodotto un verdetto definitivo (`clean`, `suspicious` o `malicious`).
- `moderation` è uno snapshot di moderazione corrente a livello di skill derivato dalla versione più recente.
- Quando si interroga una versione storica, controlla `moderation.matchesRequestedVersion` e `moderation.sourceVersion` prima di trattare `moderation` e `security` come lo stesso contesto di versione.

### `POST /api/v1/skills/-/scan`

Endpoint di invio autenticato per nuovi job ClawScan.

Le scansioni con caricamento locale non sono più supportate. Le richieste che usano
`multipart/form-data` o `{ "source": { "kind": "upload" } }` restituiscono `410`.

Le scansioni pubblicate usano JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Note:

- I payload delle richieste di scansione e i report scaricabili scadono dall'archivio delle richieste di scansione dopo la finestra di conservazione.
- Le scansioni pubblicate richiedono accesso di gestione da proprietario/editore, oppure autorità di moderatore/amministratore della piattaforma.
- Le scansioni pubblicate scrivono i risultati solo quando `update: true` e la scansione viene completata correttamente.
- La risposta è `202` con `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- I job di scansione sono asincroni. Le richieste di scansione manuale hanno priorità rispetto al normale lavoro di pubblicazione/backfill, ma il completamento dipende comunque dalla disponibilità dei worker.

### `GET /api/v1/skills/-/scan/{scanId}`

Endpoint di polling autenticato per una scansione inviata.

- Restituisce lo stato queued/running/succeeded/failed.
- Restituisce `queue.queuedAhead` e `queue.position` mentre è in coda, così i client possono mostrare quante scansioni manuali prioritarie precedono la richiesta. Le code molto grandi sono limitate e segnalate con `queuedAheadIsEstimate: true`.
- Quando disponibile, `report` contiene le sezioni `clawscan`, `skillspector`, `staticAnalysis` e `virustotal`.
- I job di scansione non riusciti restituiscono `status: "failed"` con `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Endpoint autenticato per l'archivio dei report.

- Richiede una scansione riuscita; le scansioni non terminali restituiscono `409`.
- Restituisce uno ZIP con `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` e `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Endpoint autenticato per l'archivio dei report archiviati per le versioni inviate.

- Richiede accesso di gestione da proprietario/editore alla skill o al plugin, oppure autorità di moderatore/amministratore della piattaforma.
- Restituisce i risultati di scansione archiviati per l'esatta versione inviata, incluse le versioni bloccate o nascoste.
- `kind` ha come valore predefinito `skill`; usa `kind=plugin` per scansioni di plugin/pacchetti.
- Restituisce la stessa forma ZIP dei download delle richieste di scansione.

### `POST /api/v1/skills/-/scan/batch`

Route canonica di riscansione batch riservata agli amministratori. Accetta la stessa forma di payload della route legacy `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Route canonica di stato batch riservata agli amministratori. Accetta `{ "jobIds": ["..."] }` e restituisce gli stessi contatori aggregati della route legacy `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Restituisce l'envelope di verifica della Skill Card usato da `clawhub skill verify`.

Parametri query:

- `version` (facoltativo): stringa di versione specifica.
- `tag` (facoltativo): risolve una versione con tag (ad esempio `latest`).

Note:

- `ok` è `true` solo quando la versione selezionata ha una Skill Card generata, non è bloccata come malware dalla moderazione e la verifica ClawScan è pulita.
- L'identità della skill, l'identità dell'editore e i metadati della versione selezionata sono campi envelope di primo livello (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) così l'automazione shell può leggerli senza spacchettare wrapper annidati.
- `security` è il verdetto ClawScan/security di primo livello. L'automazione dovrebbe basarsi su `ok`, `decision`, `reasons` e `security.status`.
- `security.signals` contiene prove di supporto dello scanner, come `staticScan`, `virusTotal` e `skillSpector`.
- `security.signals.dependencyRegistry` viene mantenuto per compatibilità della risposta v1, ma lo scanner di esistenza nel registro delle dipendenze è ritirato e questa chiave è sempre `null`.
- `provenance` è `server-resolved-github-import` solo quando ClawHub ha risolto e archiviato un repo/ref/commit/path GitHub durante la pubblicazione o l'importazione; altrimenti è `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Restituisce i verdetti di sicurezza compatti correnti per versioni esatte di skill. Questo
endpoint di raccolta è destinato ai client che sanno già quali versioni di skill
ClawHub installate devono visualizzare, come OpenClaw Control UI.

Richiesta:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Note:

- `items` deve contenere 1-100 coppie `{ slug, version }` uniche.
- I risultati sono per elemento; una skill o una versione mancante non fa fallire l'intera risposta.
- La risposta riguarda solo la sicurezza. Non include dati della Skill Card, stato della scheda generata, elenchi di file artefatto o payload dettagliati degli scanner.
- `security.signals` contiene solo prove di supporto a livello di stato; usa `/scan` o la pagina security-audit di ClawHub per i dettagli completi degli scanner.
- `security.signals.dependencyRegistry` viene mantenuto per compatibilità della risposta v1, ma lo scanner di esistenza nel registro delle dipendenze è ritirato e questa chiave è sempre `null`.
- L'assenza della Skill Card non influisce su `ok`, `decision` o `reasons` di questo endpoint; i client dovrebbero leggere localmente `skill-card.md` installato quando hanno bisogno del contenuto della scheda.
- Usa `/verify` quando hai bisogno dell'envelope di verifica Skill Card di una singola skill, `/card` quando hai bisogno del markdown della scheda generata e `/scan` quando hai bisogno di dati dettagliati degli scanner.

Risposta:

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

Restituisce contenuto di testo non elaborato.

Parametri di query:

- `path` (obbligatorio)
- `version` (facoltativo)
- `tag` (facoltativo)

Note:

- Usa per impostazione predefinita la versione più recente.
- Limite dimensione file: 200 KB.

### `GET /api/v1/packages`

Endpoint di catalogo unificato per:

- Skills
- plugin di codice
- plugin bundle

Parametri di query:

- `limit` (facoltativo): numero intero (1–100)
- `cursor` (facoltativo): cursore di paginazione
- `family` (facoltativo): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (facoltativo): `official`, `community` o `private`
- `isOfficial` (facoltativo): `true` o `false`
- `sort` (facoltativo): `updated` (predefinito), `recommended`, `trending`, `downloads`, alias legacy `installs`
- `category` (facoltativo): filtro per categoria di plugin. Supportato solo quando la
  richiesta è limitata ai pacchetti plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` o endpoint dei pacchetti con
  `family=code-plugin`/`family=bundle-plugin`). Le categorie controllate e
  gli alias legacy del filtro v1 sono documentati in `GET /api/v1/plugins`.

Note:

- Valori non validi per `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` o `sort` restituiscono `400`. I parametri di query sconosciuti vengono ignorati.
- `GET /api/v1/code-plugins` e `GET /api/v1/bundle-plugins` restano alias a famiglia fissa.
- Le voci Skills restano supportate dal registro Skills e possono ancora essere pubblicate solo tramite `POST /api/v1/skills`.
- `POST /api/v1/packages` è ancora solo per le release di code-plugin e bundle-plugin.
- I chiamanti anonimi vedono solo i canali di pacchetti pubblici.
- I chiamanti autenticati possono vedere nei risultati di elenco/ricerca i pacchetti privati per gli editori a cui appartengono.
- `channel=private` restituisce solo i pacchetti che il chiamante autenticato può leggere.

### `GET /api/v1/packages/search`

Ricerca nel catalogo unificato tra Skills e pacchetti plugin.

Parametri di query:

- `q` (obbligatorio): stringa di query
- `limit` (facoltativo): numero intero (1–100)
- `family` (facoltativo): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (facoltativo): `official`, `community` o `private`
- `isOfficial` (facoltativo): `true` o `false`
- `category` (facoltativo): filtro per categoria di plugin. Supportato solo quando la
  richiesta è limitata ai pacchetti plugin. Le categorie controllate e gli alias legacy v1
  del filtro sono documentati in `GET /api/v1/plugins`.

Note:

- Valori non validi per `family`, `channel`, `isOfficial`, `featured` o
  `highlightedOnly` restituiscono `400`. I parametri di query sconosciuti vengono ignorati.
- I chiamanti anonimi vedono solo i canali di pacchetti pubblici.
- I chiamanti autenticati possono cercare pacchetti privati per gli editori a cui appartengono.
- `channel=private` restituisce solo i pacchetti che il chiamante autenticato può leggere.

### `GET /api/v1/plugins`

Esplorazione del catalogo solo plugin tra pacchetti code-plugin e bundle-plugin.

Parametri di query:

- `limit` (facoltativo): numero intero (1-100)
- `cursor` (facoltativo): cursore di paginazione
- `isOfficial` (facoltativo): `true` o `false`
- `sort` (facoltativo): `recommended` (predefinito), `trending`, `downloads`, `updated`, alias legacy `installs`
- `category` (facoltativo): filtro per categoria di plugin. Valori correnti:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Gli alias legacy del filtro v1 restano accettati sugli endpoint di lettura:

- `mcp-tooling`, `data` e `automation` si risolvono in `tools`.
- `observability` e `deployment` si risolvono in `gateway`.
- `dev-tools` si risolve in `runtime`.

`trending` è una classifica di installazioni/download su sette giorni e non usa i totali complessivi.
Sull'endpoint unificato `/api/v1/packages` è solo per plugin; usa
`/api/v1/skills?sort=trending` per il catalogo Skills.

Gli alias legacy non sono accettati come valori di categoria archiviati o dichiarati dall'autore.

### `GET /api/v1/skills/export`

Esportazione in blocco delle Skills pubbliche più recenti per l'analisi offline.

Autenticazione:

- Token API obbligatorio.

Parametri di query:

- `startDate` (obbligatorio): limite inferiore in millisecondi Unix per `updatedAt` della skill.
- `endDate` (obbligatorio): limite superiore in millisecondi Unix per `updatedAt` della skill.
- `limit` (facoltativo): numero intero (1-250), predefinito `250`.
- `cursor` (facoltativo): cursore di paginazione dalla risposta precedente.

Risposta:

- Corpo: archivio ZIP.
- Ogni skill esportata ha radice in `{publisher}/{slug}/`.
- Le Skills ospitate includono i file della versione archiviata più recente e sono elencate in
  `_manifest.json` con `sourceRef: "public-clawhub"`.
- Le Skills correnti basate su GitHub con scansione `clean` o `suspicious` includono
  `_source_handoff.json` con `sourceRef: "public-github"`, repository, commit, percorso,
  hash del contenuto e URL dell'archivio. Non includono i file sorgente ospitati da ClawHub.
- Ogni skill include `_export_skill_meta.json`.
- `_manifest.json` è sempre incluso nella radice dello ZIP.
- `_errors.json` è incluso quando singole Skills o singoli file non hanno potuto essere
  esportati.

Intestazioni:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Esportazione in blocco dei rilasci pubblici più recenti dei Plugin per l'analisi offline.

Autenticazione:

- Token API obbligatorio.

Parametri di query:

- `startDate` (obbligatorio): limite inferiore in millisecondi Unix per `updatedAt` del Plugin.
- `endDate` (obbligatorio): limite superiore in millisecondi Unix per `updatedAt` del Plugin.
- `limit` (facoltativo): intero (1-250), predefinito `250`.
- `cursor` (facoltativo): cursore di paginazione dalla risposta precedente.
- `family` (facoltativo): `code-plugin` o `bundle-plugin`. Se omesso, indica entrambe
  le famiglie di Plugin.

Risposta:

- Corpo: archivio ZIP.
- Ogni Plugin esportato ha radice in `{family}/{packageName}/`.
- Ogni Plugin esportato include i file archiviati del rilascio più recente.
- I metadati di esportazione per Plugin sono archiviati in
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` è sempre incluso nella radice dello ZIP.
- `_errors.json` è incluso quando singoli Plugin o file non possono essere
  esportati.

Intestazioni:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Ricerca limitata ai Plugin tra i pacchetti code-plugin e bundle-plugin.

Parametri di query:

- `q` (obbligatorio): stringa di query
- `limit` (facoltativo): intero (1-100)
- `isOfficial` (facoltativo): `true` o `false`
- `category` (facoltativo): filtro per categoria del Plugin. Valori attuali:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Note:

- Sono accettati anche gli alias legacy dei filtri v1 documentati in `GET /api/v1/plugins`.
- Il filtro per categoria è un vero filtro API basato su righe digest delle categorie dei Plugin,
  non una riscrittura della query di ricerca.
- I risultati vengono restituiti in ordine di rilevanza e attualmente non sono paginati.
- I controlli di ordinamento dell'interfaccia browser per la ricerca dei Plugin riordinano i risultati di rilevanza caricati,
  in linea con il comportamento di navigazione attuale di `/skills`.

### `GET /api/v1/packages/{name}`

Restituisce i metadati dettagliati del pacchetto.

Note:

- Anche le Skills possono risolversi tramite questa rotta nel catalogo unificato.
- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.

### `DELETE /api/v1/packages/{name}`

Elimina logicamente un pacchetto e tutti i rilasci.

Note:

- Richiede un token API per il proprietario del pacchetto, un proprietario/amministratore del publisher dell'organizzazione,
  un moderatore della piattaforma o un amministratore della piattaforma.

### `GET /api/v1/packages/{name}/versions`

Restituisce la cronologia delle versioni.

Parametri di query:

- `limit` (facoltativo): intero (1–100)
- `cursor` (facoltativo): cursore di paginazione

Note:

- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.

### `GET /api/v1/packages/{name}/versions/{version}`

Restituisce una versione del pacchetto, inclusi metadati dei file, compatibilità,
verifica, metadati dell'artefatto e dati di scansione.

Note:

- `version.artifact.kind` è `legacy-zip` per gli archivi di pacchetti del vecchio mondo oppure
  `npm-pack` per i rilasci basati su ClawPack.
- I rilasci ClawPack includono i campi compatibili con npm `npmIntegrity`, `npmShasum` e
  `npmTarballName`.
- `version.sha256hash` è un metadato di compatibilità deprecato per i vecchi client. Esegue l'hash
  dei byte ZIP esatti restituiti da `/api/v1/packages/{name}/download`.
  I client moderni dovrebbero usare `version.artifact.sha256`, che identifica
  l'artefatto di rilascio canonico.
- `version.vtAnalysis`, `version.llmAnalysis` e `version.staticScan` sono
  inclusi quando esistono dati di scansione.
- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Restituisce il riepilogo esatto di sicurezza e attendibilità del rilascio del pacchetto per i client di installazione. Questa è la superficie pubblica di consumo OpenClaw per decidere se un
rilascio risolto può essere installato.

Autenticazione:

- Endpoint di lettura pubblico. Non è richiesto alcun token di proprietario, publisher, moderatore o amministratore.

Risposta:

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

Campi della risposta:

- `package.name`, `package.displayName` e `package.family` identificano il
  pacchetto del registro risolto.
- `release.releaseId`, `release.version` e `release.createdAt` identificano il
  rilascio esatto che è stato valutato.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` e `release.npmTarballName` sono presenti quando noti per
  l'artefatto di rilascio.
- `trust.scanStatus` è lo stato di attendibilità effettivo derivato dagli input dello scanner
  e dalla moderazione manuale del rilascio.
- `trust.moderationState` può essere null. È `null` quando non esiste alcuna
  moderazione manuale del rilascio.
- `trust.blockedFromDownload` è il segnale di blocco dell'installazione. OpenClaw e altri
  client di installazione dovrebbero bloccare l'installazione quando questo valore è `true`, invece di
  ricalcolare le regole di blocco dai campi dello scanner o della moderazione.
- `trust.reasons` è l'elenco di spiegazioni rivolto all'utente e per audit. I codici motivo
  sono stringhe stabili e compatte, come `manual:quarantined`, `scan:malicious`
  e `package:malicious`.
- `trust.pending` significa che uno o più input di attendibilità sono ancora in attesa di completamento.
- `trust.stale` significa che il riepilogo di attendibilità è stato calcolato da input obsoleti e
  dovrebbe essere considerato come richiedente un aggiornamento prima di una decisione di autorizzazione ad alta affidabilità.

Note:

- Questo endpoint è esatto per versione. I client dovrebbero chiamarlo dopo aver risolto la
  versione del pacchetto che intendono installare, non solo dopo aver letto i metadati più recenti
  del pacchetto.
- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.
- Questo endpoint è intenzionalmente più ristretto degli endpoint di moderazione per proprietari/moderatori. Espone la decisione di installazione e la spiegazione pubblica, non
  identità dei segnalatori, corpi dei report, prove private o cronologie di revisione
  interne.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Restituisce i metadati espliciti del resolver dell'artefatto per una versione del pacchetto.

Note:

- Le versioni legacy dei pacchetti restituiscono un artefatto `legacy-zip` e un `downloadUrl`
  ZIP legacy.
- Le versioni ClawPack restituiscono un artefatto `npm-pack`, campi di integrità npm, un
  `tarballUrl` e l'URL di compatibilità ZIP legacy.
- Questa è la superficie del resolver OpenClaw; evita di dedurre il formato dell'archivio da
  un URL condiviso.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Scarica l'artefatto della versione tramite il percorso esplicito del resolver.

Note:

- Le versioni ClawPack trasmettono in streaming i byte esatti `.tgz` npm-pack caricati.
- Le versioni ZIP legacy reindirizzano a `/api/v1/packages/{name}/download?version=`.
- Usa il bucket di limitazione della frequenza dei download.

### `GET /api/v1/packages/{name}/readiness`

Restituisce la readiness calcolata per il consumo futuro di OpenClaw.

I controlli di readiness coprono:

- stato del canale ufficiale
- disponibilità della versione più recente
- disponibilità dell'artefatto npm-pack ClawPack
- digest dell'artefatto
- repository sorgente e provenienza del commit
- metadati di compatibilità OpenClaw
- target host
- stato della scansione

Risposta:

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

Endpoint per moderatori per elencare le righe di migrazione dei Plugin ufficiali OpenClaw.

Autenticazione:

- Richiede un token API per un utente moderatore o amministratore.

Parametri di query:

- `phase` (facoltativo): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` o
  `all` (predefinito).
- `limit` (facoltativo): intero (1-100)
- `cursor` (facoltativo): cursore di paginazione

Risposta:

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

Endpoint di amministrazione per creare o aggiornare una riga di migrazione di un Plugin ufficiale.

Autenticazione:

- Richiede un token API per un utente amministratore.

Corpo della richiesta:

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

Note:

- `bundledPluginId` viene normalizzato in minuscolo ed è la chiave di upsert stabile.
- `packageName` è normalizzato come nome npm; il pacchetto può mancare per le migrazioni
  pianificate.
- Questo traccia solo la readiness della migrazione. Non modifica OpenClaw né genera
  ClawPack.

### `GET /api/v1/packages/moderation/queue`

Endpoint per moderatori/amministratori per le code di revisione dei rilasci dei pacchetti.

Autenticazione:

- Richiede un token API per un utente moderatore o amministratore.

Parametri di query:

- `status` (facoltativo): `open` (predefinito), `blocked`, `manual` o `all`
- `limit` (facoltativo): intero (1-100)
- `cursor` (facoltativo): cursore di paginazione

Significati degli stati:

- `open`: rilasci sospetti, dannosi, in sospeso, in quarantena, revocati o segnalati.
- `blocked`: rilasci in quarantena, revocati o dannosi.
- `manual`: qualsiasi rilascio con una sostituzione manuale di moderazione.
- `all`: qualsiasi rilascio con una sostituzione manuale, stato di scansione non pulito o segnalazione del pacchetto.

Risposta:

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

Segnala un pacchetto per la revisione dei moderatori. Le segnalazioni sono a livello di pacchetto, facoltativamente
collegate a una versione. Alimentano la coda di moderazione ma non nascondono automaticamente né
bloccano i download da sole; i moderatori dovrebbero usare la moderazione dei rilasci per
approvare, mettere in quarantena o revocare gli artefatti.

Autenticazione:

- Richiede un token API.

Richiesta:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

Risposta:

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

Endpoint moderatore/admin per l'acquisizione delle segnalazioni sui pacchetti.

Autenticazione:

- Richiede un token API per un utente moderatore o admin.

Parametri di query:

- `status` (opzionale): `open` (predefinito), `confirmed`, `dismissed` o `all`
- `limit` (opzionale): intero (1-100)
- `cursor` (opzionale): cursore di paginazione

Risposta:

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

Endpoint proprietario/moderatore per la visibilità della moderazione dei pacchetti.

Autenticazione:

- Richiede un token API per il proprietario del pacchetto, un membro del publisher, un moderatore o
  un utente admin.

Risposta:

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

Endpoint moderatore/admin per risolvere o riaprire le segnalazioni sui pacchetti.

Richiesta:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` è obbligatorio per `confirmed` e `dismissed`; può essere omesso quando
si imposta di nuovo `status` su `open`. Passa `finalAction: "quarantine"` o
`finalAction: "revoke"` con una segnalazione confermata per applicare la moderazione della release nello
stesso flusso di lavoro verificabile.

Risposta:

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

Endpoint moderatore/admin per la revisione delle release dei pacchetti.

Richiesta:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Stati supportati:

- `approved`: revisionata manualmente e consentita.
- `quarantined`: bloccata in attesa di follow-up.
- `revoked`: bloccata dopo che una release era stata precedentemente considerata attendibile.

Le release in quarantena e revocate restituiscono `403` dalle route di download degli artefatti.
Ogni modifica scrive una voce nel registro di audit.

### `GET /api/v1/packages/{name}/file`

Restituisce il contenuto di testo grezzo per un file di pacchetto.

Parametri di query:

- `path` (obbligatorio)
- `version` (opzionale)
- `tag` (opzionale)

Note:

- Usa come valore predefinito la release più recente.
- Usa il bucket di limite di lettura, non il bucket di download.
- I file binari restituiscono `415`.
- Limite di dimensione del file: 200 KB.
- Le scansioni VirusTotal in sospeso non bloccano le letture; le release dannose possono comunque essere trattenute altrove.
- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.

### `GET /api/v1/packages/{name}/download`

Scarica l'archivio ZIP deterministico legacy per una release di pacchetto.

Parametri di query:

- `version` (opzionale)
- `tag` (opzionale)

Note:

- Usa come valore predefinito la release più recente.
- Skills reindirizza a `GET /api/v1/download`.
- Gli archivi di Plugin/pacchetti sono file zip con una radice `package/`, così i vecchi client OpenClaw
  continuano a funzionare.
- Questa route resta solo ZIP. Non esegue lo streaming dei file ClawPack `.tgz`.
- Le risposte includono gli header `ETag`, `Digest`, `X-ClawHub-Artifact-Type` e
  `X-ClawHub-Artifact-Sha256` per i controlli di integrità del resolver.
- I metadati solo registro non vengono inseriti nell'archivio scaricato.
- Le scansioni VirusTotal in sospeso non bloccano i download; le release dannose restituiscono `403`.
- I pacchetti privati restituiscono `404` a meno che il chiamante sia il proprietario.

### `GET /api/npm/{package}`

Restituisce un packument compatibile con npm per le versioni dei pacchetti basate su ClawPack.

Note:

- Vengono elencate solo le versioni con tarball ClawPack npm-pack caricati.
- Le versioni legacy solo ZIP sono intenzionalmente omesse.
- `dist.tarball`, `dist.integrity` e `dist.shasum` usano campi compatibili con npm,
  così gli utenti possono puntare npm al mirror se lo desiderano.
- I packument dei pacchetti scoped supportano sia `/api/npm/@scope/name` sia il percorso di richiesta
  codificato di npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Esegue lo streaming dei byte esatti del tarball ClawPack caricato per i client mirror npm.

Note:

- Usa il bucket di limite di download.
- Gli header di download includono SHA-256 ClawHub più metadati npm integrity/shasum.
- Si applicano comunque i controlli di moderazione e di accesso ai pacchetti privati.

### `GET /api/v1/resolve`

Usato dalla CLI per mappare un'impronta locale a una versione nota.

Parametri di query:

- `slug` (obbligatorio)
- `hash` (obbligatorio): sha256 esadecimale di 64 caratteri dell'impronta del bundle

Risposta:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Scarica uno ZIP di versione di skill ospitata, oppure restituisce un handoff sorgente GitHub per una
skill corrente basata su GitHub con una scansione `clean` o `suspicious` e nessuna versione
ospitata.

Parametri di query:

- `slug` (obbligatorio)
- `version` (opzionale): stringa semver
- `tag` (opzionale): nome del tag (ad es. `latest`)

Note:

- Se non vengono forniti né `version` né `tag`, viene usata la versione più recente.
- Le versioni eliminate in modo reversibile restituiscono `410`.
- Gli handoff delle skill basate su GitHub non fanno proxy né mirror dei byte. La risposta JSON
  include `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  e `archiveUrl`; lo stato di scansione/corrente è un gate e non è incluso come metadato del payload
  di successo.
- Le statistiche di download sono conteggiate come identità uniche per giorno UTC (`userId` quando il token API è valido, altrimenti IP).

## Endpoint di autenticazione (token Bearer)

Tutti gli endpoint richiedono:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Convalida il token e restituisce l'handle dell'utente.

### `POST /api/v1/skills`

Pubblica una nuova versione.

- Preferito: `multipart/form-data` con JSON `payload` + blob `files[]`.
- È accettato anche un corpo JSON con `files` (basati su storageId).
- Campo payload opzionale: `ownerHandle`. Quando presente, l'API risolve quel
  publisher lato server e richiede che l'attore abbia accesso al publisher.
- Campo payload opzionale: `migrateOwner`. Quando `true` con `ownerHandle`, una
  skill esistente può essere spostata a quel proprietario se l'attore è admin/proprietario sia sul
  publisher corrente sia su quello di destinazione. Senza questo opt-in, le modifiche di proprietario sono
  rifiutate.

### `POST /api/v1/packages`

Pubblica una release code-plugin o bundle-plugin.

- Richiede autenticazione con token Bearer.
- Richiede `multipart/form-data`.
- I campi form consentiti sono `payload`, blob `files` ripetuti o un riferimento a tarball `clawpack`.
  `clawpack` può essere un blob `.tgz` o un id di storage restituito dal
  flusso upload-url. Le pubblicazioni con storage-id in staging devono includere anche il
  `clawpackUploadTicket` restituito con quell'URL di caricamento.
- Usa `files` oppure `clawpack`, mai entrambi nella stessa richiesta.
- I corpi JSON e i metadati `payload.files` / `payload.artifact`
  forniti dal chiamante vengono rifiutati.
- Le richieste di pubblicazione multipart dirette sono limitate a 18 MB. I tarball ClawPack possono
  usare il flusso upload-url fino al limite di 120 MB per tarball.
- Campo payload opzionale: `ownerHandle`. Quando presente, solo gli admin possono pubblicare per conto di quel proprietario.

Punti principali della convalida:

- `family` deve essere `code-plugin` o `bundle-plugin`.
- I pacchetti Plugin richiedono `openclaw.plugin.json`. I caricamenti ClawPack `.tgz` devono
  contenerlo in `package/openclaw.plugin.json`.
- I code plugin richiedono `package.json`, metadati del repo sorgente, metadati del commit sorgente,
  metadati dello schema di configurazione, `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` e `openclaw.environment` sono metadati opzionali.
- Solo il publisher dell'organizzazione `openclaw` e i publisher personali dei membri correnti
  dell'organizzazione `openclaw` possono pubblicare nel canale `official`.
- Le pubblicazioni per conto di altri convalidano comunque l'idoneità al canale ufficiale rispetto all'account proprietario di destinazione.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Elimina in modo reversibile / ripristina una skill (proprietario, moderatore o admin).

Corpo JSON opzionale:

```json
{ "reason": "Held for moderation pending legal review." }
```

Quando presente, `reason` viene memorizzato come nota di moderazione della skill e copiato nel registro di audit.
Le eliminazioni reversibili avviate dal proprietario riservano lo slug per 30 giorni, poi lo slug può essere rivendicato da
un altro publisher. La risposta di eliminazione include `slugReservedUntil` quando si applica questa scadenza.
Gli occultamenti da moderatore/admin e le rimozioni di sicurezza non scadono in questo modo.

Risposta di eliminazione:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Codici di stato:

- `200`: ok
- `401`: non autorizzato
- `403`: vietato
- `404`: skill/utente non trovato
- `500`: errore interno del server

### `POST /api/v1/users/publisher`

Solo admin. Garantisce che esista un publisher di organizzazione per un handle. Se l'handle punta ancora a un
publisher legacy condiviso utente/personale, l'endpoint lo migra prima in un publisher di organizzazione.
Per un'organizzazione appena creata, fornisci `memberHandle`; l'admin che agisce non viene aggiunto come membro.
`memberRole` è predefinito a `owner`.

- Corpo: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Risposta: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Creazione autenticata self-service di un publisher di organizzazione. Crea un nuovo publisher di organizzazione e aggiunge il
chiamante come proprietario. Questo endpoint non migra handle utente/personali esistenti e non
contrassegna il publisher come attendibile/ufficiale.

- Corpo: `{ "handle": "opik", "displayName": "Opik" }`
- Risposta: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Restituisce `409` quando l'handle è già usato da un publisher, utente o publisher personale.

### `POST /api/v1/users/reserve`

Solo admin. Riserva slug radice e nomi di pacchetti per un proprietario legittimo senza pubblicare una
release. I nomi dei pacchetti diventano pacchetti placeholder privati senza righe di release, così lo stesso
proprietario può pubblicare in seguito la vera release code-plugin o bundle-plugin in quel nome.

- Corpo: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Risposta: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Solo admin. Recupera un publisher personale per un principal GitHub OAuth sostitutivo verificato
senza modificare le righe account di Convex Auth. La richiesta deve nominare entrambi gli id account provider GitHub
immutabili; gli handle mutabili sono usati solo come guardrail rivolto all'operatore.

L'endpoint usa per impostazione predefinita l'esecuzione di prova. Applicare il recupero richiede `dryRun: false` e
`confirmIdentityVerified: true` dopo che lo staff ha verificato in modo indipendente la continuità tra entrambi i
principal GitHub. Il recupero fallisce in modo chiuso quando l'editore personale corrente dell'utente di destinazione
ha skill, pacchetti o sorgenti di skill GitHub.
Il recupero migra anche i campi legacy `ownerUserId` per le skill dell'editore recuperato,
gli alias degli slug delle skill, i pacchetti, gli avvisi dell'ispettore pacchetti e le righe derivate del digest di ricerca, in modo che
i percorsi del proprietario diretto concordino con la nuova autorità dell'editore. Anche una prenotazione attiva di handle protetto
per l'handle recuperato viene riassegnata all'utente sostitutivo, così una successiva
sincronizzazione del profilo non può ripristinare l'autorità concorrente dell'utente precedente. Ogni tabella primaria è limitata a
100 righe per transazione di applicazione; recuperi più grandi devono prima usare una migrazione del proprietario riprendibile.
Le sorgenti di skill GitHub hanno ambito editore e sono riportate come controllate invece che riscritte.

- Corpo: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Risposta: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Endpoint di gestione degli slug del proprietario

- `POST /api/v1/skills/{slug}/rename`
  - Corpo: `{ "newSlug": "new-canonical-slug" }`
  - Risposta: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Corpo: `{ "targetSlug": "canonical-target-slug" }`
  - Risposta: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Note:

- Entrambi gli endpoint richiedono l'autenticazione con token API e funzionano solo per il proprietario della skill.
- `rename` conserva lo slug precedente come alias di reindirizzamento.
- `merge` nasconde la scheda sorgente e reindirizza lo slug sorgente alla scheda di destinazione.

### Endpoint di trasferimento della proprietà

- `POST /api/v1/skills/{slug}/transfer`
  - Corpo: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Risposta: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Risposta (accetta/rifiuta/annulla): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Forma della risposta: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Banna un utente ed elimina definitivamente le skill possedute (solo moderatore/admin).

Corpo:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

oppure

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Risposta:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Rimuove il ban di un utente e ripristina le skill idonee (solo admin).

Corpo:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

oppure

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Risposta:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Modifica il motivo memorizzato per un ban esistente senza rimuovere il ban né ripristinare
i contenuti (solo admin). Per impostazione predefinita usa l'esecuzione di prova, a meno che `dryRun` sia `false`.

Corpo:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

oppure

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

Risposta:

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

Modifica il ruolo di un utente (solo admin).

Corpo:

```json
{ "handle": "user_handle", "role": "moderator" }
```

oppure

```json
{ "userId": "users_...", "role": "admin" }
```

Risposta:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Elenca o cerca utenti (solo admin).

Parametri query:

- `q` (opzionale): query di ricerca
- `query` (opzionale): alias per `q`
- `limit` (opzionale): risultati massimi (predefinito 20, massimo 200)

Risposta:

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

Aggiunge/rimuove una stella (elementi in evidenza). Entrambi gli endpoint sono idempotenti.

Risposte:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Endpoint CLI legacy (deprecati)

Ancora supportati per le versioni CLI più vecchie:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Consulta `DEPRECATIONS.md` per il piano di rimozione.

`POST /api/cli/upload-url` restituisce `uploadUrl` e `uploadTicket`. Le pubblicazioni di pacchetti
che preparano un tarball ClawPack devono inviare l'id di archiviazione risultante come
`clawpack` e il ticket restituito come `clawpackUploadTicket`.

## Rilevamento del registro (`/.well-known/clawhub.json`)

La CLI può rilevare le impostazioni di registro/autenticazione dal sito:

- `/.well-known/clawhub.json` (JSON, preferito)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Se esegui self-hosting, servi questo file (oppure imposta `CLAWHUB_REGISTRY` esplicitamente; legacy `CLAWDHUB_REGISTRY`).
