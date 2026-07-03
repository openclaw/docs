---
read_when:
    - Aggiunta/modifica degli endpoint
    - Debug delle richieste CLI ↔ registro
summary: Riferimento API HTTP (endpoint pubblici + CLI + autenticazione).
x-i18n:
    generated_at: "2026-07-03T23:33:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL di base: `https://clawhub.ai` (predefinito).

Tutti i percorsi v1 sono sotto `/api/v1/...`.
I percorsi legacy `/api/...` e `/api/cli/...` restano per compatibilità (vedi `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Riutilizzo del catalogo pubblico

Le directory di terze parti possono usare gli endpoint pubblici di lettura per elencare o cercare Skills ClawHub. Memorizza i risultati nella cache, rispetta `429`/`Retry-After`, rimanda gli utenti alla scheda ClawHub canonica (`https://clawhub.ai/<owner>/skills/<slug>`) ed evita di suggerire un'approvazione di ClawHub per il sito di terze parti. Non tentare di replicare contenuti nascosti, privati o bloccati dalla moderazione al di fuori della superficie dell'API pubblica.

Le scorciatoie Web degli slug si risolvono tra le famiglie del registro, ma i client API dovrebbero usare
gli URL canonici restituiti dagli endpoint di lettura invece di ricostruire la precedenza
delle route.

## Limiti di frequenza

Modello di applicazione:

- Richieste anonime: applicate per IP.
- Richieste autenticate (token Bearer valido): applicate per bucket utente.
- Se il token manca o non è valido, il comportamento ricade sull'applicazione per IP.
- Gli endpoint di scrittura autenticati non dovrebbero restituire un semplice `Unauthorized` quando
  il server conosce il motivo. Token mancanti, token non validi/revocati e
  account eliminati/bannati/disabilitati dovrebbero ciascuno ricevere un testo utilizzabile, così i client
  CLI possono indicare agli utenti cosa li ha bloccati.

- Lettura: 3000/min per IP, 12000/min per chiave
- Scrittura: 300/min per IP, 3000/min per chiave
- Download: 1200/min per IP, 6000/min per chiave (endpoint di download)

Header:

- Compatibilità legacy: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Standardizzati: `RateLimit-Limit`, `RateLimit-Reset`
- Su `429`: `X-RateLimit-Remaining: 0` e `RateLimit-Remaining: 0`
- Su `429`: `Retry-After`

Semantica degli header:

- `X-RateLimit-Reset`: secondi assoluti dell'epoca Unix
- `RateLimit-Reset`: secondi fino al reset (ritardo)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: budget rimanente esatto quando presente.
  Le richieste sharded riuscite omettono questo header invece di restituire un valore globale approssimativo.
- `Retry-After`: secondi da attendere prima di ritentare (ritardo) su `429`

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

Indicazioni per il client:

- Se `Retry-After` esiste, attendi quel numero di secondi prima di ritentare.
- Usa backoff con jitter per evitare tentativi sincronizzati.
- Se `Retry-After` manca, ricadi su `RateLimit-Reset` (o calcola da `X-RateLimit-Reset`).

Origine IP:

- Usa header IP client attendibili, incluso `cf-connecting-ip`, solo quando il
  deployment abilita esplicitamente gli header inoltrati attendibili.
- ClawHub usa header di inoltro attendibili per identificare gli IP client al perimetro.
- Se non è disponibile alcun IP client attendibile, le richieste anonime usano bucket di fallback
  limitati solo dal tipo di limite di frequenza. Questi bucket di fallback non includono
  percorsi forniti dal chiamante, slug, nomi di pacchetti, versioni, stringhe di query o altri
  parametri degli artefatti.

## Risposte di errore

Le risposte di errore pubbliche v1 sono testo semplice con `content-type: text/plain; charset=utf-8`.
Questo include errori di convalida (`400`), risorse pubbliche mancanti (`404`), errori di autenticazione e
permessi (`401`/`403`), limiti di frequenza (`429`) e download bloccati. I client
dovrebbero leggere il corpo della risposta come stringa leggibile da una persona. I parametri di query sconosciuti sono
ignorati per compatibilità, ma i parametri di query riconosciuti con valori non validi restituiscono
`400`.

## Endpoint pubblici (senza autenticazione)

### `GET /api/v1/search`

Parametri di query:

- `q` (obbligatorio): stringa di query
- `limit` (facoltativo): intero
- `highlightedOnly` (facoltativo): `true` per filtrare solo gli Skills evidenziati
- `nonSuspiciousOnly` (facoltativo): `true` per nascondere gli Skills sospetti (`flagged.suspicious`)
- `nonSuspicious` (facoltativo): alias legacy di `nonSuspiciousOnly`

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

- I risultati vengono restituiti in ordine di rilevanza (similarità embedding + boost dei token esatti di slug/nome + un piccolo prior di popolarità).
- La rilevanza è più forte della popolarità. Una corrispondenza precisa di slug o token del nome visualizzato può superare una corrispondenza più vaga con coinvolgimento molto più forte.
- Il testo ASCII viene tokenizzato sui confini di parole e punteggiatura. Per esempio, `personal-map` contiene un token autonomo `map`, mentre `amap-jsapi-skill` contiene `amap`, `jsapi` e `skill`; cercare `map` quindi assegna a `personal-map` una corrispondenza lessicale più forte rispetto a `amap-jsapi-skill`.
- La popolarità è scalata logaritmicamente e limitata. Skills con alto coinvolgimento possono classificarsi più in basso quando il testo della query è una corrispondenza più debole.
- Uno stato di moderazione sospetto o nascosto può rimuovere uno Skill dalla ricerca pubblica a seconda dei filtri del chiamante e dello stato di moderazione corrente.

Indicazioni per la reperibilità dei publisher:

- Inserisci i termini che gli utenti cercheranno letteralmente nel nome visualizzato, nel riepilogo e nei tag. Usa un token slug autonomo solo quando è anche un'identità stabile che vuoi mantenere.
- Non rinominare uno slug solo per inseguire una query, a meno che il nuovo slug sia un nome canonico migliore a lungo termine. Gli slug vecchi diventano alias di reindirizzamento, ma l'URL canonico, lo slug visualizzato e i digest di ricerca futuri usano il nuovo slug.
- Gli alias di rinomina preservano la risoluzione per vecchi URL e installazioni che si risolvono tramite il registro, ma il ranking di ricerca si basa sui metadati canonici dello Skill dopo l'indicizzazione della rinomina. Le statistiche esistenti restano associate allo Skill.
- Se uno Skill è inaspettatamente invisibile, controlla prima lo stato di moderazione con `clawhub inspect @owner/slug` mentre hai effettuato l'accesso, prima di modificare metadati legati al ranking.

### `GET /api/v1/skills`

Parametri di query:

- `limit` (facoltativo): intero (1–200)
- `cursor` (facoltativo): cursore di paginazione per qualsiasi ordinamento non `trending`
- `sort` (facoltativo): `updated` (predefinito), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), gli alias legacy di installazione `installsCurrent`/`installs`/`installsAllTime` mappano a `downloads`, `trending`
- `nonSuspiciousOnly` (facoltativo): `true` per nascondere gli Skills sospetti (`flagged.suspicious`)
- `nonSuspicious` (facoltativo): alias legacy di `nonSuspiciousOnly`

