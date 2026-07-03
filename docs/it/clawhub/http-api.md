---
read_when:
    - Aggiunta/modifica di endpoint
    - Debug delle richieste CLI ↔ registro
summary: Riferimento API HTTP (endpoint pubblici + endpoint CLI + autenticazione).
x-i18n:
    generated_at: "2026-07-03T09:39:33Z"
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

Le directory di terze parti possono usare gli endpoint pubblici di lettura per elencare o cercare Skills di ClawHub. Memorizza i risultati in cache, rispetta `429`/`Retry-After`, rimanda gli utenti alla scheda canonica di ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) ed evita di suggerire un'approvazione da parte di ClawHub del sito di terze parti. Non tentare di rispecchiare contenuti nascosti, privati o bloccati dalla moderazione al di fuori della superficie dell'API pubblica.

Le scorciatoie degli slug web si risolvono tra le famiglie del registro, ma i client API dovrebbero usare
gli URL canonici restituiti dagli endpoint di lettura invece di ricostruire la precedenza
delle route.

## Limiti di frequenza

Modello di applicazione:

- Richieste anonime: applicate per IP.
- Richieste autenticate (token Bearer valido): applicate per bucket utente.
- Se il token manca o non è valido, il comportamento ricade sull'applicazione per IP.
- Gli endpoint di scrittura autenticati non dovrebbero restituire un semplice `Unauthorized` quando
  il server conosce il motivo. Token mancanti, token non validi/revocati e
  account eliminati/bannati/disabilitati dovrebbero ricevere ciascuno un testo azionabile, così che i client
  CLI possano indicare agli utenti che cosa li ha bloccati.

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
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: budget restante esatto quando presente.
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

Indicazioni per il client:

- Se `Retry-After` esiste, attendi quel numero di secondi prima di riprovare.
- Usa un backoff con jitter per evitare tentativi sincronizzati.
- Se `Retry-After` manca, ricadi su `RateLimit-Reset` (o calcolalo da `X-RateLimit-Reset`).

Origine IP:

- Usa header IP client attendibili, incluso `cf-connecting-ip`, solo quando la
  distribuzione abilita esplicitamente gli header inoltrati attendibili.
- ClawHub usa header di inoltro attendibili per identificare gli IP client all'edge.
- Se non è disponibile alcun IP client attendibile, le richieste anonime usano bucket di fallback
  con ambito limitato al tipo di limite di frequenza. Questi bucket di fallback non includono
  percorsi forniti dal chiamante, slug, nomi di pacchetto, versioni, stringhe di query o altri
  parametri degli artefatti.

## Risposte di errore

Le risposte di errore pubbliche v1 sono testo semplice con `content-type: text/plain; charset=utf-8`.
Questo include errori di validazione (`400`), risorse pubbliche mancanti (`404`), errori di autenticazione e
permessi (`401`/`403`), limiti di frequenza (`429`) e download bloccati. I client
dovrebbero leggere il corpo della risposta come stringa leggibile da una persona. I parametri di query sconosciuti vengono
ignorati per compatibilità, ma i parametri di query riconosciuti con valori non validi restituiscono
`400`.

## Endpoint pubblici (senza autenticazione)

### `GET /api/v1/search`

Parametri di query:

- `q` (obbligatorio): stringa di query
- `limit` (facoltativo): intero
- `highlightedOnly` (facoltativo): `true` per filtrare sulle Skills evidenziate
- `nonSuspiciousOnly` (facoltativo): `true` per nascondere Skills sospette (`flagged.suspicious`)
- `nonSuspicious` (facoltativo): alias legacy per `nonSuspiciousOnly`

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

- I risultati vengono restituiti in ordine di pertinenza (similarità degli embedding + incrementi per token esatti di slug/nome + un piccolo prior di popolarità).
- La pertinenza pesa più della popolarità. Una corrispondenza precisa di slug o token del nome visualizzato può superare una corrispondenza più debole con coinvolgimento molto più alto.
- Il testo ASCII viene tokenizzato sui confini di parole e punteggiatura. Per esempio, `personal-map` contiene un token autonomo `map`, mentre `amap-jsapi-skill` contiene `amap`, `jsapi` e `skill`; cercare `map` quindi dà a `personal-map` una corrispondenza lessicale più forte di `amap-jsapi-skill`.
- La popolarità è scalata logaritmicamente e limitata. Skills con alto coinvolgimento possono posizionarsi più in basso quando il testo della query è una corrispondenza più debole.
- Uno stato di moderazione sospetto o nascosto può rimuovere una Skill dalla ricerca pubblica a seconda dei filtri del chiamante e dello stato di moderazione corrente.

Indicazioni di reperibilità per i publisher:

