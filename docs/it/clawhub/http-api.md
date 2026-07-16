---
read_when:
    - Aggiunta/modifica degli endpoint
    - Debug delle richieste CLI ↔ registro
summary: Riferimento API HTTP (endpoint pubblici + CLI + autenticazione).
x-i18n:
    generated_at: "2026-07-16T14:07:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL di base: `https://clawhub.ai` (valore predefinito).

Tutti i percorsi v1 si trovano sotto `/api/v1/...`.
I percorsi legacy `/api/...` e `/api/cli/...` restano disponibili per compatibilità (vedere `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Riutilizzo del catalogo pubblico

Le directory di terze parti possono utilizzare gli endpoint pubblici di lettura per elencare o cercare le skill di ClawHub. Memorizzare i risultati nella cache, rispettare `429`/`Retry-After`, rimandare gli utenti alla voce canonica di ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) ed evitare di lasciar intendere che ClawHub approvi il sito di terze parti. Non tentare di replicare contenuti nascosti, privati o bloccati dalla moderazione al di fuori della superficie dell'API pubblica.

Le scorciatoie degli slug Web vengono risolte tra le diverse famiglie del registro, ma i client API devono utilizzare
gli URL canonici restituiti dagli endpoint di lettura invece di ricostruire la precedenza
dei percorsi.

## Limiti di frequenza

Modello di applicazione:

- Richieste anonime: applicazione per IP.
- Richieste autenticate (token Bearer valido): applicazione per bucket utente.
- Se il token è assente o non valido, si applica nuovamente il controllo per IP.
- Gli endpoint di scrittura autenticati non devono restituire un semplice `Unauthorized` quando
  il server conosce il motivo. Token assenti, token non validi/revocati e
  account eliminati/bannati/disabilitati devono ricevere ciascuno un testo utilizzabile, affinché i client
  CLI possano indicare agli utenti che cosa li ha bloccati.

- Lettura: 3000/min per IP, 12000/min per chiave
- Scrittura: 300/min per IP, 3000/min per chiave
- Download: 1200/min per IP, 6000/min per chiave (endpoint di download)

Intestazioni:

- Compatibilità legacy: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Standardizzate: `RateLimit-Limit`, `RateLimit-Reset`
- In caso di `429`: `X-RateLimit-Remaining: 0` e `RateLimit-Remaining: 0`
- In caso di `429`: `Retry-After`

Semantica delle intestazioni:

- `X-RateLimit-Reset`: secondi assoluti dall'epoca Unix
- `RateLimit-Reset`: secondi fino al ripristino (ritardo)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: budget rimanente esatto, se presente.
  Le richieste con esito positivo distribuite tra shard omettono questa intestazione anziché restituire un valore globale approssimativo.
- `Retry-After`: secondi da attendere prima di riprovare (ritardo) in caso di `429`

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

Limite di frequenza superato
```

Indicazioni per i client:

- Se `Retry-After` è presente, attendere il numero di secondi indicato prima di riprovare.
- Utilizzare un backoff con jitter per evitare tentativi sincronizzati.
- Se `Retry-After` è assente, ricorrere a `RateLimit-Reset` (oppure calcolarlo da `X-RateLimit-Reset`).

Origine dell'IP:

- Utilizza le intestazioni attendibili dell'IP client, tra cui `cf-connecting-ip`, solo quando la
  distribuzione abilita esplicitamente le intestazioni inoltrate attendibili.
- ClawHub utilizza le intestazioni di inoltro attendibili per identificare gli IP dei client all'edge.
- Se non è disponibile alcun IP client attendibile, le richieste anonime utilizzano bucket di fallback
  il cui ambito è definito esclusivamente dal tipo di limite di frequenza. Questi bucket di fallback non includono
  percorsi, slug, nomi di pacchetti, versioni, stringhe di query o altri
  parametri degli artefatti forniti dal chiamante.

## Risposte di errore

Le risposte di errore pubbliche v1 sono in testo normale con `content-type: text/plain; charset=utf-8`.
Sono inclusi gli errori di convalida (`400`), le risorse pubbliche mancanti (`404`), gli errori di autenticazione e
autorizzazione (`401`/`403`), i limiti di frequenza (`429`) e i download bloccati. I client
devono leggere il corpo della risposta come stringa leggibile. I parametri di query sconosciuti vengono
ignorati per compatibilità, mentre i parametri di query riconosciuti con valori non validi restituiscono
`400`.

## Endpoint pubblici (senza autenticazione)

### `GET /api/v1/search`

Parametri di query:

- `q` (obbligatorio): stringa di query
- `limit` (facoltativo): numero intero
- `highlightedOnly` (facoltativo): `true` per filtrare le skill in evidenza
- `nonSuspiciousOnly` (facoltativo): `true` per nascondere le skill sospette (`flagged.suspicious`)
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

- I risultati vengono restituiti in ordine di pertinenza (somiglianza degli embedding + incrementi per corrispondenze esatte dei token di slug/nome + una piccola priorità basata sulla popolarità).
- La pertinenza ha un peso maggiore della popolarità. Una corrispondenza precisa con un token dello slug o del nome visualizzato può superare una corrispondenza meno precisa con un coinvolgimento molto maggiore.
- Il testo ASCII viene suddiviso in token in corrispondenza dei limiti di parole e punteggiatura. Ad esempio, `personal-map` contiene un token `map` autonomo, mentre `amap-jsapi-skill` contiene `amap`, `jsapi` e `skill`; cercando `map`, quindi, `personal-map` ottiene una corrispondenza lessicale più forte rispetto a `amap-jsapi-skill`.
- La popolarità viene ridimensionata logaritmicamente e limitata. Le skill con un coinvolgimento elevato possono ottenere un posizionamento inferiore quando il testo della query presenta una corrispondenza più debole.
- Uno stato di moderazione sospetto o nascosto può rimuovere una skill dalla ricerca pubblica, a seconda dei filtri del chiamante e dello stato di moderazione corrente.

Indicazioni sulla reperibilità per gli editori:

- Inserire i termini che gli utenti cercheranno letteralmente nel nome visualizzato, nel riepilogo e nei tag. Utilizzare un token slug autonomo solo quando costituisce anche un'identità stabile che si intende mantenere.
- Non rinominare uno slug solo per inseguire una query, a meno che il nuovo slug non sia un nome canonico migliore a lungo termine. I vecchi slug diventano alias di reindirizzamento, ma l'URL canonico, lo slug visualizzato e i futuri riepiloghi di ricerca utilizzano il nuovo slug.
- Gli alias di ridenominazione mantengono la risoluzione per i vecchi URL e per le installazioni risolte tramite il registro, ma il posizionamento nella ricerca si basa sui metadati canonici della skill dopo l'indicizzazione della ridenominazione. Le statistiche esistenti restano associate alla skill.
- Se una skill risulta inaspettatamente invisibile, verificare prima lo stato di moderazione con `clawhub inspect @owner/slug` dopo aver effettuato l'accesso, prima di modificare i metadati relativi al posizionamento.

### `GET /api/v1/skills`

Parametri di query:

- `limit` (facoltativo): numero intero (1–200)
- `cursor` (facoltativo): cursore di paginazione per qualsiasi ordinamento diverso da `trending`
- `sort` (facoltativo): `updated` (valore predefinito), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), gli alias di installazione legacy `installsCurrent`/`installs`/`installsAllTime` corrispondono a `downloads`, `trending`
- `nonSuspiciousOnly` (facoltativo): `true` per nascondere le skill sospette (`flagged.suspicious`)
- `nonSuspicious` (facoltativo): alias legacy di `nonSuspiciousOnly`