Valori `sort` non validi restituiscono `400`.

Note:

- `recommended` usa segnali di coinvolgimento e recenza.
- `trending` ordina in base alle installazioni negli ultimi 7 giorni (basato su telemetria).
- `createdAt` è stabile per i crawl di nuovi Skill; `updated` cambia quando Skills esistenti vengono ripubblicati.
- Quando `nonSuspiciousOnly=true`, gli ordinamenti basati su cursore possono restituire meno di `limit` elementi in una pagina perché gli Skills sospetti vengono filtrati dopo il recupero della pagina.
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

- Gli slug vecchi creati dai flussi di rinomina/unione del proprietario si risolvono nello Skill canonico.
- `metadata.os`: restrizioni OS dichiarate nel frontmatter dello Skill (per es. `["macos"]`, `["linux"]`). `null` se non dichiarato.
- `metadata.systems`: target di sistema Nix (per es. `["aarch64-darwin", "x86_64-linux"]`). `null` se non dichiarato.
- `metadata` è `null` se lo Skill non ha metadati di piattaforma.
- `moderation` è incluso solo quando lo Skill è segnalato o il proprietario lo sta visualizzando.

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

- Proprietari e moderatori possono accedere ai dettagli di moderazione per Skills nascosti.
- I chiamanti pubblici ricevono `200` solo per Skills visibili già segnalati.
- Le prove sono redatte per i chiamanti pubblici e includono snippet grezzi solo per proprietari/moderatori.

### `POST /api/v1/skills/{slug}/report`

Segnala uno Skill per la revisione dei moderatori. Le segnalazioni sono a livello di Skill, facoltativamente collegate
a una versione, e alimentano la coda delle segnalazioni degli Skill.

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

Endpoint moderatore/admin per l'acquisizione delle segnalazioni degli Skill.

Parametri di query:

- `status` (facoltativo): `open` (predefinito), `confirmed`, `dismissed` o `all`
- `limit` (facoltativo): intero (1-200)
- `cursor` (facoltativo): cursore di paginazione

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
si imposta di nuovo `status` su `open`. Passa `finalAction: "hide"` con una segnalazione
esaminata per nascondere lo Skill nello stesso workflow verificabile.

### `GET /api/v1/skills/{slug}/versions`

Parametri di query:

- `limit` (facoltativo): intero
- `cursor` (facoltativo): cursore di paginazione

### `GET /api/v1/skills/{slug}/versions/{version}`

Restituisce metadati della versione + elenco dei file.

- `version.security` include lo stato di verifica della scansione normalizzato e i dettagli dello scanner
  (VirusTotal + LLM), quando disponibili.

### `GET /api/v1/skills/{slug}/scan`

Restituisce i dettagli di verifica della scansione di sicurezza per una versione di Skill.

Parametri di query:

- `version` (facoltativo): stringa di versione specifica.
- `tag` (facoltativo): risolve una versione con tag (per esempio `latest`).

Note:

- Se non viene fornito né `version` né `tag`, usa la versione più recente.
- Include lo stato di verifica normalizzato più i dettagli specifici dello scanner.
- `security.hasScanResult` è `true` solo quando uno scanner ha prodotto un verdetto definitivo (`clean`, `suspicious` o `malicious`).
- `moderation` è uno snapshot di moderazione attuale a livello di skill derivato dalla versione più recente.
- Quando interroghi una versione storica, controlla `moderation.matchesRequestedVersion` e `moderation.sourceVersion` prima di trattare `moderation` e `security` come lo stesso contesto di versione.

### `POST /api/v1/skills/-/scan`

Endpoint di invio autenticato per nuovi job ClawScan.

Le scansioni di caricamenti locali non sono più supportate. Le richieste che usano
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
- Le scansioni pubblicate scrivono le modifiche solo quando `update: true` e la scansione viene completata correttamente.
- La risposta è `202` con `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- I job di scansione sono asincroni. Le richieste di scansione manuale hanno priorità rispetto al normale lavoro di pubblicazione/backfill, ma il completamento dipende comunque dalla disponibilità dei worker.

### `GET /api/v1/skills/-/scan/{scanId}`

Endpoint di polling autenticato per una scansione inviata.

- Restituisce lo stato queued/running/succeeded/failed.
- Restituisce `queue.queuedAhead` e `queue.position` mentre è in coda, così i client possono mostrare quante scansioni manuali prioritarie precedono la richiesta. Le code molto grandi sono limitate e riportate con `queuedAheadIsEstimate: true`.
- Quando disponibile, `report` contiene le sezioni `clawscan`, `skillspector`, `staticAnalysis` e `virustotal`.
- I job di scansione non riusciti restituiscono `status: "failed"` con `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Endpoint autenticato per l'archivio dei report.

- Richiede una scansione riuscita; le scansioni non terminali restituiscono `409`.
- Restituisce uno ZIP con `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` e `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Endpoint autenticato per l'archivio dei report memorizzati per le versioni inviate.

- Richiede accesso di gestione da proprietario/editore alla skill o al plugin, oppure autorità di moderatore/amministratore della piattaforma.
- Restituisce i risultati di scansione memorizzati per la versione esatta inviata, incluse le versioni bloccate o nascoste.
- `kind` usa `skill` come valore predefinito; usa `kind=plugin` per le scansioni di plugin/pacchetti.
- Restituisce la stessa forma ZIP dei download delle richieste di scansione.

### `POST /api/v1/skills/-/scan/batch`

Route canonica di nuova scansione batch riservata agli amministratori. Accetta la stessa forma di payload della legacy `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Route canonica di stato batch riservata agli amministratori. Accetta `{ "jobIds": ["..."] }` e restituisce gli stessi contatori aggregati della legacy `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Restituisce l'envelope di verifica della Skill Card usato da `clawhub skill verify`.

Parametri di query:

- `version` (facoltativo): stringa di versione specifica.
- `tag` (facoltativo): risolve una versione con tag (per esempio `latest`).

Note:

- `ok` è `true` solo quando la versione selezionata ha una Skill Card generata, non è bloccata come malware dalla moderazione e la verifica ClawScan è pulita.
- L'identità della skill, l'identità dell'editore e i metadati della versione selezionata sono campi di primo livello dell'envelope (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) così l'automazione shell può leggerli senza decomprimere wrapper annidati.
- `security` è il verdetto ClawScan/security di primo livello. L'automazione dovrebbe basarsi su `ok`, `decision`, `reasons` e `security.status`.
- `security.signals` contiene prove di supporto dagli scanner, come `staticScan`, `virusTotal` e `skillSpector`.
- `security.signals.dependencyRegistry` viene mantenuto per compatibilità con le risposte v1, ma lo scanner di esistenza del registro delle dipendenze è ritirato e questa chiave è sempre `null`.
- `provenance` è `server-resolved-github-import` solo quando ClawHub ha risolto e memorizzato un repository/ref/commit/percorso GitHub durante la pubblicazione o l'importazione; altrimenti è `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Restituisce i verdetti di sicurezza compatti attuali per versioni esatte di skill. Questo
endpoint di raccolta è destinato ai client che sanno già quali versioni di skill ClawHub installate
devono mostrare, come OpenClaw Control UI.

Richiesta:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Note:

- `items` deve contenere 1-100 coppie univoche `{ slug, version }`.
- I risultati sono per elemento; una skill o versione mancante non fa fallire l'intera risposta.
- La risposta riguarda solo la sicurezza. Non include dati della Skill Card, stato della card generata, elenchi di file degli artefatti o payload dettagliati degli scanner.
- `security.signals` contiene solo prove di supporto a livello di stato; usa `/scan` o la pagina di audit di sicurezza di ClawHub per i dettagli completi degli scanner.
- `security.signals.dependencyRegistry` viene mantenuto per compatibilità con le risposte v1, ma lo scanner di esistenza del registro delle dipendenze è ritirato e questa chiave è sempre `null`.
- L'assenza della Skill Card non influisce su `ok`, `decision` o `reasons` di questo endpoint; i client dovrebbero leggere localmente la `skill-card.md` installata quando hanno bisogno del contenuto della card.
- Usa `/verify` quando ti serve l'envelope di verifica della Skill Card per una singola skill, `/card` quando ti serve il markdown della card generata e `/scan` quando ti servono dati dettagliati degli scanner.

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