- Inserisci i termini che gli utenti cercheranno letteralmente nel nome visualizzato, nel riepilogo e nei tag. Usa un token slug autonomo solo quando è anche un'identità stabile che vuoi mantenere.
- Non rinominare uno slug solo per inseguire una query, a meno che il nuovo slug sia un nome canonico migliore a lungo termine. I vecchi slug diventano alias di reindirizzamento, ma l'URL canonico, lo slug visualizzato e i digest di ricerca futuri usano il nuovo slug.
- Gli alias di rinomina preservano la risoluzione per i vecchi URL e le installazioni che si risolvono tramite il registro, ma il ranking di ricerca si basa sui metadati canonici della Skill dopo che la rinomina è stata indicizzata. Le statistiche esistenti restano associate alla Skill.
- Se una Skill è inaspettatamente invisibile, controlla prima lo stato di moderazione con `clawhub inspect @owner/slug` mentre hai effettuato l'accesso, prima di modificare i metadati relativi al ranking.

### `GET /api/v1/skills`

Parametri di query:

- `limit` (facoltativo): intero (1–200)
- `cursor` (facoltativo): cursore di paginazione per qualsiasi ordinamento non `trending`
- `sort` (facoltativo): `updated` (predefinito), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), gli alias legacy di installazione `installsCurrent`/`installs`/`installsAllTime` mappano a `downloads`, `trending`
- `nonSuspiciousOnly` (facoltativo): `true` per nascondere Skills sospette (`flagged.suspicious`)
- `nonSuspicious` (facoltativo): alias legacy per `nonSuspiciousOnly`

Valori `sort` non validi restituiscono `400`.

Note:

- `recommended` usa segnali di coinvolgimento e recenza.
- `trending` ordina per installazioni negli ultimi 7 giorni (basato su telemetria).
- `createdAt` è stabile per le scansioni di nuove Skills; `updated` cambia quando le Skills esistenti vengono ripubblicate.
- Quando `nonSuspiciousOnly=true`, gli ordinamenti basati su cursore possono restituire meno elementi di `limit` in una pagina perché le Skills sospette vengono filtrate dopo il recupero della pagina.
- Usa `nextCursor` per continuare la paginazione quando presente. Una pagina breve non significa di per sé fine dei risultati.

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

- I vecchi slug creati dai flussi di rinomina/unione dell'owner si risolvono alla Skill canonica.
- `metadata.os`: restrizioni OS dichiarate nel frontmatter della Skill (per esempio `["macos"]`, `["linux"]`). `null` se non dichiarate.
- `metadata.systems`: target di sistema Nix (per esempio `["aarch64-darwin", "x86_64-linux"]`). `null` se non dichiarati.
- `metadata` è `null` se la Skill non ha metadati di piattaforma.
- `moderation` è incluso solo quando la Skill è contrassegnata o l'owner la sta visualizzando.

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
- I chiamanti pubblici ricevono `200` solo per Skills visibili già contrassegnate.
- Le evidenze sono redatte per i chiamanti pubblici e includono frammenti grezzi solo per owner/moderatori.

### `POST /api/v1/skills/{slug}/report`

Segnala una Skill per la revisione dei moderatori. Le segnalazioni sono a livello di Skill, opzionalmente collegate
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

Endpoint moderatore/admin per l'acquisizione delle segnalazioni di Skill.

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

Endpoint moderatore/admin per risolvere o riaprire le segnalazioni di Skill.

Richiesta:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` è obbligatorio per `confirmed` e `dismissed`; può essere omesso quando
si imposta di nuovo `status` su `open`. Passa `finalAction: "hide"` con una segnalazione
triaged per nascondere la Skill nello stesso workflow verificabile.

### `GET /api/v1/skills/{slug}/versions`

Parametri di query:

- `limit` (facoltativo): intero
- `cursor` (facoltativo): cursore di paginazione

### `GET /api/v1/skills/{slug}/versions/{version}`

Restituisce metadati della versione + elenco dei file.

- `version.security` include lo stato di verifica della scansione normalizzato e i dettagli dello scanner
  (VirusTotal + LLM), quando disponibili.

### `GET /api/v1/skills/{slug}/scan`

Restituisce i dettagli di verifica della scansione di sicurezza per una versione della Skill.

Parametri di query:

- `version` (facoltativo): stringa della versione specifica.
- `tag` (facoltativo): risolve una versione taggata (per esempio `latest`).

Note:

- Se non viene fornito né `version` né `tag`, usa la versione più recente.
- Include lo stato di verifica normalizzato più i dettagli specifici dello scanner.
- `security.hasScanResult` è `true` solo quando uno scanner ha prodotto un verdetto definitivo (`clean`, `suspicious` o `malicious`).
- `moderation` è uno snapshot corrente di moderazione a livello di skill derivato dalla versione più recente.
- Quando interroghi una versione storica, controlla `moderation.matchesRequestedVersion` e `moderation.sourceVersion` prima di trattare `moderation` e `security` come lo stesso contesto di versione.

### `POST /api/v1/skills/-/scan`

Endpoint di invio autenticato per nuovi processi ClawScan.

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
- Le scansioni pubblicate riscrivono i risultati solo quando `update: true` e la scansione viene completata correttamente.
- La risposta è `202` con `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- I processi di scansione sono asincroni. Le richieste di scansione manuale hanno priorità rispetto al normale lavoro di pubblicazione/compilazione retroattiva, ma il completamento dipende comunque dalla disponibilità dei worker.