I valori `sort` non validi restituiscono `400`.

Note:

- `recommended` utilizza segnali di coinvolgimento e recenza.
- `trending` ordina in base alle installazioni negli ultimi 7 giorni (basate sulla telemetria).
- `createdAt` è stabile per le scansioni delle nuove skill; `updated` cambia quando le skill esistenti vengono ripubblicate.
- Quando `nonSuspiciousOnly=true`, gli ordinamenti basati su cursore possono restituire meno di `limit` elementi in una pagina perché le skill sospette vengono filtrate dopo il recupero della pagina.
- Utilizzare `nextCursor` per proseguire la paginazione, se presente. Una pagina breve non indica di per sé la fine dei risultati.

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

- I vecchi slug creati dai flussi di ridenominazione/unione del proprietario vengono risolti nella skill canonica.
- `metadata.os`: restrizioni del sistema operativo dichiarate nel frontmatter della skill (ad esempio `["macos"]`, `["linux"]`). `null` se non dichiarate.
- `metadata.systems`: sistemi di destinazione Nix (ad esempio `["aarch64-darwin", "x86_64-linux"]`). `null` se non dichiarati.
- `metadata` è `null` se la skill non contiene metadati della piattaforma.
- `moderation` viene incluso solo quando la skill è contrassegnata o viene visualizzata dal proprietario.

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

- I proprietari e i moderatori possono accedere ai dettagli di moderazione delle skill nascoste.
- I chiamanti pubblici ricevono solo `200` per le skill visibili già contrassegnate.
- Le prove vengono oscurate per i chiamanti pubblici e includono frammenti non elaborati solo per proprietari/moderatori.

### `POST /api/v1/skills/{slug}/report`

Segnala una skill per la revisione da parte dei moderatori. Le segnalazioni riguardano l'intera skill, possono essere facoltativamente collegate
a una versione e alimentano la coda delle segnalazioni delle skill.

Autenticazione:

- Richiede un token API.

Richiesta:

```json
{ "reason": "Passaggio di installazione sospetto", "version": "1.2.3" }
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

Endpoint per moderatori/amministratori destinato alla ricezione delle segnalazioni delle skill.

Parametri di query:

- `status` (facoltativo): `open` (valore predefinito), `confirmed`, `dismissed` o `all`
- `limit` (facoltativo): numero intero (1-200)
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
      "reason": "Passaggio di installazione sospetto",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Segnalatore"
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

Endpoint per moderatori/amministratori per risolvere o riaprire le segnalazioni relative alle skill.

Richiesta:

```json
{ "status": "confirmed", "note": "Esaminata e nascosta la versione interessata.", "finalAction": "hide" }
```

`note` è obbligatorio per `confirmed` e `dismissed`; può essere omesso quando
si reimposta `status` su `open`. Passare `finalAction: "hide"` con una segnalazione
sottoposta a triage per nascondere la skill nello stesso flusso di lavoro verificabile.

### `GET /api/v1/skills/{slug}/versions`

Parametri di query:

- `limit` (facoltativo): numero intero
- `cursor` (facoltativo): cursore di paginazione

### `GET /api/v1/skills/{slug}/versions/{version}`

Restituisce i metadati della versione e l'elenco dei file.

- `version.security` include lo stato normalizzato della verifica della scansione e i dettagli degli scanner
  (VirusTotal + LLM), quando disponibili.

### `GET /api/v1/skills/{slug}/scan`

Restituisce i dettagli della verifica della scansione di sicurezza per una versione della skill.

Parametri di query:

- `version` (facoltativo): stringa della versione specifica.
- `tag` (facoltativo): risolve una versione con tag (ad esempio `latest`).

Note:

- Se non viene fornito né `version` né `tag`, viene utilizzata la versione più recente.
- Include lo stato normalizzato della verifica e i dettagli specifici degli scanner.
- `security.hasScanResult` è `true` solo quando uno scanner ha prodotto un verdetto definitivo (`clean`, `suspicious` o `malicious`).
- `moderation` è un'istantanea corrente della moderazione a livello di skill derivata dalla versione più recente.
- Quando si interroga una versione storica, verificare `moderation.matchesRequestedVersion` e `moderation.sourceVersion` prima di considerare `moderation` e `security` come appartenenti allo stesso contesto di versione.

### `POST /api/v1/skills/-/scan`

Endpoint autenticato per l'invio di nuovi processi ClawScan.

Le scansioni dei caricamenti locali non sono più supportate. Le richieste che utilizzano
`multipart/form-data` o `{ "source": { "kind": "upload" } }` restituiscono `410`.

Le scansioni pubblicate utilizzano JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Note:

- I payload delle richieste di scansione e i report scaricabili scadono dall'archivio delle richieste di scansione al termine del periodo di conservazione.
- Le scansioni pubblicate richiedono l'accesso di gestione del proprietario/editore oppure l'autorità di moderatore/amministratore della piattaforma.
- Le scansioni pubblicate aggiornano i dati solo quando `update: true` e la scansione viene completata correttamente.
- La risposta è `202` con `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- I processi di scansione sono asincroni. Le richieste di scansione manuale hanno priorità rispetto alle normali attività di pubblicazione/recupero, ma il completamento dipende comunque dalla disponibilità dei worker.