Restituisce il contenuto testuale grezzo.

Parametri di query:

- `path` (obbligatorio)
- `version` (facoltativo)
- `tag` (facoltativo)

Note:

- Per impostazione predefinita usa la versione più recente.
- Limite di dimensione del file: 200KB.

### `GET /api/v1/packages`

Endpoint di catalogo unificato per:

- Skills
- plugin di codice
- plugin bundle

Parametri di query:

- `limit` (facoltativo): intero (1–100)
- `cursor` (facoltativo): cursore di paginazione
- `family` (facoltativo): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (facoltativo): `official`, `community` o `private`
- `isOfficial` (facoltativo): `true` o `false`
- `sort` (facoltativo): `updated` (predefinito), `recommended`, `trending`, `downloads`, alias legacy `installs`
- `category` (facoltativo): filtro per categoria di plugin. Supportato solo quando la
  richiesta è limitata ai pacchetti plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` o endpoint dei pacchetti con
  `family=code-plugin`/`family=bundle-plugin`). Le categorie controllate e
  gli alias di filtro legacy v1 sono documentati in `GET /api/v1/plugins`.

Note:

- I valori non validi per `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` o `sort` restituiscono `400`. I parametri di query sconosciuti vengono ignorati.
- `GET /api/v1/code-plugins` e `GET /api/v1/bundle-plugins` restano alias a famiglia fissa.
- Le voci Skills continuano a essere basate sul registro Skills e possono ancora essere pubblicate solo tramite `POST /api/v1/skills`.
- `POST /api/v1/packages` è ancora solo per i rilasci code-plugin e bundle-plugin.
- I chiamanti anonimi vedono solo i canali pubblici dei pacchetti.
- I chiamanti autenticati possono vedere nei risultati di elenco/ricerca i pacchetti privati degli editori a cui appartengono.
- `channel=private` restituisce solo i pacchetti che il chiamante autenticato può leggere.

### `GET /api/v1/packages/search`

Ricerca unificata nel catalogo tra Skills e pacchetti plugin.

Parametri di query:

- `q` (obbligatorio): stringa di query
- `limit` (facoltativo): intero (1–100)
- `family` (facoltativo): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (facoltativo): `official`, `community` o `private`
- `isOfficial` (facoltativo): `true` o `false`
- `category` (facoltativo): filtro per categoria di plugin. Supportato solo quando la
  richiesta è limitata ai pacchetti plugin. Le categorie controllate e gli alias
  di filtro legacy v1 sono documentati in `GET /api/v1/plugins`.

Note:

- I valori non validi per `family`, `channel`, `isOfficial`, `featured` o
  `highlightedOnly` restituiscono `400`. I parametri di query sconosciuti vengono ignorati.
- I chiamanti anonimi vedono solo i canali pubblici dei pacchetti.
- I chiamanti autenticati possono cercare i pacchetti privati degli editori a cui appartengono.
- `channel=private` restituisce solo i pacchetti che il chiamante autenticato può leggere.

### `GET /api/v1/plugins`

Sfoglia il catalogo solo plugin tra pacchetti code-plugin e bundle-plugin.

Parametri di query:

- `limit` (facoltativo): intero (1-100)
- `cursor` (facoltativo): cursore di paginazione
- `isOfficial` (facoltativo): `true` o `false`
- `sort` (facoltativo): `recommended` (predefinito), `trending`, `downloads`, `updated`, alias legacy `installs`
- `category` (facoltativo): filtro per categoria di plugin. Valori attuali:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Gli alias di filtro legacy v1 restano accettati sugli endpoint di lettura:

- `mcp-tooling`, `data` e `automation` si risolvono in `tools`.
- `observability` e `deployment` si risolvono in `gateway`.
- `dev-tools` si risolve in `runtime`.

`trending` è una classifica di installazioni/download degli ultimi sette giorni e non usa i totali storici.
Nell'endpoint unificato `/api/v1/packages` è solo per plugin; usa
`/api/v1/skills?sort=trending` per il catalogo Skills.

Gli alias legacy non sono accettati come valori di categoria memorizzati o dichiarati dall'autore.

### `GET /api/v1/skills/export`

Esportazione in blocco delle Skills pubbliche più recenti per l'analisi offline.

Autenticazione:

- Token API obbligatorio.

Parametri di query:

- `startDate` (obbligatorio): limite inferiore in millisecondi Unix per `updatedAt` della Skill.
- `endDate` (obbligatorio): limite superiore in millisecondi Unix per `updatedAt` della Skill.
- `limit` (facoltativo): intero (1-250), predefinito `250`.
- `cursor` (facoltativo): cursore di paginazione dalla risposta precedente.

Risposta:

- Corpo: archivio ZIP.
- Ogni Skill esportata ha radice in `{publisher}/{slug}/`.
- Le Skills ospitate includono i file dell'ultima versione memorizzata e sono elencate in
  `_manifest.json` con `sourceRef: "public-clawhub"`.
- Le Skills attuali basate su GitHub con scansione `clean` o `suspicious` includono
  `_source_handoff.json` con `sourceRef: "public-github"`, repository, commit, percorso,
  hash del contenuto e URL dell'archivio. Non includono i file sorgente ospitati da ClawHub.
- Ogni Skill include `_export_skill_meta.json`.
- `_manifest.json` è sempre incluso nella radice dello ZIP.
- `_errors.json` è incluso quando singole Skills o file non possono essere
  esportati.

Intestazioni:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Esportazione in blocco delle ultime release pubbliche dei Plugin per analisi offline.

Autenticazione:

- Token API richiesto.

Parametri query:

- `startDate` (obbligatorio): limite inferiore in millisecondi Unix per `updatedAt` del Plugin.
- `endDate` (obbligatorio): limite superiore in millisecondi Unix per `updatedAt` del Plugin.
- `limit` (opzionale): intero (1-250), valore predefinito `250`.
- `cursor` (opzionale): cursore di paginazione dalla risposta precedente.
- `family` (opzionale): `code-plugin` o `bundle-plugin`. Se omesso, indica entrambe
  le famiglie di Plugin.

Risposta:

- Corpo: archivio ZIP.
- Ogni Plugin esportato ha radice in `{family}/{packageName}/`.
- Ogni Plugin esportato include i file archiviati dell'ultima release.
- I metadati di esportazione per Plugin sono archiviati in
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` è sempre incluso nella radice dello ZIP.
- `_errors.json` è incluso quando singoli Plugin o file non hanno potuto essere
  esportati.