### `GET /api/v1/skills/-/scan/{scanId}`

Endpoint di polling autenticato per una scansione inviata.

- Restituisce lo stato queued/running/succeeded/failed.
- Restituisce `queue.queuedAhead` e `queue.position` mentre la richiesta è in coda, così i client possono mostrare quante scansioni manuali prioritarie precedono la richiesta. Le code molto grandi sono limitate e riportate con `queuedAheadIsEstimate: true`.
- Quando disponibile, `report` contiene sezioni `clawscan`, `skillspector`, `staticAnalysis` e `virustotal`.
- I processi di scansione non riusciti restituiscono `status: "failed"` con `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Endpoint autenticato per l'archivio dei report.

- Richiede una scansione riuscita; le scansioni non terminali restituiscono `409`.
- Restituisce uno ZIP con `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` e `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Endpoint autenticato per l'archivio dei report archiviati per le versioni inviate.

- Richiede accesso di gestione da proprietario/editore alla skill o al Plugin, oppure autorità di moderatore/amministratore della piattaforma.
- Restituisce i risultati di scansione archiviati per l'esatta versione inviata, incluse le versioni bloccate o nascoste.
- `kind` ha come valore predefinito `skill`; usa `kind=plugin` per scansioni di Plugin/pacchetti.
- Restituisce la stessa struttura ZIP dei download delle richieste di scansione.

### `POST /api/v1/skills/-/scan/batch`

Route canonica riservata agli amministratori per la nuova scansione in batch. Accetta la stessa struttura di payload della route legacy `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Route canonica riservata agli amministratori per lo stato del batch. Accetta `{ "jobIds": ["..."] }` e restituisce gli stessi contatori aggregati della route legacy `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Restituisce l'involucro di verifica della Skill Card usato da `clawhub skill verify`.

Parametri di query:

- `version` (facoltativo): stringa di versione specifica.
- `tag` (facoltativo): risolve una versione con tag (per esempio `latest`).

Note:

- `ok` è `true` solo quando la versione selezionata ha una Skill Card generata, non è bloccata dalla moderazione come malware e la verifica ClawScan è pulita.
- L'identità della skill, l'identità dell'editore e i metadati della versione selezionata sono campi di primo livello dell'involucro (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), così l'automazione shell può leggerli senza decomprimere wrapper annidati.
- `security` è il verdetto ClawScan/sicurezza di primo livello. L'automazione dovrebbe basarsi su `ok`, `decision`, `reasons` e `security.status`.
- `security.signals` contiene prove di supporto dagli scanner, come `staticScan`, `virusTotal` e `skillSpector`.
- `security.signals.dependencyRegistry` viene mantenuto per compatibilità con la risposta v1, ma lo scanner di esistenza del registro delle dipendenze è stato ritirato e questa chiave è sempre `null`.
- `provenance` è `server-resolved-github-import` solo quando ClawHub ha risolto e archiviato un repository/ref/commit/percorso GitHub durante la pubblicazione o l'importazione; altrimenti è `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Restituisce i verdetti di sicurezza compatti correnti per versioni esatte delle skill. Questo
endpoint di raccolta è destinato ai client che sanno già quali versioni delle skill
ClawHub installate devono visualizzare, come OpenClaw Control UI.

Richiesta:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Note:

- `items` deve contenere 1-100 coppie uniche `{ slug, version }`.
- I risultati sono per elemento; una skill o una versione mancante non fa fallire l'intera risposta.
- La risposta riguarda solo la sicurezza. Non include dati della Skill Card, stato della scheda generata, elenchi di file degli artefatti o payload dettagliati degli scanner.
- `security.signals` contiene solo prove di supporto a livello di stato; usa `/scan` o la pagina di audit di sicurezza di ClawHub per i dettagli completi degli scanner.
- `security.signals.dependencyRegistry` viene mantenuto per compatibilità con la risposta v1, ma lo scanner di esistenza del registro delle dipendenze è stato ritirato e questa chiave è sempre `null`.
- L'assenza della Skill Card non influisce su `ok`, `decision` o `reasons` di questo endpoint; i client dovrebbero leggere localmente `skill-card.md` installato quando hanno bisogno del contenuto della scheda.
- Usa `/verify` quando ti serve l'involucro di verifica della Skill Card per una singola skill, `/card` quando ti serve il Markdown della scheda generata e `/scan` quando ti servono dati dettagliati degli scanner.

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

Restituisce contenuto di testo grezzo.