### `GET /api/v1/skills/-/scan/{scanId}`

Endpoint autenticato per il polling di una scansione inviata.

- Restituisce lo stato in coda/in esecuzione/completata/non riuscita.
- Restituisce `queue.queuedAhead` e `queue.position` mentre la richiesta è in coda, in modo che i client possano mostrare quante scansioni manuali prioritarie la precedono. Le code molto grandi sono limitate e segnalate con `queuedAheadIsEstimate: true`.
- Quando disponibile, `report` contiene le sezioni `clawscan`, `skillspector`, `staticAnalysis` e `virustotal`.
- I processi di scansione non riusciti restituiscono `status: "failed"` con `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Endpoint autenticato per l'archivio dei report.

- Richiede una scansione completata correttamente; le scansioni non terminali restituiscono `409`.
- Restituisce un file ZIP con `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` e `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Endpoint autenticato per l'archivio dei report memorizzati delle versioni inviate.

- Richiede l'accesso di gestione del proprietario/editore alla skill o al plugin oppure l'autorità di moderatore/amministratore della piattaforma.
- Restituisce i risultati di scansione memorizzati per la versione esatta inviata, incluse le versioni bloccate o nascoste.
- `kind` ha come valore predefinito `skill`; utilizzare `kind=plugin` per le scansioni di plugin/pacchetti.
- Restituisce la stessa struttura ZIP dei download delle richieste di scansione.

### `POST /api/v1/skills/-/scan/batch`

Route batch canonica, riservata agli amministratori, per ripetere le scansioni. Accetta la stessa struttura di payload della route legacy `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Route batch canonica per lo stato, riservata agli amministratori. Accetta `{ "jobIds": ["..."] }` e restituisce gli stessi contatori aggregati della route legacy `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Restituisce l'involucro di verifica della Skill Card utilizzato da `clawhub skill verify`.

Parametri di query:

- `version` (facoltativo): stringa della versione specifica.
- `tag` (facoltativo): risolve una versione con tag (ad esempio `latest`).

Note:

- `ok` è `true` solo quando la versione selezionata dispone di una Skill Card generata, non è bloccata dalla moderazione a causa di malware e la verifica ClawScan non rileva problemi.
- L'identità della skill, l'identità dell'editore e i metadati della versione selezionata sono campi di primo livello dell'involucro (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), in modo che le automazioni della shell possano leggerli senza estrarre gli involucri annidati.
- `security` è il verdetto ClawScan/di sicurezza di primo livello. Le automazioni devono basarsi su `ok`, `decision`, `reasons` e `security.status`.
- `security.signals` contiene elementi di prova di supporto provenienti dagli scanner, come `staticScan`, `virusTotal` e `skillSpector`.
- `security.signals.dependencyRegistry` viene mantenuto per la compatibilità con le risposte v1, ma lo scanner che verifica l'esistenza nel registro delle dipendenze è stato ritirato e questa chiave è sempre `null`.
- `provenance` è `server-resolved-github-import` solo quando ClawHub ha risolto e memorizzato un repository/riferimento/commit/percorso GitHub durante la pubblicazione o l'importazione; altrimenti è `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Restituisce i verdetti di sicurezza compatti correnti per versioni esatte delle skill. Questo
endpoint di raccolta è destinato ai client che conoscono già le versioni installate
delle skill ClawHub da visualizzare, come l'interfaccia di controllo di OpenClaw.

Richiesta:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Note:

- `items` deve contenere 1-100 coppie `{ slug, version }` univoche.
- I risultati sono distinti per elemento; una skill o una versione mancante non causa il fallimento dell'intera risposta.
- La risposta riguarda esclusivamente la sicurezza. Non include i dati della Skill Card, lo stato della scheda generata, gli elenchi dei file degli artefatti o i payload dettagliati degli scanner.
- `security.signals` contiene solo elementi di prova di supporto a livello di stato; utilizzare `/scan` o la pagina di controllo della sicurezza di ClawHub per i dettagli completi degli scanner.
- `security.signals.dependencyRegistry` viene mantenuto per la compatibilità con le risposte v1, ma lo scanner che verifica l'esistenza nel registro delle dipendenze è stato ritirato e questa chiave è sempre `null`.
- L'assenza della Skill Card non influisce su `ok`, `decision` o `reasons` di questo endpoint; quando è necessario il contenuto della scheda, i client devono leggere localmente `skill-card.md` installato.
- Utilizzare `/verify` quando è necessario l'involucro di verifica della Skill Card per una singola skill, `/card` quando è necessario il Markdown della scheda generata e `/scan` quando sono necessari i dati dettagliati degli scanner.

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
      "error": { "code": "version_not_found", "message": "Versione non trovata" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

Restituisce contenuto testuale non elaborato.

Parametri di query:

- `path` (obbligatorio)
- `version` (facoltativo)
- `tag` (facoltativo)

Note:

- Il valore predefinito è la versione più recente.
- Limite delle dimensioni del file: 200KB.

### `GET /api/v1/packages`

Endpoint unificato del catalogo per:

- skill
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
  richiesta è limitata ai pacchetti di plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` o endpoint di pacchetti con
  `family=code-plugin`/`family=bundle-plugin`). Le categorie controllate e
  gli alias legacy dei filtri v1 sono documentati in `GET /api/v1/plugins`.

Note:

- I valori non validi per `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` o `sort` restituiscono `400`. I parametri di query sconosciuti vengono ignorati.
- `GET /api/v1/code-plugins` e `GET /api/v1/bundle-plugins` rimangono alias di famiglie fisse.
- Le voci delle skill continuano a essere supportate dal registro delle skill e possono ancora essere pubblicate solo tramite `POST /api/v1/skills`.
- `POST /api/v1/packages` continua a essere riservato esclusivamente alle release dei plugin di codice e dei plugin bundle.
- I chiamanti anonimi vedono solo i canali pubblici dei pacchetti.
- I chiamanti autenticati possono vedere nei risultati di elenco/ricerca i pacchetti privati degli editori a cui appartengono.
- `channel=private` restituisce solo i pacchetti che il chiamante autenticato può leggere.

### `GET /api/v1/packages/search`

Ricerca unificata nel catalogo di skill e pacchetti di plugin.

Parametri di query:

- `q` (obbligatorio): stringa di query
- `limit` (facoltativo): numero intero (1–100)
- `family` (facoltativo): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (facoltativo): `official`, `community` o `private`
- `isOfficial` (facoltativo): `true` o `false`
- `category` (facoltativo): filtro per categoria di Plugin. Supportato solo quando la
  richiesta è limitata ai pacchetti Plugin. Le categorie controllate e gli alias
  legacy dei filtri v1 sono documentati in `GET /api/v1/plugins`.

Note:

- I valori non validi per `family`, `channel`, `isOfficial`, `featured` o
  `highlightedOnly` restituiscono `400`. I parametri di query sconosciuti vengono ignorati.
- I chiamanti anonimi vedono solo i canali dei pacchetti pubblici.
- I chiamanti autenticati possono cercare i pacchetti privati degli editori a cui appartengono.
- `channel=private` restituisce solo i pacchetti che il chiamante autenticato può leggere.

### `GET /api/v1/plugins`

Esplorazione del catalogo riservata ai Plugin nei pacchetti code-plugin e bundle-plugin.

Parametri di query:

- `limit` (facoltativo): numero intero (1-100)
- `cursor` (facoltativo): cursore di paginazione
- `isOfficial` (facoltativo): `true` o `false`
- `sort` (facoltativo): `recommended` (predefinito), `trending`, `downloads`, `updated`, alias legacy `installs`
- `category` (facoltativo): filtro per categoria di Plugin. Valori correnti:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Gli alias legacy dei filtri v1 continuano a essere accettati negli endpoint di lettura:

- `mcp-tooling`, `data` e `automation` vengono risolti in `tools`.
- `observability` e `deployment` vengono risolti in `gateway`.
- `dev-tools` viene risolto in `runtime`.

`trending` è una classifica di installazioni/download degli ultimi sette giorni e non utilizza i totali complessivi.
Nell'endpoint unificato `/api/v1/packages` è riservato ai Plugin; utilizzare
`/api/v1/skills?sort=trending` per il catalogo delle skill.

Gli alias legacy non sono accettati come valori di categoria archiviati o dichiarati dall'autore.

### `GET /api/v1/skills/export`

Esportazione in blocco delle skill pubbliche più recenti per l'analisi offline.

Autenticazione:

- Token API obbligatorio.

Parametri di query:

- `startDate` (obbligatorio): limite inferiore in millisecondi Unix per `updatedAt` della skill.
- `endDate` (obbligatorio): limite superiore in millisecondi Unix per `updatedAt` della skill.
- `limit` (facoltativo): numero intero (1-250), valore predefinito `250`.
- `cursor` (facoltativo): cursore di paginazione della risposta precedente.

Risposta:

- Corpo: archivio ZIP.
- Ogni skill esportata ha come radice `{publisher}/{slug}/`.
- Le skill ospitate includono i file dell'ultima versione archiviata e sono elencate in
  `_manifest.json` con `sourceRef: "public-clawhub"`.
- Le skill correnti basate su GitHub con una scansione `clean` o `suspicious` includono
  `_source_handoff.json` con `sourceRef: "public-github"`, repository, commit, percorso,
  hash del contenuto e URL dell'archivio. Non includono i file sorgente ospitati da ClawHub.
- Ogni skill include `_export_skill_meta.json`.
- `_manifest.json` è sempre incluso nella radice dello ZIP.
- `_errors.json` è incluso quando non è stato possibile esportare singole skill
  o singoli file.

Intestazioni:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Esportazione in blocco delle versioni pubbliche più recenti dei Plugin per l'analisi offline.

Autenticazione:

- Token API obbligatorio.

Parametri di query:

- `startDate` (obbligatorio): limite inferiore in millisecondi Unix per `updatedAt` del Plugin.
- `endDate` (obbligatorio): limite superiore in millisecondi Unix per `updatedAt` del Plugin.
- `limit` (facoltativo): numero intero (1-250), valore predefinito `250`.
- `cursor` (facoltativo): cursore di paginazione della risposta precedente.
- `family` (facoltativo): `code-plugin` o `bundle-plugin`. Se omesso, indica entrambe
  le famiglie di Plugin.

Risposta:

- Corpo: archivio ZIP.
- Ogni Plugin esportato ha come radice `{family}/{packageName}/`.
- Ogni Plugin esportato include i file archiviati della versione più recente.
- I metadati di esportazione di ciascun Plugin sono archiviati in
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` è sempre incluso nella radice dello ZIP.
- `_errors.json` è incluso quando non è stato possibile esportare singoli Plugin
  o singoli file.

Intestazioni:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Ricerca riservata ai Plugin nei pacchetti code-plugin e bundle-plugin.

Parametri di query:

- `q` (obbligatorio): stringa di query
- `limit` (facoltativo): numero intero (1-100)
- `isOfficial` (facoltativo): `true` o `false`
- `category` (facoltativo): filtro per categoria di Plugin. Valori correnti:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Note:

- Sono accettati anche gli alias legacy dei filtri v1 documentati in `GET /api/v1/plugins`.
- Il filtro per categoria è un vero filtro API basato sulle righe di digest delle
  categorie dei Plugin, non una riscrittura della query di ricerca.
- I risultati vengono restituiti in ordine di pertinenza e al momento non sono impaginati.
- I controlli di ordinamento dell'interfaccia del browser per la ricerca dei Plugin riordinano i risultati
  di pertinenza caricati, in linea con il comportamento corrente di esplorazione di `/skills`.

### `GET /api/v1/packages/{name}`

Restituisce i metadati dettagliati del pacchetto.

Note:

- Nel catalogo unificato, anche le skill possono essere risolte tramite questa route.
- I pacchetti privati restituiscono `404`, a meno che il chiamante non possa leggere i dati dell'editore proprietario.

### `DELETE /api/v1/packages/{name}`

Elimina logicamente un pacchetto e tutte le versioni.

Note:

- Richiede un token API del proprietario del pacchetto, del proprietario/amministratore
  dell'organizzazione editrice, di un moderatore della piattaforma o di un amministratore della piattaforma.

### `GET /api/v1/packages/{name}/versions`

Restituisce la cronologia delle versioni.

Parametri di query:

- `limit` (facoltativo): numero intero (1–100)
- `cursor` (facoltativo): cursore di paginazione

Note:

- I pacchetti privati restituiscono `404`, a meno che il chiamante non possa leggere i dati dell'editore proprietario.

### `GET /api/v1/packages/{name}/versions/{version}`

Restituisce una versione del pacchetto, inclusi i metadati dei file, la compatibilità,
la verifica, i metadati dell'artefatto e i dati di scansione.

Note:

- `version.artifact.kind` è `legacy-zip` per gli archivi di pacchetti precedenti oppure
  `npm-pack` per le versioni basate su ClawPack.
- Le versioni ClawPack includono i campi compatibili con npm `npmIntegrity`, `npmShasum` e
  `npmTarballName`.
- `version.sha256hash` è un metadato di compatibilità deprecato per i client precedenti. Calcola
  l'hash dei byte ZIP esatti restituiti da `/api/v1/packages/{name}/download`.
  I client moderni dovrebbero utilizzare `version.artifact.sha256`, che identifica
  l'artefatto canonico della versione.
- `version.vtAnalysis`, `version.llmAnalysis` e `version.staticScan` sono
  inclusi quando sono disponibili dati di scansione.
- I pacchetti privati restituiscono `404`, a meno che il chiamante non possa leggere i dati dell'editore proprietario.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Restituisce il riepilogo esatto della sicurezza e dell'affidabilità dell'artefatto della versione del pacchetto per i
client di installazione. Questa è la superficie pubblica utilizzata da OpenClaw per decidere se una
versione risolta può essere installata.

Autenticazione:

- Endpoint pubblico di lettura. Non è richiesto alcun token di proprietario, editore,
  moderatore o amministratore.

Risposta:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Plugin di esempio",
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
  versione esatta valutata.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` e `release.npmTarballName` sono presenti quando noti per
  l'artefatto della versione.
- `trust.scanStatus` è lo stato di affidabilità effettivo derivato dagli input dello scanner
  e dalla moderazione manuale della versione.
- `trust.moderationState` può essere nullo. È `null` quando non esiste alcuna
  moderazione manuale della versione.
- `trust.blockedFromDownload` è il segnale di blocco dell'installazione. OpenClaw e gli altri
  client di installazione dovrebbero bloccare l'installazione quando questo valore è `true`, anziché
  ricalcolare le regole di blocco dai campi dello scanner o della moderazione.
- `trust.reasons` è l'elenco di spiegazioni destinato all'utente e alla verifica. I codici motivo
  sono stringhe stabili e compatte, come `manual:quarantined`, `scan:malicious`
  e `package:malicious`.
- `trust.pending` indica che uno o più input di affidabilità sono ancora in attesa di completamento.
- `trust.stale` indica che il riepilogo dell'affidabilità è stato calcolato da input obsoleti e
  dovrebbe essere considerato come da aggiornare prima di una decisione di autorizzazione ad alta affidabilità.

Note:

- Questo endpoint è specifico per la versione. I client dovrebbero chiamarlo dopo aver risolto la
  versione del pacchetto che intendono installare, non semplicemente dopo aver letto i metadati
  più recenti del pacchetto.
- I pacchetti privati restituiscono `404`, a meno che il chiamante non possa leggere i dati dell'editore proprietario.
- Questo endpoint è intenzionalmente più limitato rispetto agli endpoint di moderazione
  per proprietari/moderatori. Espone la decisione di installazione e la spiegazione pubblica, non
  le identità dei segnalanti, il contenuto delle segnalazioni, le prove private o le tempistiche
  interne di revisione.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Restituisce i metadati espliciti del resolver dell'artefatto per una versione del pacchetto.

Note:

- Le versioni legacy dei pacchetti restituiscono un artefatto `legacy-zip` e un
  `downloadUrl` ZIP legacy.
- Le versioni ClawPack restituiscono un artefatto `npm-pack`, i campi di integrità npm, un
  `tarballUrl` e l'URL ZIP legacy per la compatibilità.
- Questa è la superficie del resolver OpenClaw; evita di dedurre il formato dell'archivio da
  un URL condiviso.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Scarica l'artefatto della versione tramite il percorso esplicito del resolver.

Note:

- Le versioni ClawPack trasmettono esattamente i byte `.tgz` del pacchetto npm caricato.
- Le versioni ZIP legacy reindirizzano a `/api/v1/packages/{name}/download?version=`.
- Utilizza il bucket di limitazione della frequenza dei download.

### `GET /api/v1/packages/{name}/readiness`

Restituisce lo stato di preparazione calcolato per il futuro utilizzo da parte di OpenClaw.

I controlli dello stato di preparazione riguardano:

- stato del canale ufficiale
- disponibilità della versione più recente
- disponibilità dell'artefatto npm-pack ClawPack
- digest dell'artefatto
- provenienza del repository sorgente e del commit
- metadati di compatibilità con OpenClaw
- destinazioni host
- stato della scansione

Risposta:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Plugin di esempio",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "Artefatto ClawPack",
      "status": "fail",
      "message": "La versione più recente è disponibile solo come ZIP legacy."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

Endpoint per moderatori che elenca le righe di migrazione dei Plugin OpenClaw ufficiali.

Autenticazione:

- Richiede un token API per un utente moderatore o amministratore.

Parametri di query:

- `phase` (facoltativo): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` oppure
  `all` (predefinito).
- `limit` (facoltativo): numero intero (1-100)
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
      "blockers": ["ClawPack mancante"],
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

Endpoint per amministratori che crea o aggiorna una riga di migrazione di un Plugin ufficiale.

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
  "blockers": ["ClawPack mancante"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "in attesa del caricamento da parte dell'editore"
}
```

Note:

- `bundledPluginId` viene normalizzato in lettere minuscole ed è la chiave stabile per l'upsert.
- `packageName` viene normalizzato come nome npm; il pacchetto può essere assente per le
  migrazioni pianificate.
- Tiene traccia soltanto dello stato di preparazione della migrazione. Non modifica OpenClaw né genera
  ClawPack.

### `GET /api/v1/packages/moderation/queue`

Endpoint per moderatori/amministratori relativo alle code di revisione delle release dei pacchetti.

Autenticazione:

- Richiede un token API per un utente moderatore o amministratore.

Parametri di query:

- `status` (facoltativo): `open` (predefinito), `blocked`, `manual` oppure `all`
- `limit` (facoltativo): numero intero (1-100)
- `cursor` (facoltativo): cursore di paginazione

Significato degli stati:

- `open`: release sospette, dannose, in sospeso, in quarantena, revocate o segnalate.
- `blocked`: release in quarantena, revocate o dannose.
- `manual`: qualsiasi release con una sostituzione manuale della moderazione.
- `all`: qualsiasi release con una sostituzione manuale, uno stato di scansione non pulito o una segnalazione del pacchetto.

Risposta:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Plugin di esempio",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "revisione manuale",
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

Segnala un pacchetto per la revisione da parte dei moderatori. Le segnalazioni riguardano l'intero pacchetto e possono essere
facoltativamente collegate a una versione. Alimentano la coda di moderazione, ma da sole non nascondono automaticamente né
bloccano i download; i moderatori devono utilizzare la moderazione delle release per
approvare, mettere in quarantena o revocare gli artefatti.

Autenticazione:

- Richiede un token API.

Richiesta:

```json
{ "reason": "Binario nativo sospetto", "version": "1.2.3" }
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

Endpoint per moderatori/amministratori per la ricezione delle segnalazioni sui pacchetti.

Autenticazione:

- Richiede un token API per un utente moderatore o amministratore.

Parametri di query:

- `status` (facoltativo): `open` (predefinito), `confirmed`, `dismissed` oppure `all`
- `limit` (facoltativo): numero intero (1-100)
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
      "displayName": "Plugin di esempio",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Binario nativo sospetto",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Segnalatore"
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

Endpoint per proprietari/moderatori relativo alla visibilità della moderazione dei pacchetti.

Autenticazione:

- Richiede un token API per il proprietario del pacchetto, un membro dell'editore, un moderatore o
  un utente amministratore.

Risposta:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Plugin di esempio",
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
    "moderationReason": "revisione manuale",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

Endpoint per moderatori/amministratori che risolve o riapre le segnalazioni sui pacchetti.

Richiesta:

```json
{
  "status": "confirmed",
  "note": "La release interessata è stata esaminata e messa in quarantena.",
  "finalAction": "quarantine"
}
```

`note` è obbligatorio per `confirmed` e `dismissed`; può essere omesso quando
si reimposta `status` su `open`. Passare `finalAction: "quarantine"` o
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

Endpoint per moderatori/amministratori per la revisione delle release dei pacchetti.

Richiesta:

```json
{ "state": "quarantined", "reason": "Payload nativo sospetto." }
```

Stati supportati:

- `approved`: esaminata manualmente e consentita.
- `quarantined`: bloccata in attesa di ulteriori verifiche.
- `revoked`: bloccata dopo che una release era stata precedentemente considerata attendibile.

Le release in quarantena e revocate restituiscono `403` dalle route di download degli artefatti.
Ogni modifica genera una voce nel registro di controllo.

### `GET /api/v1/packages/{name}/file`

Restituisce il contenuto testuale non elaborato di un file del pacchetto.

Parametri di query:

- `path` (obbligatorio)
- `version` (facoltativo)
- `tag` (facoltativo)

Note:

- Per impostazione predefinita utilizza la release più recente.
- Utilizza il bucket di limitazione della frequenza di lettura, non quello dei download.
- I file binari restituiscono `415`.
- Limite delle dimensioni dei file: 200KB.
- Le scansioni VirusTotal in sospeso non bloccano le letture; le release dannose possono comunque essere trattenute altrove.
- I pacchetti privati restituiscono `404`, a meno che il chiamante non possa leggere l'editore proprietario.

### `GET /api/v1/packages/{name}/download`

Scarica l'archivio ZIP deterministico legacy per una release del pacchetto.

Parametri di query:

- `version` (facoltativo)
- `tag` (facoltativo)

Note:

- Per impostazione predefinita utilizza la release più recente.
- Le Skills reindirizzano a `GET /api/v1/download`.
- Gli archivi di Plugin/pacchetti sono file ZIP con una radice `package/`, affinché i vecchi client OpenClaw
  continuino a funzionare.
- Questa route rimane esclusivamente ZIP. Non trasmette file `.tgz` ClawPack.
- Le risposte includono le intestazioni `ETag`, `Digest`, `X-ClawHub-Artifact-Type` e
  `X-ClawHub-Artifact-Sha256` per i controlli di integrità del resolver.
- I metadati esclusivi del registro non vengono inseriti nell'archivio scaricato.
- Le scansioni VirusTotal in sospeso non bloccano i download; le release dannose restituiscono `403`.
- I pacchetti privati restituiscono `404`, a meno che il chiamante non sia il proprietario.

### `GET /api/npm/{package}`

Restituisce un packument compatibile con npm per le versioni dei pacchetti basate su ClawPack.

Note:

- Sono elencate soltanto le versioni con tarball npm-pack ClawPack caricati.
- Le versioni disponibili solo come ZIP legacy vengono intenzionalmente omesse.
- `dist.tarball`, `dist.integrity` e `dist.shasum` utilizzano campi compatibili con npm,
  in modo che gli utenti possano indirizzare npm al mirror, se lo desiderano.
- I packument dei pacchetti con ambito supportano sia `/api/npm/@scope/name` sia il percorso di richiesta
  codificato `/api/npm/@scope%2Fname` di npm.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Trasmette esattamente i byte del tarball ClawPack caricato per i client mirror npm.

Note:

- Utilizza il bucket di limitazione della frequenza dei download.
- Le intestazioni di download includono lo SHA-256 di ClawHub e i metadati npm di integrità/shasum.
- Si applicano comunque i controlli di moderazione e di accesso ai pacchetti privati.

### `GET /api/v1/resolve`

Utilizzato dalla CLI per associare un'impronta digitale locale a una versione nota.

Parametri di query:

- `slug` (obbligatorio)
- `hash` (obbligatorio): sha256 esadecimale di 64 caratteri dell'impronta digitale del bundle

Risposta:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Scarica lo ZIP di una versione ospitata di una skill oppure restituisce un passaggio alla sorgente GitHub per una
skill corrente basata su GitHub con una scansione `clean` o `suspicious` e senza alcuna versione
ospitata.

Parametri di query:

- `slug` (obbligatorio)
- `version` (facoltativo): stringa semver
- `tag` (facoltativo): nome del tag (ad es. `latest`)

Note:

- Se non viene fornito né `version` né `tag`, viene utilizzata la versione più recente.
- Le versioni eliminate logicamente restituiscono `410`.
- I passaggi di consegne delle skill supportate da GitHub non inoltrano né replicano i byte. La risposta JSON
  include `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  e `archiveUrl`; lo stato della scansione/corrente funge da controllo e non è incluso come metadato
  del payload di successo.
- Le statistiche di download vengono conteggiate come identità univoche per giorno UTC (`userId` quando il token API è valido, altrimenti l'IP).

## Endpoint di autenticazione (token Bearer)

Tutti gli endpoint richiedono:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Convalida il token e restituisce l'handle dell'utente.

### `POST /api/v1/skills`

Pubblica una nuova versione.

- Metodo preferito: `multipart/form-data` con JSON `payload` + blob `files[]`.
- È accettato anche un corpo JSON con `files` (basato su storageId).
- Campo facoltativo del payload: `ownerHandle`. Se presente, l'API risolve il publisher
  lato server e richiede che l'attore disponga dell'accesso al publisher.
- Campo facoltativo del payload: `migrateOwner`. Quando `true` con `ownerHandle`, una
  skill esistente può essere trasferita a tale proprietario se l'attore è amministratore/proprietario sia per
  il publisher corrente sia per quello di destinazione. Senza questa adesione esplicita, le modifiche del proprietario
  vengono rifiutate.

### `POST /api/v1/packages`

Pubblica una release di un plugin di codice o di un plugin bundle.

- Richiede l'autenticazione tramite token Bearer.
- Richiede `multipart/form-data`.
- I campi del modulo consentiti sono `payload`, blob `files` ripetuti oppure un singolo riferimento
  a tarball `clawpack`. `clawpack` può essere un blob `.tgz` oppure un ID di archiviazione restituito dal
  flusso dell'URL di caricamento. Le pubblicazioni preparate tramite ID di archiviazione devono includere anche
  `clawpackUploadTicket` restituito con tale URL di caricamento.
- Utilizzare `files` oppure `clawpack`, mai entrambi nella stessa richiesta.
- I corpi JSON e i metadati `payload.files` / `payload.artifact`
  forniti dal chiamante vengono rifiutati.
- Le richieste di pubblicazione multipart dirette sono limitate a 18MB. I tarball ClawPack possono
  utilizzare il flusso dell'URL di caricamento fino al limite di 120MB per i tarball.
- Campo facoltativo del payload: `ownerHandle`. Se presente, solo gli amministratori possono pubblicare per conto di tale proprietario.

Aspetti principali della convalida:

- `family` deve essere `code-plugin` oppure `bundle-plugin`.
- I pacchetti Plugin richiedono `openclaw.plugin.json`. I caricamenti ClawPack `.tgz` devono
  contenerlo in `package/openclaw.plugin.json`.
- I plugin di codice richiedono `package.json`, i metadati del repository sorgente, i metadati del commit
  sorgente, i metadati dello schema di configurazione, `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` e `openclaw.environment` sono metadati facoltativi.
- Solo il publisher dell'organizzazione `openclaw` e i publisher personali degli attuali membri
  dell'organizzazione `openclaw` possono pubblicare nel canale `official`.
- Le pubblicazioni per conto di terzi convalidano comunque l'idoneità al canale ufficiale rispetto all'account del proprietario di destinazione.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Elimina logicamente/ripristina una skill (proprietario, moderatore o amministratore).

Corpo JSON facoltativo:

```json
{ "reason": "Trattenuta per moderazione in attesa di revisione legale." }
```

Se presente, `reason` viene memorizzato come nota di moderazione della skill e copiato nel registro di controllo.
Le eliminazioni logiche avviate dal proprietario riservano lo slug per 30 giorni, dopodiché lo slug può essere rivendicato da
un altro publisher. La risposta di eliminazione include `slugReservedUntil` quando si applica questa scadenza.
Gli occultamenti da parte di moderatori/amministratori e le rimozioni per motivi di sicurezza non scadono in questo modo.

Risposta di eliminazione:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Codici di stato:

- `200`: operazione riuscita
- `401`: non autorizzato
- `403`: vietato
- `404`: skill/utente non trovato
- `500`: errore interno del server

### `POST /api/v1/users/publisher`

Solo per amministratori. Garantisce l'esistenza di un publisher dell'organizzazione per un handle. Se l'handle punta ancora a un
utente condiviso/publisher personale precedente, l'endpoint lo migra prima in un publisher dell'organizzazione.
Per un'organizzazione appena creata, fornire `memberHandle`; l'amministratore che esegue l'operazione non viene aggiunto come membro.
Il valore predefinito di `memberRole` è `owner`.

- Corpo: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Risposta: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Creazione autenticata in modalità self-service di un publisher dell'organizzazione. Crea un nuovo publisher dell'organizzazione e aggiunge il
chiamante come proprietario. Questo endpoint non migra handle utente/personali esistenti e non
contrassegna il publisher come attendibile/ufficiale.

- Corpo: `{ "handle": "opik", "displayName": "Opik" }`
- Risposta: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Restituisce `409` quando l'handle è già utilizzato da un publisher, un utente o un publisher personale.

### `POST /api/v1/users/reserve`

Solo per amministratori. Riserva slug radice e nomi di pacchetti al legittimo proprietario senza pubblicare una
release. I nomi dei pacchetti diventano pacchetti segnaposto privati senza righe di release, così lo stesso
proprietario può successivamente pubblicare la vera release del plugin di codice o del plugin bundle con quel nome.

- Corpo: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Risposta: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Solo per amministratori. Recupera un publisher personale per un'entità GitHub OAuth sostitutiva verificata
senza modificare le righe degli account Convex Auth. La richiesta deve specificare entrambi gli ID account immutabili
del provider GitHub; gli handle modificabili vengono utilizzati solo come controllo per l'operatore.

Per impostazione predefinita, l'endpoint esegue una simulazione. L'applicazione del recupero richiede `dryRun: false` e
`confirmIdentityVerified: true` dopo che il personale ha verificato in modo indipendente la continuità tra entrambe
le entità GitHub. Il recupero non viene eseguito se il publisher personale corrente dell'utente di destinazione
dispone di skill, pacchetti o sorgenti di skill GitHub.
Il recupero migra anche i campi `ownerUserId` precedenti per le skill del publisher recuperato,
gli alias degli slug delle skill, i pacchetti, gli avvisi dell'ispettore dei pacchetti e le righe derivate dei digest di ricerca, in modo che
i percorsi del proprietario diretto concordino con l'autorità del nuovo publisher. Una prenotazione attiva dell'handle protetto
per l'handle recuperato viene inoltre riassegnata all'utente sostitutivo, affinché la successiva
sincronizzazione del profilo non possa ripristinare l'autorità concorrente dell'utente precedente. Ogni tabella primaria è limitata a
100 righe per transazione di applicazione; per recuperi più grandi occorre prima utilizzare una migrazione del proprietario ripristinabile.
Le sorgenti delle skill GitHub hanno ambito a livello di publisher e vengono segnalate come controllate anziché riscritte.

- Corpo: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Risposta: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Endpoint per la gestione degli slug del proprietario

- `POST /api/v1/skills/{slug}/rename`
  - Corpo: `{ "newSlug": "new-canonical-slug" }`
  - Risposta: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Corpo: `{ "targetSlug": "canonical-target-slug" }`
  - Risposta: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Note:

- Entrambi gli endpoint richiedono l'autenticazione tramite token API e funzionano solo per il proprietario della skill.
- `rename` conserva lo slug precedente come alias di reindirizzamento.
- `merge` nasconde la voce sorgente e reindirizza lo slug sorgente alla voce di destinazione.

### Endpoint per il trasferimento della proprietà

- `POST /api/v1/skills/{slug}/transfer`
  - Corpo: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Risposta: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Risposta (accettazione/rifiuto/annullamento): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Struttura della risposta: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Blocca un utente ed elimina definitivamente le skill di sua proprietà (solo moderatori/amministratori).

Corpo:

```json
{ "handle": "user_handle", "reason": "motivo facoltativo del blocco" }
```

oppure

```json
{ "userId": "users_...", "reason": "motivo facoltativo del blocco" }
```

Risposta:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Sblocca un utente e ripristina le skill idonee (solo amministratori).

Corpo:

```json
{ "handle": "user_handle", "reason": "motivo facoltativo dello sblocco" }
```

oppure

```json
{ "userId": "users_...", "reason": "motivo facoltativo dello sblocco" }
```

Risposta:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Modifica il motivo memorizzato per un blocco esistente senza sbloccare l'utente né ripristinare
i contenuti (solo amministratori). Per impostazione predefinita esegue una simulazione, a meno che `dryRun` non sia `false`.

Corpo:

```json
{ "handle": "user_handle", "reason": "spam di pubblicazione in massa", "dryRun": true }
```

oppure

```json
{ "userId": "users_...", "reason": "spam di pubblicazione in massa", "dryRun": false }
```

Risposta:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "blocco automatico per malware",
  "nextReason": "spam di pubblicazione in massa",
  "changed": true
}
```

### `POST /api/v1/users/role`

Modifica il ruolo di un utente (solo amministratori).

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

Elenca o cerca gli utenti (solo amministratori).

Parametri di query:

- `q` (facoltativo): query di ricerca
- `query` (facoltativo): alias di `q`
- `limit` (facoltativo): numero massimo di risultati (valore predefinito 20, massimo 200)

Risposta:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "Utente",
      "name": "Utente",
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

## Endpoint CLI precedenti (deprecati)

Ancora supportati per le versioni precedenti della CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Consultare `DEPRECATIONS.md` per il piano di rimozione.

`POST /api/cli/upload-url` restituisce `uploadUrl` e `uploadTicket`. Le pubblicazioni di pacchetti
che preparano un tarball ClawPack devono inviare l'ID di archiviazione risultante come
`clawpack` e il ticket restituito come `clawpackUploadTicket`.

## Rilevamento del registro (`/.well-known/clawhub.json`)

La CLI può rilevare le impostazioni del registro e di autenticazione dal sito:

- `/.well-known/clawhub.json` (JSON, preferito)
- `/.well-known/clawdhub.json` (precedente)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

In caso di hosting autonomo, distribuire questo file (oppure impostare esplicitamente `CLAWHUB_REGISTRY`; valore precedente `CLAWDHUB_REGISTRY`).