Header:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Ricerca solo Plugin tra pacchetti code-plugin e bundle-plugin.

Parametri query:

- `q` (obbligatorio): stringa di query
- `limit` (opzionale): intero (1-100)
- `isOfficial` (opzionale): `true` o `false`
- `category` (opzionale): filtro categoria Plugin. Valori attuali:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Note:

- Sono accettati anche gli alias dei filtri v1 legacy documentati sotto
  `GET /api/v1/plugins`.
- Il filtro per categoria è un vero filtro API basato su righe di digest delle
  categorie dei Plugin, non una riscrittura della query di ricerca.
- I risultati sono restituiti in ordine di rilevanza e attualmente non sono paginati.
- I controlli di ordinamento della UI del browser per la ricerca dei Plugin riordinano i risultati di rilevanza caricati,
  coerentemente con l'attuale comportamento di navigazione di `/skills`.

### `GET /api/v1/packages/{name}`

Restituisce i metadati di dettaglio del pacchetto.

Note:

- Anche Skills può risolversi tramite questa route nel catalogo unificato.
- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.

### `DELETE /api/v1/packages/{name}`

Elimina in modo reversibile un pacchetto e tutte le release.

Note:

- Richiede un token API per il proprietario del pacchetto, un proprietario/amministratore del publisher dell'organizzazione,
  un moderatore della piattaforma o un amministratore della piattaforma.

### `GET /api/v1/packages/{name}/versions`

Restituisce la cronologia delle versioni.

Parametri query:

- `limit` (opzionale): intero (1–100)
- `cursor` (opzionale): cursore di paginazione

Note:

- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.

### `GET /api/v1/packages/{name}/versions/{version}`

Restituisce una versione del pacchetto, inclusi metadati dei file, compatibilità,
verifica, metadati degli artefatti e dati di scansione.

Note:

- `version.artifact.kind` è `legacy-zip` per gli archivi di pacchetti del vecchio mondo o
  `npm-pack` per le release basate su ClawPack.
- Le release ClawPack includono i campi compatibili con npm `npmIntegrity`, `npmShasum` e
  `npmTarballName`.
- `version.sha256hash` è metadato di compatibilità deprecato per i vecchi client. Calcola
  l'hash dei byte ZIP esatti restituiti da `/api/v1/packages/{name}/download`.
  I client moderni dovrebbero usare `version.artifact.sha256`, che identifica
  l'artefatto canonico della release.
- `version.vtAnalysis`, `version.llmAnalysis` e `version.staticScan` sono
  inclusi quando esistono dati di scansione.
- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Restituisce il riepilogo esatto di sicurezza e fiducia della release del pacchetto per i client
di installazione. Questa è la superficie pubblica di consumo di OpenClaw per decidere se una
release risolta può essere installata.

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
- `release.releaseId`, `release.version` e `release.createdAt` identificano la
  release esatta che è stata valutata.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` e `release.npmTarballName` sono presenti quando noti per
  l'artefatto della release.
- `trust.scanStatus` è lo stato di fiducia effettivo derivato dagli input dello scanner
  e dalla moderazione manuale della release.
- `trust.moderationState` è nullable. È `null` quando non esiste alcuna moderazione manuale della release.
- `trust.blockedFromDownload` è il segnale di blocco dell'installazione. OpenClaw e altri
  client di installazione dovrebbero bloccare l'installazione quando questo valore è `true` invece di
  ricalcolare le regole di blocco dai campi dello scanner o della moderazione.
- `trust.reasons` è l'elenco di spiegazioni rivolte all'utente e di audit. I codici motivo
  sono stringhe stabili e compatte come `manual:quarantined`, `scan:malicious`
  e `package:malicious`.
- `trust.pending` indica che uno o più input di fiducia sono ancora in attesa di completamento.
- `trust.stale` indica che il riepilogo di fiducia è stato calcolato da input obsoleti e
  dovrebbe essere trattato come bisognoso di aggiornamento prima di una decisione di autorizzazione ad alta confidenza.

Note:

- Questo endpoint è esatto per versione. I client dovrebbero chiamarlo dopo aver risolto la
  versione del pacchetto che intendono installare, non solo dopo aver letto gli ultimi
  metadati del pacchetto.
- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.
- Questo endpoint è intenzionalmente più ristretto degli endpoint di moderazione per proprietari/moderatori.
  Espone la decisione di installazione e la spiegazione pubblica, non
  le identità dei segnalanti, i corpi dei report, prove private o timeline di revisione
  interne.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Restituisce i metadati espliciti del resolver dell'artefatto per una versione del pacchetto.

Note:

- Le versioni di pacchetto legacy restituiscono un artefatto `legacy-zip` e un
  `downloadUrl` ZIP legacy.
- Le versioni ClawPack restituiscono un artefatto `npm-pack`, campi di integrità npm, un
  `tarballUrl` e l'URL di compatibilità ZIP legacy.
- Questa è la superficie del resolver OpenClaw; evita di dedurre il formato dell'archivio da
  un URL condiviso.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Scarica l'artefatto della versione tramite il percorso esplicito del resolver.

Note:

- Le versioni ClawPack trasmettono in streaming i byte `.tgz` esatti di npm-pack caricati.
- Le versioni ZIP legacy reindirizzano a `/api/v1/packages/{name}/download?version=`.
- Usa il bucket di limite di frequenza dei download.

### `GET /api/v1/packages/{name}/readiness`

Restituisce la readiness calcolata per il consumo futuro di OpenClaw.

I controlli di readiness coprono:

- stato del canale ufficiale
- disponibilità dell'ultima versione
- disponibilità dell'artefatto npm-pack ClawPack
- digest dell'artefatto
- provenienza del repository sorgente e del commit
- metadati di compatibilità OpenClaw
- target host
- stato di scansione

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

Parametri query:

- `phase` (opzionale): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` o
  `all` (predefinito).
- `limit` (opzionale): intero (1-100)
- `cursor` (opzionale): cursore di paginazione

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

Endpoint amministrativo per creare o aggiornare una riga di migrazione di un Plugin ufficiale.

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

- `bundledPluginId` è normalizzato in minuscolo ed è la chiave upsert stabile.
- `packageName` è normalizzato come nome npm; il pacchetto può mancare per le migrazioni
  pianificate.
- Questo traccia solo la readiness della migrazione. Non modifica OpenClaw né genera
  ClawPack.

### `GET /api/v1/packages/moderation/queue`

Endpoint per moderatori/amministratori per le code di revisione delle release dei pacchetti.

Autenticazione:

- Richiede un token API per un utente moderatore o amministratore.

Parametri query:

- `status` (opzionale): `open` (predefinito), `blocked`, `manual` o `all`
- `limit` (opzionale): intero (1-100)
- `cursor` (opzionale): cursore di paginazione

Significati dello stato:

- `open`: release sospette, malevole, in sospeso, in quarantena, revocate o segnalate.
- `blocked`: release in quarantena, revocate o malevole.
- `manual`: qualsiasi release con una sovrascrittura di moderazione manuale.
- `all`: qualsiasi release con una sovrascrittura manuale, stato di scansione non pulito o segnalazione del pacchetto.

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

Segnala un pacchetto per la revisione dei moderatori. Le segnalazioni sono a livello di pacchetto, opzionalmente
collegate a una versione. Alimentano la coda di moderazione ma non nascondono automaticamente né
bloccano i download da sole; i moderatori dovrebbero usare la moderazione delle release per
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

Endpoint moderator/admin per l'acquisizione dei report sui pacchetti.

Autenticazione:

- Richiede un token API per un utente moderatore o amministratore.

Parametri di query:

- `status` (facoltativo): `open` (predefinito), `confirmed`, `dismissed` o `all`
- `limit` (facoltativo): intero (1-100)
- `cursor` (facoltativo): cursore di paginazione

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

Endpoint owner/moderatore per la visibilità della moderazione dei pacchetti.

Autenticazione:

- Richiede un token API per il proprietario del pacchetto, un membro del publisher, un moderatore o
  un utente amministratore.

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

Endpoint moderator/admin per risolvere o riaprire i report sui pacchetti.