Parametri di query:

- `path` (obbligatorio)
- `version` (facoltativo)
- `tag` (facoltativo)

Note:

- Il valore predefinito è la versione più recente.
- Limite dimensione file: 200 KB.

### `GET /api/v1/packages`

Endpoint di catalogo unificato per:

- Skills
- Plugin di codice
- Plugin bundle

Parametri di query:

- `limit` (facoltativo): intero (1–100)
- `cursor` (facoltativo): cursore di paginazione
- `family` (facoltativo): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (facoltativo): `official`, `community` o `private`
- `isOfficial` (facoltativo): `true` o `false`
- `sort` (facoltativo): `updated` (predefinito), `recommended`, `trending`, `downloads`, alias legacy `installs`
- `category` (facoltativo): filtro categoria Plugin. Supportato solo quando la
  richiesta è limitata ai pacchetti Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` o endpoint dei pacchetti con
  `family=code-plugin`/`family=bundle-plugin`). Le categorie controllate e gli
  alias di filtro legacy v1 sono documentati in `GET /api/v1/plugins`.

Note:

- Valori non validi per `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` o `sort` restituiscono `400`. I parametri di query sconosciuti vengono ignorati.
- `GET /api/v1/code-plugins` e `GET /api/v1/bundle-plugins` restano alias a famiglia fissa.
- Le voci Skills continuano a essere supportate dal registro Skills e possono ancora essere pubblicate solo tramite `POST /api/v1/skills`.
- `POST /api/v1/packages` è ancora solo per rilasci `code-plugin` e `bundle-plugin`.
- I chiamanti anonimi vedono solo i canali di pacchetti pubblici.
- I chiamanti autenticati possono vedere nei risultati di elenco/ricerca i pacchetti privati dei publisher a cui appartengono.
- `channel=private` restituisce solo i pacchetti che il chiamante autenticato può leggere.

### `GET /api/v1/packages/search`

Ricerca nel catalogo unificato tra Skills e pacchetti Plugin.

Parametri di query:

- `q` (obbligatorio): stringa di query
- `limit` (facoltativo): intero (1–100)
- `family` (facoltativo): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (facoltativo): `official`, `community` o `private`
- `isOfficial` (facoltativo): `true` o `false`
- `category` (facoltativo): filtro categoria Plugin. Supportato solo quando la
  richiesta è limitata ai pacchetti Plugin. Le categorie controllate e gli alias
  di filtro legacy v1 sono documentati in `GET /api/v1/plugins`.

Note:

- Valori non validi per `family`, `channel`, `isOfficial`, `featured` o
  `highlightedOnly` restituiscono `400`. I parametri di query sconosciuti vengono ignorati.
- I chiamanti anonimi vedono solo i canali di pacchetti pubblici.
- I chiamanti autenticati possono cercare i pacchetti privati dei publisher a cui appartengono.
- `channel=private` restituisce solo i pacchetti che il chiamante autenticato può leggere.

### `GET /api/v1/plugins`

Esplorazione del catalogo solo Plugin tra pacchetti `code-plugin` e `bundle-plugin`.

Parametri di query:

- `limit` (facoltativo): intero (1-100)
- `cursor` (facoltativo): cursore di paginazione
- `isOfficial` (facoltativo): `true` o `false`
- `sort` (facoltativo): `recommended` (predefinito), `trending`, `downloads`, `updated`, alias legacy `installs`
- `category` (facoltativo): filtro categoria Plugin. Valori correnti:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Gli alias di filtro legacy v1 restano accettati sugli endpoint di lettura:

- `mcp-tooling`, `data` e `automation` si risolvono in `tools`.
- `observability` e `deployment` si risolvono in `gateway`.
- `dev-tools` si risolve in `runtime`.

`trending` è una classifica di installazioni/download su sette giorni e non usa i totali storici.
Nell'endpoint unificato `/api/v1/packages` è solo per Plugin; usa
`/api/v1/skills?sort=trending` per il catalogo Skills.

Gli alias legacy non sono accettati come valori di categoria memorizzati o dichiarati dall'autore.

### `GET /api/v1/skills/export`

Esportazione in blocco delle Skills pubbliche più recenti per l'analisi offline.

Autenticazione:

- Token API obbligatorio.

Parametri di query:

- `startDate` (obbligatorio): limite inferiore in millisecondi Unix per `updatedAt` della Skill.
- `endDate` (obbligatorio): limite superiore in millisecondi Unix per `updatedAt` della Skill.
- `limit` (facoltativo): intero (1-250), valore predefinito `250`.
- `cursor` (facoltativo): cursore di paginazione dalla risposta precedente.

Risposta:

- Corpo: archivio ZIP.
- Ogni Skill esportata ha radice in `{publisher}/{slug}/`.
- Le Skills ospitate includono i file dell'ultima versione memorizzata e sono elencate in
  `_manifest.json` con `sourceRef: "public-clawhub"`.
- Le Skills correnti basate su GitHub con una scansione `clean` o `suspicious` includono
  `_source_handoff.json` con `sourceRef: "public-github"`, repo, commit, percorso,
  hash del contenuto e URL dell'archivio. Non includono file sorgente ospitati su ClawHub.
- Ogni Skill include `_export_skill_meta.json`.
- `_manifest.json` è sempre incluso nella radice dello ZIP.
- `_errors.json` è incluso quando singole Skills o file non hanno potuto essere
  esportati.

Intestazioni:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Esportazione in blocco delle ultime release pubbliche dei Plugin per l'analisi offline.

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
- Ogni Plugin esportato include i file archiviati dell'ultima release.
- I metadati di esportazione per Plugin sono archiviati in
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` è sempre incluso nella radice dello ZIP.
- `_errors.json` è incluso quando singoli Plugin o file non hanno potuto essere
  esportati.