Richiesta:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` è obbligatorio per `confirmed` e `dismissed`; può essere omesso quando si
imposta di nuovo `status` su `open`. Passa `finalAction: "quarantine"` o
`finalAction: "revoke"` con un report confermato per applicare la moderazione della release nello
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

Endpoint moderator/admin per la revisione delle release dei pacchetti.

Richiesta:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Stati supportati:

- `approved`: revisionata manualmente e consentita.
- `quarantined`: bloccata in attesa di follow-up.
- `revoked`: bloccata dopo che una release era stata considerata attendibile in precedenza.

Le release in quarantena e revocate restituiscono `403` dalle route di download degli artefatti.
Ogni modifica scrive una voce nel log di audit.

### `GET /api/v1/packages/{name}/file`

Restituisce il contenuto testuale grezzo di un file del pacchetto.

Parametri di query:

- `path` (obbligatorio)
- `version` (facoltativo)
- `tag` (facoltativo)

Note:

- Usa come valore predefinito la release più recente.
- Usa il bucket di frequenza di lettura, non il bucket di download.
- I file binari restituiscono `415`.
- Limite di dimensione del file: 200 KB.
- Le scansioni VirusTotal in sospeso non bloccano le letture; le release malevole possono comunque essere trattenute altrove.
- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.

### `GET /api/v1/packages/{name}/download`

Scarica l'archivio ZIP deterministico legacy per una release del pacchetto.

Parametri di query:

- `version` (facoltativo)
- `tag` (facoltativo)

Note:

- Usa come valore predefinito la release più recente.
- Le Skills reindirizzano a `GET /api/v1/download`.
- Gli archivi Plugin/pacchetto sono file zip con una radice `package/` affinché i vecchi client OpenClaw
  continuino a funzionare.
- Questa route resta solo ZIP. Non trasmette in streaming i file ClawPack `.tgz`.
- Le risposte includono gli header `ETag`, `Digest`, `X-ClawHub-Artifact-Type` e
  `X-ClawHub-Artifact-Sha256` per i controlli di integrità del resolver.
- I metadati solo di registry non vengono inseriti nell'archivio scaricato.
- Le scansioni VirusTotal in sospeso non bloccano i download; le release malevole restituiscono `403`.
- I pacchetti privati restituiscono `404` a meno che il chiamante sia il proprietario.

### `GET /api/npm/{package}`

Restituisce un packument compatibile con npm per le versioni di pacchetto basate su ClawPack.

Note:

- Sono elencate solo le versioni con tarball npm-pack ClawPack caricati.
- Le versioni legacy solo ZIP sono omesse intenzionalmente.
- `dist.tarball`, `dist.integrity` e `dist.shasum` usano campi compatibili con npm
  così gli utenti possono puntare npm al mirror se lo desiderano.
- I packument dei pacchetti con scope supportano sia `/api/npm/@scope/name` sia il percorso di richiesta
  codificato di npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Trasmette in streaming i byte esatti del tarball ClawPack caricato per i client del mirror npm.

Note:

- Usa il bucket di frequenza di download.
- Gli header di download includono SHA-256 ClawHub più metadati npm integrity/shasum.
- I controlli di moderazione e di accesso ai pacchetti privati continuano ad applicarsi.

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

Scarica uno ZIP di versione di skill ospitata, oppure restituisce un handoff della sorgente GitHub per una
skill corrente basata su GitHub con una scansione `clean` o `suspicious` e nessuna
versione ospitata.

Parametri di query:

- `slug` (obbligatorio)
- `version` (facoltativo): stringa semver
- `tag` (facoltativo): nome tag (ad es. `latest`)

Note:

- Se non viene fornito né `version` né `tag`, viene usata la versione più recente.
- Le versioni eliminate in modo reversibile restituiscono `410`.
- Gli handoff delle skill basate su GitHub non fanno proxy né mirror dei byte. La risposta JSON
  include `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  e `archiveUrl`; lo stato di scansione/corrente è un gate e non è incluso come metadato
  del payload di successo.
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
- È accettato anche un corpo JSON con `files` (basato su storageId).
- Campo payload facoltativo: `ownerHandle`. Quando presente, l'API risolve quel
  publisher lato server e richiede che l'attore abbia accesso al publisher.
- Campo payload facoltativo: `migrateOwner`. Quando `true` con `ownerHandle`, una
  skill esistente può spostarsi a quel proprietario se l'attore è admin/owner sia sul
  publisher corrente sia su quello di destinazione. Senza questa adesione esplicita, le modifiche del proprietario vengono
  rifiutate.

### `POST /api/v1/packages`

Pubblica una release code-plugin o bundle-plugin.

- Richiede autenticazione con token Bearer.
- Richiede `multipart/form-data`.
- I campi del form consentiti sono `payload`, blob `files` ripetuti o un riferimento tarball
  `clawpack`. `clawpack` può essere un blob `.tgz` o un ID di archiviazione restituito dal
  flusso upload-url. Le pubblicazioni con ID di archiviazione in staging devono includere anche il
  `clawpackUploadTicket` restituito con quell'URL di upload.
- Usa `files` oppure `clawpack`, mai entrambi nella stessa richiesta.
- I corpi JSON e i metadati `payload.files` / `payload.artifact`
  forniti dal chiamante vengono rifiutati.
- Le richieste di pubblicazione multipart dirette hanno un limite di 18 MB. I tarball ClawPack possono
  usare il flusso upload-url fino al limite tarball di 120 MB.
- Campo payload facoltativo: `ownerHandle`. Quando presente, solo gli admin possono pubblicare per conto di quel proprietario.

Elementi principali della convalida:

- `family` deve essere `code-plugin` o `bundle-plugin`.
- I pacchetti Plugin richiedono `openclaw.plugin.json`. I caricamenti ClawPack `.tgz` devono
  contenerlo in `package/openclaw.plugin.json`.
- I code plugin richiedono `package.json`, metadati del repository sorgente, metadati del commit sorgente,
  metadati dello schema di configurazione, `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` e `openclaw.environment` sono metadati facoltativi.