Intestazioni:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Ricerca solo per Plugin nei pacchetti code-plugin e bundle-plugin.

Parametri di query:

- `q` (obbligatorio): stringa di query
- `limit` (facoltativo): intero (1-100)
- `isOfficial` (facoltativo): `true` o `false`
- `category` (facoltativo): filtro per categoria di Plugin. Valori attuali:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Note:

- Sono accettati anche gli alias dei filtri v1 legacy documentati in `GET /api/v1/plugins`.
- Il filtro per categoria è un vero filtro API basato sulle righe del digest
  delle categorie dei Plugin, non una riscrittura della query di ricerca.
- I risultati sono restituiti in ordine di rilevanza e attualmente non usano la paginazione.
- I controlli di ordinamento dell'interfaccia browser per la ricerca dei Plugin riordinano i risultati di rilevanza caricati,
  corrispondendo al comportamento di navigazione attuale di `/skills`.

### `GET /api/v1/packages/{name}`

Restituisce i metadati di dettaglio del pacchetto.

Note:

- Anche gli Skills possono essere risolti tramite questa route nel catalogo unificato.
- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.

### `DELETE /api/v1/packages/{name}`

Elimina in modo reversibile un pacchetto e tutte le release.

Note:

- Richiede un token API per il proprietario del pacchetto, un proprietario/admin del publisher dell'organizzazione,
  un moderatore della piattaforma o un admin della piattaforma.

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

- `version.artifact.kind` è `legacy-zip` per gli archivi pacchetto del vecchio mondo oppure
  `npm-pack` per le release basate su ClawPack.
- Le release ClawPack includono i campi compatibili con npm `npmIntegrity`, `npmShasum` e
  `npmTarballName`.
- `version.sha256hash` è un metadato di compatibilità deprecato per i client vecchi. Esegue l'hash
  dei byte ZIP esatti restituiti da `/api/v1/packages/{name}/download`.
  I client moderni devono usare `version.artifact.sha256`, che identifica
  l'artefatto di release canonico.
- `version.vtAnalysis`, `version.llmAnalysis` e `version.staticScan` sono
  inclusi quando esistono dati di scansione.
- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Restituisce il riepilogo esatto di sicurezza e attendibilità della release del pacchetto per i client
di installazione. Questa è la superficie pubblica di consumo OpenClaw per decidere se una
release risolta può essere installata.

Autenticazione:

- Endpoint di lettura pubblico. Non è richiesto alcun token di proprietario, publisher, moderatore o admin.

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
- `trust.scanStatus` è lo stato di attendibilità effettivo derivato dagli input dello scanner
  e dalla moderazione manuale della release.
- `trust.moderationState` è nullable. È `null` quando non esiste alcuna moderazione manuale
  della release.
- `trust.blockedFromDownload` è il segnale di blocco dell'installazione. OpenClaw e altri
  client di installazione devono bloccare l'installazione quando questo valore è `true` invece di
  ricalcolare le regole di blocco dai campi di scanner o moderazione.
- `trust.reasons` è l'elenco di spiegazioni rivolte all'utente e di audit. I codici motivo
  sono stringhe stabili e compatte come `manual:quarantined`, `scan:malicious`
  e `package:malicious`.
- `trust.pending` significa che uno o più input di attendibilità sono ancora in attesa di completamento.
- `trust.stale` significa che il riepilogo di attendibilità è stato calcolato da input obsoleti e
  deve essere trattato come bisognoso di aggiornamento prima di una decisione di autorizzazione ad alta confidenza.

Note:

- Questo endpoint è esatto per versione. I client devono chiamarlo dopo aver risolto la
  versione del pacchetto che intendono installare, non solo dopo aver letto gli ultimi
  metadati del pacchetto.
- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.
- Questo endpoint è intenzionalmente più ristretto degli endpoint di moderazione per proprietari/moderatori.
  Espone la decisione di installazione e la spiegazione pubblica, non
  identità dei segnalatori, corpi delle segnalazioni, prove private o timeline di revisione
  interne.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Restituisce i metadati espliciti del resolver dell'artefatto per una versione del pacchetto.

Note:

- Le versioni pacchetto legacy restituiscono un artefatto `legacy-zip` e un
  `downloadUrl` ZIP legacy.
- Le versioni ClawPack restituiscono un artefatto `npm-pack`, campi di integrità npm, un
  `tarballUrl` e l'URL di compatibilità ZIP legacy.
- Questa è la superficie resolver OpenClaw; evita di dedurre il formato dell'archivio da
  un URL condiviso.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Scarica l'artefatto della versione tramite il percorso esplicito del resolver.

Note:

- Le versioni ClawPack trasmettono in streaming i byte esatti `.tgz` npm-pack caricati.
- Le versioni ZIP legacy reindirizzano a `/api/v1/packages/{name}/download?version=`.
- Usa il bucket di frequenza dei download.

### `GET /api/v1/packages/{name}/readiness`

Restituisce la prontezza calcolata per il consumo futuro da parte di OpenClaw.

I controlli di prontezza coprono:

- stato del canale ufficiale
- disponibilità dell'ultima versione
- disponibilità dell'artefatto npm-pack ClawPack
- digest dell'artefatto
- provenienza del repo sorgente e del commit
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

Endpoint per moderatori per elencare le righe di migrazione dei Plugin OpenClaw ufficiali.

Autenticazione:

- Richiede un token API per un utente moderatore o admin.

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

Endpoint admin per creare o aggiornare una riga di migrazione di un Plugin ufficiale.

Autenticazione:

- Richiede un token API per un utente admin.

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

- `bundledPluginId` è normalizzato in minuscolo ed è la chiave di upsert stabile.
- `packageName` è normalizzato come nome npm; il pacchetto può essere assente per le migrazioni
  pianificate.
- Tiene traccia solo della prontezza della migrazione. Non modifica OpenClaw né genera
  ClawPack.

### `GET /api/v1/packages/moderation/queue`

Endpoint moderatore/admin per le code di revisione delle release dei pacchetti.

Autenticazione:

- Richiede un token API per un utente moderatore o admin.

Parametri di query:

- `status` (facoltativo): `open` (predefinito), `blocked`, `manual` o `all`
- `limit` (facoltativo): intero (1-100)
- `cursor` (facoltativo): cursore di paginazione

Significati degli stati:

- `open`: release sospette, malevole, in sospeso, in quarantena, revocate o segnalate.
- `blocked`: release in quarantena, revocate o malevole.
- `manual`: qualsiasi release con override di moderazione manuale.
- `all`: qualsiasi release con override manuale, stato di scansione non pulito o segnalazione del pacchetto.

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

Segnala un pacchetto per la revisione da parte dei moderatori. Le segnalazioni sono a livello di pacchetto, facoltativamente
collegate a una versione. Alimentano la coda di moderazione ma non nascondono automaticamente né
bloccano i download da sole; i moderatori devono usare la moderazione delle release per
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

Endpoint moderatore/amministratore per l'acquisizione dei report sui pacchetti.

Autenticazione:

- Richiede un token API per un utente moderatore o amministratore.

Parametri query:

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

Endpoint proprietario/moderatore per la visibilità della moderazione dei pacchetti.

Autenticazione:

- Richiede un token API per il proprietario del pacchetto, un membro publisher, un moderatore o
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

Endpoint moderatore/amministratore per risolvere o riaprire i report sui pacchetti.