- Solo il publisher dell'organizzazione `openclaw` e i publisher personali degli attuali membri
  dell'organizzazione `openclaw` possono pubblicare nel canale `official`.
- Le pubblicazioni per conto di altri convalidano comunque l'idoneità al canale ufficiale rispetto all'account proprietario di destinazione.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Elimina in modo reversibile / ripristina una skill (proprietario, moderatore o admin).

Corpo JSON facoltativo:

```json
{ "reason": "Held for moderation pending legal review." }
```

Quando presente, `reason` viene archiviato come nota di moderazione della skill e copiato nel log di audit.
Le eliminazioni reversibili avviate dal proprietario riservano lo slug per 30 giorni, poi lo slug può essere rivendicato da
un altro publisher. La risposta di eliminazione include `slugReservedUntil` quando questa scadenza si applica.
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
publisher utente/personale condiviso legacy, l'endpoint lo migra prima in un publisher di organizzazione.
Per una nuova organizzazione, fornisci `memberHandle`; l'admin che agisce non viene aggiunto come membro.
`memberRole` usa `owner` come valore predefinito.

- Corpo: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Risposta: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Creazione autenticata self-service di un publisher di organizzazione. Crea un nuovo publisher di organizzazione e aggiunge il
chiamante come proprietario. Questo endpoint non migra handle utente/personali esistenti e non
contrassegna il publisher come attendibile/ufficiale.

- Corpo: `{ "handle": "opik", "displayName": "Opik" }`
- Risposta: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Restituisce `409` quando l'handle è già usato da un publisher, un utente o un publisher personale.

### `POST /api/v1/users/reserve`

Solo admin. Riserva slug radice e nomi di pacchetto per un proprietario legittimo senza pubblicare una
release. I nomi di pacchetto diventano pacchetti segnaposto privati senza righe di release, così lo stesso
proprietario può in seguito pubblicare la vera release code-plugin o bundle-plugin con quel nome.

- Corpo: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Risposta: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Solo admin. Recupera un publisher personale per un principal GitHub OAuth sostitutivo verificato
senza modificare le righe dell'account Convex Auth. La richiesta deve indicare entrambi gli ID account
immutabili del provider GitHub; gli handle mutabili sono usati solo come protezione rivolta all'operatore.

L'endpoint usa per impostazione predefinita la dry-run. L'applicazione del ripristino richiede `dryRun: false` e
`confirmIdentityVerified: true` dopo che lo staff ha verificato in modo indipendente la continuità tra entrambe
le identità principali GitHub. Il ripristino fallisce in modo chiuso quando l'attuale publisher personale
dell'utente di destinazione ha skill, pacchetti o fonti di skill GitHub.
Il ripristino migra anche i campi legacy `ownerUserId` per le skill del publisher ripristinato,
gli alias degli slug delle skill, i pacchetti, gli avvisi dell'ispettore dei pacchetti e le righe derivate del digest di ricerca, così
i percorsi con proprietario diretto concordano con la nuova autorità del publisher. Anche una prenotazione attiva di handle protetto
per l'handle ripristinato viene riassegnata all'utente sostitutivo, così la successiva
sincronizzazione del profilo non può ripristinare l'autorità concorrente dell'utente precedente. Ogni tabella primaria è limitata a
100 righe per transazione di applicazione; i ripristini più grandi devono prima usare una migrazione del proprietario riprendibile.
Le fonti di skill GitHub sono nell'ambito del publisher e sono segnalate come controllate anziché riscritte.

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
- `merge` nasconde la voce di origine e reindirizza lo slug di origine alla voce di destinazione.

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

Banna un utente ed elimina definitivamente le skill possedute (solo moderatore/amministratore).

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

Rimuove il ban di un utente e ripristina le skill idonee (solo amministratore).

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

Modifica il motivo archiviato per un ban esistente senza rimuovere il ban né ripristinare
il contenuto (solo amministratore). Per impostazione predefinita usa la dry-run, a meno che `dryRun` sia `false`.

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

Modifica il ruolo di un utente (solo amministratore).

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

Elenca o cerca utenti (solo amministratore).

Parametri query:

- `q` (facoltativo): query di ricerca
- `query` (facoltativo): alias per `q`
- `limit` (facoltativo): numero massimo di risultati (predefinito 20, massimo 200)

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

Aggiunge/rimuove una star (in evidenza). Entrambi gli endpoint sono idempotenti.

Risposte:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Endpoint CLI legacy (deprecati)

Ancora supportati per le versioni precedenti della CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Vedi `DEPRECATIONS.md` per il piano di rimozione.

`POST /api/cli/upload-url` restituisce `uploadUrl` e `uploadTicket`. Le pubblicazioni di pacchetti
che preparano un tarball ClawPack devono inviare l'id di archiviazione risultante come
`clawpack` e il ticket restituito come `clawpackUploadTicket`.

## Individuazione del registro (`/.well-known/clawhub.json`)

La CLI può individuare le impostazioni di registro/autenticazione dal sito:

- `/.well-known/clawhub.json` (JSON, preferito)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Se esegui self-hosting, servi questo file (oppure imposta esplicitamente `CLAWHUB_REGISTRY`; legacy `CLAWDHUB_REGISTRY`).