Richiesta:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` è obbligatorio per `confirmed` e `dismissed`; può essere omesso quando si
reimposta `status` su `open`. Passa `finalAction: "quarantine"` o
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

Endpoint moderatore/amministratore per la revisione della release del pacchetto.

Richiesta:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Stati supportati:

- `approved`: revisionata manualmente e consentita.
- `quarantined`: bloccata in attesa di follow-up.
- `revoked`: bloccata dopo che una release era stata considerata attendibile in precedenza.

Le release in quarantena e revocate restituiscono `403` dalle route di download degli artefatti.
Ogni modifica scrive una voce nel registro di audit.

### `GET /api/v1/packages/{name}/file`

Restituisce il contenuto di testo non elaborato per un file del pacchetto.

Parametri query:

- `path` (obbligatorio)
- `version` (facoltativo)
- `tag` (facoltativo)

Note:

- Usa per impostazione predefinita la release più recente.
- Usa il bucket di limite di lettura, non il bucket di download.
- I file binari restituiscono `415`.
- Limite di dimensione del file: 200KB.
- Le scansioni VirusTotal in sospeso non bloccano le letture; le release dannose possono comunque essere trattenute altrove.
- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.

### `GET /api/v1/packages/{name}/download`

Scarica l'archivio ZIP deterministico legacy per una release del pacchetto.

Parametri query:

- `version` (facoltativo)
- `tag` (facoltativo)

Note:

- Usa per impostazione predefinita la release più recente.
- Skills reindirizza a `GET /api/v1/download`.
- Gli archivi Plugin/pacchetto sono file zip con una radice `package/`, così i vecchi client OpenClaw
  continuano a funzionare.
- Questa route rimane solo ZIP. Non trasmette in streaming file ClawPack `.tgz`.
- Le risposte includono gli header `ETag`, `Digest`, `X-ClawHub-Artifact-Type` e
  `X-ClawHub-Artifact-Sha256` per i controlli di integrità del resolver.
- I metadati solo del registro non vengono iniettati nell'archivio scaricato.
- Le scansioni VirusTotal in sospeso non bloccano i download; le release dannose restituiscono `403`.
- I pacchetti privati restituiscono `404` a meno che il chiamante sia il proprietario.

### `GET /api/npm/{package}`

Restituisce un packument compatibile con npm per le versioni dei pacchetti basate su ClawPack.

Note:

- Sono elencate solo le versioni con tarball npm-pack ClawPack caricati.
- Le versioni legacy solo ZIP sono omesse intenzionalmente.
- `dist.tarball`, `dist.integrity` e `dist.shasum` usano campi compatibili con npm
  così gli utenti possono puntare npm al mirror se lo desiderano.
- I packument dei pacchetti con scope supportano sia `/api/npm/@scope/name` sia il percorso di richiesta
  codificato di npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Trasmette in streaming i byte esatti del tarball ClawPack caricato per i client mirror npm.

Note:

- Usa il bucket di limite di download.
- Gli header di download includono lo SHA-256 ClawHub più i metadati npm integrity/shasum.
- I controlli di moderazione e accesso ai pacchetti privati continuano ad applicarsi.

### `GET /api/v1/resolve`

Usato dalla CLI per mappare un'impronta locale a una versione nota.

Parametri query:

- `slug` (obbligatorio)
- `hash` (obbligatorio): sha256 esadecimale di 64 caratteri dell'impronta del bundle

Risposta:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Scarica uno ZIP di versione Skills ospitata o restituisce un passaggio alla sorgente GitHub per una
Skills corrente basata su GitHub con una scansione `clean` o `suspicious` e nessuna versione
ospitata.

Parametri query:

- `slug` (obbligatorio)
- `version` (facoltativo): stringa semver
- `tag` (facoltativo): nome tag (ad es. `latest`)

Note:

- Se non viene fornito né `version` né `tag`, viene usata la versione più recente.
- Le versioni eliminate temporaneamente restituiscono `410`.
- I passaggi alle Skills basate su GitHub non fanno proxy né mirror dei byte. La risposta JSON
  include `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  e `archiveUrl`; lo stato di scansione/corrente è un gate e non è incluso come metadato
  di payload di successo.
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
- È accettato anche il corpo JSON con `files` (basati su storageId).
- Campo payload facoltativo: `ownerHandle`. Quando presente, l'API risolve quel
  publisher lato server e richiede che l'attore disponga dell'accesso al publisher.
- Campo payload facoltativo: `migrateOwner`. Quando `true` con `ownerHandle`, una
  Skills esistente può passare a quel proprietario se l'attore è amministratore/proprietario su entrambi
  i publisher corrente e di destinazione. Senza questa adesione esplicita, le modifiche di proprietario vengono
  rifiutate.

### `POST /api/v1/packages`

Pubblica una release code-plugin o bundle-plugin.

- Richiede autenticazione con token Bearer.
- Richiede `multipart/form-data`.
- I campi modulo consentiti sono `payload`, blob `files` ripetuti o un riferimento tarball `clawpack`.
  `clawpack` può essere un blob `.tgz` o un id di archiviazione restituito dal
  flusso upload-url. Le pubblicazioni con storage-id preparato devono includere anche il
  `clawpackUploadTicket` restituito con quell'URL di caricamento.
- Usa `files` o `clawpack`, mai entrambi nella stessa richiesta.
- I corpi JSON e i metadati `payload.files` / `payload.artifact` forniti dal chiamante
  sono rifiutati.
- Le richieste di pubblicazione multipart dirette hanno un limite di 18MB. I tarball ClawPack possono
  usare il flusso upload-url fino al limite di 120MB per tarball.
- Campo payload facoltativo: `ownerHandle`. Quando presente, solo gli amministratori possono pubblicare per conto di quel proprietario.

Punti salienti della convalida:

- `family` deve essere `code-plugin` o `bundle-plugin`.
- I pacchetti Plugin richiedono `openclaw.plugin.json`. I caricamenti `.tgz` ClawPack devono
  contenerlo in `package/openclaw.plugin.json`.
- I code plugin richiedono `package.json`, metadati del repository sorgente, metadati del commit sorgente,
  metadati dello schema di configurazione, `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` e `openclaw.environment` sono metadati facoltativi.
- Solo il publisher dell'organizzazione `openclaw` e i publisher personali degli attuali membri dell'organizzazione `openclaw`
  possono pubblicare nel canale `official`.
- Le pubblicazioni per conto di terzi convalidano comunque l'idoneità al canale ufficiale rispetto all'account proprietario di destinazione.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Elimina temporaneamente / ripristina una Skills (proprietario, moderatore o amministratore).

Corpo JSON facoltativo:

```json
{ "reason": "Held for moderation pending legal review." }
```

Quando presente, `reason` viene memorizzato come nota di moderazione della Skills e copiato nel registro di audit.
Le eliminazioni temporanee avviate dal proprietario riservano lo slug per 30 giorni, poi lo slug può essere reclamato da
un altro publisher. La risposta di eliminazione include `slugReservedUntil` quando si applica questa scadenza.
Le rimozioni di sicurezza e gli occultamenti da parte di moderatore/amministratore non scadono in questo modo.

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

Solo amministratori. Garantisce che esista un publisher dell'organizzazione per un handle. Se l'handle punta ancora a un
publisher utente/personale condiviso legacy, l'endpoint lo migra prima in un publisher dell'organizzazione.
Per un'organizzazione appena creata, fornisci `memberHandle`; l'amministratore agente non viene aggiunto come membro.
`memberRole` è predefinito a `owner`.

- Corpo: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Risposta: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Creazione self-service autenticata di publisher dell'organizzazione. Crea un nuovo publisher dell'organizzazione e aggiunge il
chiamante come proprietario. Questo endpoint non migra handle utente/personali esistenti e
non contrassegna il publisher come attendibile/ufficiale.

- Corpo: `{ "handle": "opik", "displayName": "Opik" }`
- Risposta: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Restituisce `409` quando l'handle è già usato da un publisher, utente o publisher personale.

### `POST /api/v1/users/reserve`

Solo amministratori. Riserva slug radice e nomi di pacchetto per un proprietario legittimo senza pubblicare una
release. I nomi dei pacchetti diventano pacchetti placeholder privati senza righe di release, così lo stesso
proprietario può in seguito pubblicare la vera release code-plugin o bundle-plugin con quel nome.

- Corpo: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Risposta: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Solo amministratori. Recupera un publisher personale per un principale GitHub OAuth sostitutivo verificato
senza modificare le righe dell'account Convex Auth. La richiesta deve indicare entrambi gli ID account immutabili
del provider GitHub; gli handle mutabili sono usati solo come protezione visibile all'operatore.

L'endpoint usa per impostazione predefinita la modalità dry-run. L'applicazione del ripristino richiede `dryRun: false` e
`confirmIdentityVerified: true` dopo che lo staff ha verificato in modo indipendente la continuità tra entrambi
i principali GitHub. Il ripristino fallisce in modalità fail-closed quando il publisher personale corrente dell'utente di destinazione
ha skills, pacchetti o sorgenti skill GitHub.
Il ripristino migra anche i campi legacy `ownerUserId` per le skills del publisher ripristinato,
gli alias degli slug delle skill, i pacchetti, gli avvisi dell'ispettore dei pacchetti e le righe derivate del digest di ricerca, così che
i percorsi con proprietario diretto siano coerenti con la nuova autorità del publisher. Anche una prenotazione attiva di handle protetto
per l'handle ripristinato viene riassegnata all'utente sostitutivo, così che una successiva
sincronizzazione del profilo non possa ripristinare l'autorità concorrente dell'utente precedente. Ogni tabella primaria è limitata a
100 righe per transazione di applicazione; i ripristini più grandi devono prima usare una migrazione proprietario riprendibile.
Le sorgenti skill GitHub sono nello scope del publisher e vengono segnalate come controllate anziché riscritte.

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
  - Risposta (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Forma della risposta: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Banna un utente ed elimina definitivamente le skills di sua proprietà (solo moderatore/admin).

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

Rimuove il ban da un utente e ripristina le skills idonee (solo admin).

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
contenuti (solo admin). Usa per impostazione predefinita la modalità dry-run a meno che `dryRun` sia `false`.

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

- `q` (facoltativo): query di ricerca
- `query` (facoltativo): alias per `q`
- `limit` (facoltativo): risultati massimi (predefinito 20, massimo 200)

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

Aggiunge/rimuove una stella (evidenziazioni). Entrambi gli endpoint sono idempotenti.

Risposte:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Endpoint CLI legacy (deprecati)

Ancora supportati per le versioni CLI meno recenti:

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

## Rilevamento del registry (`/.well-known/clawhub.json`)

La CLI può rilevare le impostazioni di registry/autenticazione dal sito:

- `/.well-known/clawhub.json` (JSON, preferito)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Se fai self-hosting, servi questo file (oppure imposta esplicitamente `CLAWHUB_REGISTRY`; legacy `CLAWDHUB_REGISTRY`).
