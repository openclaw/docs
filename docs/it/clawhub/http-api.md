---
read_when:
    - Aggiunta/modifica di endpoint
    - Debug delle richieste CLI ↔ registry
summary: Riferimento API HTTP (endpoint pubblici + CLI + autenticazione).
x-i18n:
    generated_at: "2026-07-01T15:25:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL di base: `https://clawhub.ai` (predefinito).

Tutti i percorsi v1 si trovano sotto `/api/v1/...`.
I percorsi legacy `/api/...` e `/api/cli/...` restano per compatibilità (vedi `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Riutilizzo del catalogo pubblico

Le directory di terze parti possono usare gli endpoint pubblici di lettura per elencare o cercare le Skills di ClawHub. Memorizza i risultati nella cache, rispetta `429`/`Retry-After`, rimanda gli utenti alla scheda canonica di ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) ed evita di implicare un'approvazione di ClawHub per il sito di terze parti. Non tentare di replicare contenuti nascosti, privati o bloccati dalla moderazione al di fuori della superficie dell'API pubblica.

Le scorciatoie slug web si risolvono tra famiglie di registri, ma i client API dovrebbero usare
gli URL canonici restituiti dagli endpoint di lettura invece di ricostruire la precedenza
delle route.

## Limiti di frequenza

Modello di applicazione:

- Richieste anonime: applicate per IP.
- Richieste autenticate (token Bearer valido): applicate per bucket utente.
- Se il token è mancante/non valido, il comportamento ricade sull'applicazione per IP.
- Gli endpoint di scrittura autenticati non dovrebbero restituire un semplice `Unauthorized` quando
  il server conosce il motivo. Token mancanti, token non validi/revocati e
  account eliminati/bannati/disabilitati dovrebbero ricevere ciascuno testo utilizzabile, così i client
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
- Se `Retry-After` manca, ripiega su `RateLimit-Reset` (o calcola da `X-RateLimit-Reset`).

Origine IP:

- Usa header IP client attendibili, incluso `cf-connecting-ip`, solo quando la
  distribuzione abilita esplicitamente gli header inoltrati attendibili.
- ClawHub usa header di inoltro attendibili per identificare gli IP client all'edge.
- Se non è disponibile alcun IP client attendibile, le richieste anonime usano bucket di fallback
  limitati solo dal tipo di limite di frequenza. Questi bucket di fallback non includono
  percorsi forniti dal chiamante, slug, nomi di pacchetti, versioni, stringhe di query o altri
  parametri dell'artefatto.

## Risposte di errore

Le risposte di errore pubbliche v1 sono testo semplice con `content-type: text/plain; charset=utf-8`.
Questo include errori di validazione (`400`), risorse pubbliche mancanti (`404`), errori di autenticazione e
permessi (`401`/`403`), limiti di frequenza (`429`) e download bloccati. I client
dovrebbero leggere il corpo della risposta come stringa leggibile dall'uomo. I parametri di query sconosciuti sono
ignorati per compatibilità, ma i parametri di query riconosciuti con valori non validi restituiscono
`400`.

## Endpoint pubblici (senza autenticazione)

### `GET /api/v1/search`

Parametri di query:

- `q` (obbligatorio): stringa di query
- `limit` (opzionale): intero
- `highlightedOnly` (opzionale): `true` per filtrare alle Skills evidenziate
- `nonSuspiciousOnly` (opzionale): `true` per nascondere Skills sospette (`flagged.suspicious`)
- `nonSuspicious` (opzionale): alias legacy per `nonSuspiciousOnly`

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

- I risultati sono restituiti in ordine di rilevanza (similarità dell'embedding + boost per token esatti di slug/nome + un piccolo prior di popolarità).
- La rilevanza è più forte della popolarità. Una corrispondenza precisa di slug o token del nome visualizzato può superare una corrispondenza più vaga con coinvolgimento molto più alto.
- Il testo ASCII viene tokenizzato sui confini di parola e punteggiatura. Ad esempio, `personal-map` contiene un token autonomo `map`, mentre `amap-jsapi-skill` contiene `amap`, `jsapi` e `skill`; cercare `map` quindi dà a `personal-map` una corrispondenza lessicale più forte rispetto a `amap-jsapi-skill`.
- La popolarità è scalata logaritmicamente e limitata. Le Skills ad alto coinvolgimento possono posizionarsi più in basso quando il testo della query ha una corrispondenza più debole.
- Uno stato di moderazione sospetto o nascosto può rimuovere una Skill dalla ricerca pubblica in base ai filtri del chiamante e allo stato di moderazione corrente.

Indicazioni sulla rilevabilità per i publisher:

- Inserisci i termini che gli utenti cercheranno letteralmente nel nome visualizzato, nel riepilogo e nei tag. Usa un token slug autonomo solo quando è anche un'identità stabile che vuoi mantenere.
- Non rinominare uno slug solo per inseguire una query, a meno che il nuovo slug sia un nome canonico migliore a lungo termine. I vecchi slug diventano alias di reindirizzamento, ma l'URL canonico, lo slug visualizzato e i futuri digest di ricerca usano il nuovo slug.
- Gli alias di rinomina preservano la risoluzione per vecchi URL e installazioni che si risolvono tramite il registro, ma il ranking di ricerca si basa sui metadati canonici della Skill dopo che la rinomina è stata indicizzata. Le statistiche esistenti restano associate alla Skill.
- Se una Skill è inaspettatamente invisibile, controlla prima lo stato di moderazione con `clawhub inspect @owner/slug` mentre hai effettuato l'accesso, prima di modificare metadati relativi al ranking.

### `GET /api/v1/skills`

Parametri di query:

- `limit` (opzionale): intero (1–200)
- `cursor` (opzionale): cursore di paginazione per qualsiasi ordinamento non `trending`
- `sort` (opzionale): `updated` (predefinito), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), gli alias legacy di installazione `installsCurrent`/`installs`/`installsAllTime` mappano a `downloads`, `trending`
- `nonSuspiciousOnly` (opzionale): `true` per nascondere Skills sospette (`flagged.suspicious`)
- `nonSuspicious` (opzionale): alias legacy per `nonSuspiciousOnly`

Valori `sort` non validi restituiscono `400`.

Note:

- `recommended` usa segnali di coinvolgimento e recenza.
- `trending` classifica in base alle installazioni negli ultimi 7 giorni (basato su telemetria).
- `createdAt` è stabile per i crawl di nuove Skill; `updated` cambia quando le Skills esistenti vengono ripubblicate.
- Quando `nonSuspiciousOnly=true`, gli ordinamenti basati su cursore possono restituire meno di `limit` elementi in una pagina perché le Skills sospette vengono filtrate dopo il recupero della pagina.
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

- I vecchi slug creati dai flussi di rinomina/unione del proprietario si risolvono alla Skill canonica.
- `metadata.os`: restrizioni OS dichiarate nel frontmatter della Skill (ad es. `["macos"]`, `["linux"]`). `null` se non dichiarate.
- `metadata.systems`: target di sistema Nix (ad es. `["aarch64-darwin", "x86_64-linux"]`). `null` se non dichiarati.
- `metadata` è `null` se la Skill non ha metadati di piattaforma.
- `moderation` è incluso solo quando la Skill è segnalata o il proprietario la sta visualizzando.

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

- Proprietari e moderatori possono accedere ai dettagli di moderazione per le Skills nascoste.
- I chiamanti pubblici ricevono `200` solo per Skills visibili già segnalate.
- Le evidenze sono oscurate per i chiamanti pubblici e includono frammenti grezzi solo per proprietari/moderatori.

### `POST /api/v1/skills/{slug}/report`

Segnala una Skill per revisione da parte dei moderatori. Le segnalazioni sono a livello di Skill, opzionalmente collegate
a una versione, e alimentano la coda delle segnalazioni Skill.

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

Endpoint moderatore/admin per l'acquisizione delle segnalazioni Skill.

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

Endpoint moderatore/admin per risolvere o riaprire segnalazioni Skill.

Richiesta:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` è obbligatorio per `confirmed` e `dismissed`; può essere omesso quando
si imposta `status` di nuovo a `open`. Passa `finalAction: "hide"` con una segnalazione valutata
per nascondere la Skill nello stesso workflow verificabile.

### `GET /api/v1/skills/{slug}/versions`

Parametri di query:

- `limit` (opzionale): intero
- `cursor` (opzionale): cursore di paginazione

### `GET /api/v1/skills/{slug}/versions/{version}`

Restituisce i metadati della versione + l'elenco dei file.

- `version.security` include lo stato di verifica della scansione normalizzato e i dettagli dello scanner
  (VirusTotal + LLM), quando disponibili.

### `GET /api/v1/skills/{slug}/scan`

Restituisce i dettagli di verifica della scansione di sicurezza per una versione Skill.

Parametri di query:

- `version` (opzionale): stringa di versione specifica.
- `tag` (opzionale): risolve una versione con tag (ad esempio `latest`).

Note:

- Se non viene fornito né `version` né `tag`, usa la versione più recente.
- Include lo stato di verifica normalizzato più i dettagli specifici dello scanner.
- `security.hasScanResult` è `true` solo quando uno scanner ha prodotto un verdetto definitivo (`clean`, `suspicious` o `malicious`).
- `moderation` è uno snapshot di moderazione corrente a livello di skill derivato dalla versione più recente.
- Quando interroghi una versione storica, controlla `moderation.matchesRequestedVersion` e `moderation.sourceVersion` prima di trattare `moderation` e `security` come lo stesso contesto di versione.

### `POST /api/v1/skills/-/scan`

Endpoint autenticato di invio per nuovi job ClawScan.

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

- I payload delle richieste di scansione e i report scaricabili scadono dallo store delle richieste di scansione dopo la finestra di conservazione.
- Le scansioni pubblicate richiedono accesso di gestione da owner/publisher, oppure autorità di moderatore/amministratore della piattaforma.
- Le scansioni pubblicate scrivono indietro solo quando `update: true` e la scansione viene completata correttamente.
- La risposta è `202` con `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- I job di scansione sono asincroni. Le richieste di scansione manuale hanno priorità rispetto al normale lavoro di pubblicazione/backfill, ma il completamento dipende comunque dalla disponibilità dei worker.

### `GET /api/v1/skills/-/scan/{scanId}`

Endpoint autenticato di polling per una scansione inviata.

- Restituisce lo stato in coda/in esecuzione/riuscito/non riuscito.
- Restituisce `queue.queuedAhead` e `queue.position` mentre è in coda, così i client possono mostrare quante scansioni manuali prioritarie precedono la richiesta. Le code molto grandi sono limitate e segnalate con `queuedAheadIsEstimate: true`.
- Quando disponibile, `report` contiene le sezioni `clawscan`, `skillspector`, `staticAnalysis` e `virustotal`.
- I job di scansione non riusciti restituiscono `status: "failed"` con `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Endpoint autenticato per l'archivio dei report.

- Richiede una scansione riuscita; le scansioni non terminali restituiscono `409`.
- Restituisce uno ZIP con `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` e `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Endpoint autenticato per l'archivio dei report salvati per le versioni inviate.

- Richiede accesso di gestione da owner/publisher alla skill o al plugin, oppure autorità di moderatore/amministratore della piattaforma.
- Restituisce i risultati di scansione salvati per la versione esatta inviata, incluse le versioni bloccate o nascoste.
- `kind` usa `skill` come valore predefinito; usa `kind=plugin` per scansioni di plugin/pacchetti.
- Restituisce la stessa forma ZIP dei download delle richieste di scansione.

### `POST /api/v1/skills/-/scan/batch`

Route canonica, riservata agli amministratori, per la nuova scansione batch. Accetta la stessa forma di payload della route legacy `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Route canonica, riservata agli amministratori, per lo stato batch. Accetta `{ "jobIds": ["..."] }` e restituisce gli stessi contatori aggregati della route legacy `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Restituisce l'envelope di verifica della scheda Skill usato da `clawhub skill verify`.

Parametri di query:

- `version` (facoltativo): stringa di versione specifica.
- `tag` (facoltativo): risolve una versione con tag (per esempio `latest`).

Note:

- `ok` è `true` solo quando la versione selezionata ha una scheda Skill generata, non è bloccata come malware dalla moderazione e la verifica ClawScan è pulita.
- L'identità della Skill, l'identità del publisher e i metadati della versione selezionata sono campi di primo livello dell'envelope (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), così l'automazione shell può leggerli senza decomprimere wrapper annidati.
- `security` è il verdetto ClawScan/security di primo livello. L'automazione dovrebbe basarsi su `ok`, `decision`, `reasons` e `security.status`.
- `security.signals` contiene prove di supporto dello scanner, come `staticScan`, `virusTotal` e `skillSpector`.
- `security.signals.dependencyRegistry` viene mantenuto per compatibilità con la risposta v1, ma lo scanner di esistenza del registro delle dipendenze è ritirato e questa chiave è sempre `null`.
- `provenance` è `server-resolved-github-import` solo quando ClawHub ha risolto e salvato un repo/ref/commit/percorso GitHub durante la pubblicazione o l'importazione; altrimenti è `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Restituisce i verdetti di sicurezza compatti correnti per versioni esatte delle Skill. Questo
endpoint di raccolta è pensato per i client che sanno già quali versioni delle Skill
ClawHub installate devono visualizzare, come OpenClaw Control UI.

Richiesta:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Note:

- `items` deve contenere 1-100 coppie `{ slug, version }` uniche.
- I risultati sono per elemento; una Skill o versione mancante non fa fallire l'intera risposta.
- La risposta riguarda solo la sicurezza. Non include dati della scheda Skill, stato della scheda generata, elenchi di file degli artefatti o payload dettagliati degli scanner.
- `security.signals` contiene solo prove di supporto a livello di stato; usa `/scan` o la pagina security-audit di ClawHub per i dettagli completi degli scanner.
- `security.signals.dependencyRegistry` viene mantenuto per compatibilità con la risposta v1, ma lo scanner di esistenza del registro delle dipendenze è ritirato e questa chiave è sempre `null`.
- L'assenza della scheda Skill non influisce su `ok`, `decision` o `reasons` di questo endpoint; i client dovrebbero leggere localmente la `skill-card.md` installata quando hanno bisogno del contenuto della scheda.
- Usa `/verify` quando ti serve l'envelope di verifica della scheda Skill per una singola Skill, `/card` quando ti serve il markdown della scheda generata e `/scan` quando ti servono dati dettagliati degli scanner.

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
- `version` (opzionale)
- `tag` (opzionale)

Note:

- Usa per impostazione predefinita la versione più recente.
- Limite di dimensione del file: 200KB.

### `GET /api/v1/packages`

Endpoint di catalogo unificato per:

- Skills
- Plugin di codice
- Plugin bundle

Parametri di query:

- `limit` (opzionale): intero (1–100)
- `cursor` (opzionale): cursore di paginazione
- `family` (opzionale): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (opzionale): `official`, `community` o `private`
- `isOfficial` (opzionale): `true` o `false`
- `sort` (opzionale): `updated` (predefinito), `recommended`, `trending`, `downloads`, alias legacy `installs`
- `category` (opzionale): filtro per categoria Plugin. Supportato solo quando la
  richiesta è limitata ai pacchetti Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` o endpoint dei pacchetti con
  `family=code-plugin`/`family=bundle-plugin`). Le categorie controllate e gli
  alias legacy del filtro v1 sono documentati in `GET /api/v1/plugins`.

Note:

- Valori non validi per `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` o `sort` restituiscono `400`. I parametri di query sconosciuti vengono ignorati.
- `GET /api/v1/code-plugins` e `GET /api/v1/bundle-plugins` rimangono alias a famiglia fissa.
- Le voci Skills restano supportate dal registro Skills e possono ancora essere pubblicate solo tramite `POST /api/v1/skills`.
- `POST /api/v1/packages` è ancora solo per le release code-plugin e bundle-plugin.
- I chiamanti anonimi vedono solo i canali di pacchetti pubblici.
- I chiamanti autenticati possono vedere nei risultati di elenco/ricerca i pacchetti privati per i publisher a cui appartengono.
- `channel=private` restituisce solo i pacchetti che il chiamante autenticato può leggere.

### `GET /api/v1/packages/search`

Ricerca nel catalogo unificato tra Skills e pacchetti Plugin.

Parametri di query:

- `q` (obbligatorio): stringa di query
- `limit` (opzionale): intero (1–100)
- `family` (opzionale): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (opzionale): `official`, `community` o `private`
- `isOfficial` (opzionale): `true` o `false`
- `category` (opzionale): filtro per categoria Plugin. Supportato solo quando la
  richiesta è limitata ai pacchetti Plugin. Le categorie controllate e gli alias
  legacy del filtro v1 sono documentati in `GET /api/v1/plugins`.

Note:

- Valori non validi per `family`, `channel`, `isOfficial`, `featured` o
  `highlightedOnly` restituiscono `400`. I parametri di query sconosciuti vengono ignorati.
- I chiamanti anonimi vedono solo i canali di pacchetti pubblici.
- I chiamanti autenticati possono cercare pacchetti privati per i publisher a cui appartengono.
- `channel=private` restituisce solo i pacchetti che il chiamante autenticato può leggere.

### `GET /api/v1/plugins`

Sfoglia catalogo solo Plugin tra pacchetti code-plugin e bundle-plugin.

Parametri di query:

- `limit` (opzionale): intero (1-100)
- `cursor` (opzionale): cursore di paginazione
- `isOfficial` (opzionale): `true` o `false`
- `sort` (opzionale): `recommended` (predefinito), `trending`, `downloads`, `updated`, alias legacy `installs`
- `category` (opzionale): filtro per categoria Plugin. Valori correnti:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Gli alias legacy del filtro v1 restano accettati sugli endpoint di lettura:

- `mcp-tooling`, `data` e `automation` si risolvono in `tools`.
- `observability` e `deployment` si risolvono in `gateway`.
- `dev-tools` si risolve in `runtime`.

`trending` è una classifica di installazioni/download su sette giorni e non usa i totali di sempre.
Sull'endpoint unificato `/api/v1/packages` è solo per Plugin; usa
`/api/v1/skills?sort=trending` per il catalogo Skills.

Gli alias legacy non sono accettati come valori di categoria archiviati o dichiarati dall'autore.

### `GET /api/v1/skills/export`

Esportazione in blocco delle Skills pubbliche più recenti per l'analisi offline.

Autenticazione:

- Token API richiesto.

Parametri di query:

- `startDate` (obbligatorio): limite inferiore in millisecondi Unix per `updatedAt` della skill.
- `endDate` (obbligatorio): limite superiore in millisecondi Unix per `updatedAt` della skill.
- `limit` (opzionale): intero (1-250), predefinito `250`.
- `cursor` (opzionale): cursore di paginazione dalla risposta precedente.

Risposta:

- Corpo: archivio ZIP.
- Ogni skill esportata ha radice in `{publisher}/{slug}/`.
- Le Skills ospitate includono i file dell'ultima versione memorizzata e sono elencate in
  `_manifest.json` con `sourceRef: "public-clawhub"`.
- Le Skills correnti basate su GitHub con una scansione `clean` o `suspicious` includono
  `_source_handoff.json` con `sourceRef: "public-github"`, repo, commit, percorso,
  hash del contenuto e URL dell'archivio. Non includono file sorgente ospitati da ClawHub.
- Ogni skill include `_export_skill_meta.json`.
- `_manifest.json` è sempre incluso nella radice dello ZIP.
- `_errors.json` è incluso quando non è stato possibile esportare singole Skills o file.

Intestazioni:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Esportazione in blocco delle ultime release pubbliche dei plugin per l'analisi offline.

Autenticazione:

- Token API obbligatorio.

Parametri di query:

- `startDate` (obbligatorio): limite inferiore in millisecondi Unix per `updatedAt` del plugin.
- `endDate` (obbligatorio): limite superiore in millisecondi Unix per `updatedAt` del plugin.
- `limit` (facoltativo): intero (1-250), valore predefinito `250`.
- `cursor` (facoltativo): cursore di paginazione dalla risposta precedente.
- `family` (facoltativo): `code-plugin` o `bundle-plugin`. Se omesso indica entrambe
  le famiglie di plugin.

Risposta:

- Corpo: archivio ZIP.
- Ogni plugin esportato ha radice in `{family}/{packageName}/`.
- Ogni plugin esportato include i file archiviati dell'ultima release.
- I metadati di esportazione per plugin sono archiviati in
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` è sempre incluso nella radice dello ZIP.
- `_errors.json` è incluso quando singoli plugin o file non possono essere
  esportati.

Header:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Ricerca solo per plugin nei pacchetti code-plugin e bundle-plugin.

Parametri di query:

- `q` (obbligatorio): stringa di query
- `limit` (facoltativo): intero (1-100)
- `isOfficial` (facoltativo): `true` o `false`
- `category` (facoltativo): filtro per categoria di plugin. Valori correnti:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Note:

- Sono accettati anche gli alias dei filtri legacy v1 documentati in `GET /api/v1/plugins`.
- Il filtro per categoria è un vero filtro API basato sulle righe di digest delle categorie
  dei plugin, non una riscrittura della query di ricerca.
- I risultati vengono restituiti in ordine di rilevanza e al momento non sono paginati.
- I controlli di ordinamento dell'interfaccia browser per la ricerca dei plugin riordinano i risultati di rilevanza caricati,
  in linea con il comportamento di navigazione corrente di `/skills`.

### `GET /api/v1/packages/{name}`

Restituisce i metadati di dettaglio del pacchetto.

Note:

- Anche gli Skills possono risolversi tramite questa rotta nel catalogo unificato.
- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.

### `DELETE /api/v1/packages/{name}`

Esegue una soft delete di un pacchetto e di tutte le release.

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
verifica, metadati degli artefatti e dati di scansione.

Note:

- `version.artifact.kind` è `legacy-zip` per gli archivi di pacchetti del vecchio mondo oppure
  `npm-pack` per le release basate su ClawPack.
- Le release ClawPack includono i campi compatibili con npm `npmIntegrity`, `npmShasum` e
  `npmTarballName`.
- `version.sha256hash` è un metadato di compatibilità deprecato per i vecchi client. Esegue l'hash
  dei byte ZIP esatti restituiti da `/api/v1/packages/{name}/download`.
  I client moderni dovrebbero usare `version.artifact.sha256`, che identifica
  l'artefatto di release canonico.
- `version.vtAnalysis`, `version.llmAnalysis` e `version.staticScan` sono
  inclusi quando esistono dati di scansione.
- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Restituisce il riepilogo esatto di sicurezza e attendibilità della release del pacchetto per i client
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
  pacchetto di registro risolto.
- `release.releaseId`, `release.version` e `release.createdAt` identificano la
  release esatta che è stata valutata.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` e `release.npmTarballName` sono presenti quando noti per
  l'artefatto della release.
- `trust.scanStatus` è lo stato di attendibilità effettivo derivato dagli input dello scanner
  e dalla moderazione manuale della release.
- `trust.moderationState` può essere null. È `null` quando non esiste alcuna moderazione manuale della release.
- `trust.blockedFromDownload` è il segnale di blocco dell'installazione. OpenClaw e altri
  client di installazione dovrebbero bloccare l'installazione quando questo valore è `true` invece di
  ricalcolare le regole di blocco dai campi dello scanner o di moderazione.
- `trust.reasons` è l'elenco di spiegazioni rivolto all'utente e per audit. I codici motivo
  sono stringhe stabili e compatte come `manual:quarantined`, `scan:malicious`
  e `package:malicious`.
- `trust.pending` significa che uno o più input di attendibilità sono ancora in attesa di completamento.
- `trust.stale` significa che il riepilogo di attendibilità è stato calcolato da input obsoleti e
  dovrebbe essere trattato come da aggiornare prima di una decisione di autorizzazione ad alta confidenza.

Note:

- Questo endpoint è esatto per versione. I client dovrebbero chiamarlo dopo aver risolto la
  versione del pacchetto che intendono installare, non solo dopo aver letto i metadati
  più recenti del pacchetto.
- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.
- Questo endpoint è intenzionalmente più ristretto degli endpoint di moderazione
  per proprietari/moderatori. Espone la decisione di installazione e la spiegazione pubblica, non
  identità dei segnalatori, contenuti delle segnalazioni, prove private o timeline interne di revisione.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Restituisce i metadati espliciti del risolutore di artefatti per una versione del pacchetto.

Note:

- Le versioni di pacchetto legacy restituiscono un artefatto `legacy-zip` e un
  `downloadUrl` ZIP legacy.
- Le versioni ClawPack restituiscono un artefatto `npm-pack`, campi di integrità npm, un
  `tarballUrl` e l'URL di compatibilità ZIP legacy.
- Questa è la superficie del risolutore OpenClaw; evita di dedurre il formato dell'archivio da
  un URL condiviso.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Scarica l'artefatto della versione tramite il percorso esplicito del risolutore.

Note:

- Le versioni ClawPack trasmettono in streaming i byte esatti `.tgz` npm-pack caricati.
- Le versioni ZIP legacy reindirizzano a `/api/v1/packages/{name}/download?version=`.
- Usa il bucket di limite di frequenza dei download.

### `GET /api/v1/packages/{name}/readiness`

Restituisce la readiness calcolata per il futuro consumo di OpenClaw.

I controlli di readiness coprono:

- stato del canale ufficiale
- disponibilità dell'ultima versione
- disponibilità dell'artefatto ClawPack npm-pack
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

Endpoint per moderatori per elencare le righe di migrazione dei plugin ufficiali OpenClaw.

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

Endpoint amministratore per creare o aggiornare una riga di migrazione di un plugin ufficiale.

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

Endpoint per moderatori/amministratori per le code di revisione delle release dei pacchetti.

Autenticazione:

- Richiede un token API per un utente moderatore o amministratore.

Parametri di query:

- `status` (facoltativo): `open` (predefinito), `blocked`, `manual` o `all`
- `limit` (facoltativo): intero (1-100)
- `cursor` (facoltativo): cursore di paginazione

Significato degli stati:

- `open`: release sospette, dannose, in sospeso, in quarantena, revocate o segnalate.
- `blocked`: release in quarantena, revocate o dannose.
- `manual`: qualsiasi release con un override di moderazione manuale.
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

Segnala un pacchetto per la revisione dei moderatori. Le segnalazioni sono a livello di pacchetto, facoltativamente
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

Endpoint moderatore/admin per l'acquisizione delle segnalazioni dei pacchetti.

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

- Richiede un token API per il proprietario del pacchetto, un membro dell'editore, un moderatore o
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

Endpoint moderatore/admin per risolvere o riaprire le segnalazioni dei pacchetti.

Richiesta:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` è obbligatorio per `confirmed` e `dismissed`; può essere omesso quando
si reimposta `status` su `open`. Passa `finalAction: "quarantine"` o
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
Ogni modifica scrive una voce nel log di audit.

### `GET /api/v1/packages/{name}/file`

Restituisce contenuto di testo grezzo per un file del pacchetto.

Parametri di query:

- `path` (obbligatorio)
- `version` (opzionale)
- `tag` (opzionale)

Note:

- Usa per impostazione predefinita la release più recente.
- Usa il bucket di limite di frequenza delle letture, non il bucket dei download.
- I file binari restituiscono `415`.
- Limite di dimensione file: 200 KB.
- Le scansioni VirusTotal in sospeso non bloccano le letture; le release malevole possono comunque essere trattenute altrove.
- I pacchetti privati restituiscono `404` a meno che il chiamante non possa leggere l'editore proprietario.

### `GET /api/v1/packages/{name}/download`

Scarica l'archivio ZIP deterministico legacy per una release del pacchetto.

Parametri di query:

- `version` (opzionale)
- `tag` (opzionale)

Note:

- Usa per impostazione predefinita la release più recente.
- Le Skills reindirizzano a `GET /api/v1/download`.
- Gli archivi Plugin/pacchetto sono file zip con una radice `package/` in modo che i vecchi client OpenClaw
  continuino a funzionare.
- Questa route resta solo ZIP. Non trasmette in streaming file ClawPack `.tgz`.
- Le risposte includono gli header `ETag`, `Digest`, `X-ClawHub-Artifact-Type` e
  `X-ClawHub-Artifact-Sha256` per i controlli di integrità del resolver.
- I metadati solo registro non vengono inseriti nell'archivio scaricato.
- Le scansioni VirusTotal in sospeso non bloccano i download; le release malevole restituiscono `403`.
- I pacchetti privati restituiscono `404` a meno che il chiamante non sia il proprietario.

### `GET /api/npm/{package}`

Restituisce un packument compatibile con npm per le versioni dei pacchetti basate su ClawPack.

Note:

- Sono elencate solo le versioni con tarball npm-pack ClawPack caricati.
- Le versioni legacy solo ZIP vengono intenzionalmente omesse.
- `dist.tarball`, `dist.integrity` e `dist.shasum` usano campi compatibili con npm
  in modo che gli utenti possano puntare npm al mirror se lo desiderano.
- I packument dei pacchetti con scope supportano sia `/api/npm/@scope/name` sia il percorso di richiesta
  codificato di npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Trasmette in streaming i byte esatti del tarball ClawPack caricato per i client mirror npm.

Note:

- Usa il bucket di limite di frequenza dei download.
- Gli header di download includono SHA-256 ClawHub più i metadati npm integrity/shasum.
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

Scarica uno ZIP di una versione skill ospitata, oppure restituisce un handoff sorgente GitHub per una
skill corrente basata su GitHub con una scansione `clean` o `suspicious` e nessuna versione
ospitata.

Parametri di query:

- `slug` (obbligatorio)
- `version` (opzionale): stringa semver
- `tag` (opzionale): nome tag (ad es. `latest`)

Note:

- Se non viene fornito né `version` né `tag`, viene usata la versione più recente.
- Le versioni eliminate con soft delete restituiscono `410`.
- Gli handoff delle skill basate su GitHub non fanno proxy né mirror dei byte. La risposta JSON
  include `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  e `archiveUrl`; lo stato di scansione/corrente è un gate e non è incluso come metadato del payload
  di successo.
- Le statistiche di download vengono conteggiate come identità univoche per giorno UTC (`userId` quando il token API è valido, altrimenti IP).

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
- Campo payload opzionale: `ownerHandle`. Quando presente, l'API risolve quell'
  editore lato server e richiede che l'attore disponga dell'accesso all'editore.
- Campo payload opzionale: `migrateOwner`. Quando è `true` con `ownerHandle`, una
  skill esistente può essere spostata a quel proprietario se l'attore è admin/proprietario sia sull'
  editore corrente sia su quello di destinazione. Senza questo consenso esplicito, le modifiche del proprietario vengono
  rifiutate.

### `POST /api/v1/packages`

Pubblica una release code-plugin o bundle-plugin.

- Richiede autenticazione con token Bearer.
- Richiede `multipart/form-data`.
- I campi modulo consentiti sono `payload`, blob `files` ripetuti, oppure un riferimento tarball `clawpack`.
  `clawpack` può essere un blob `.tgz` o un id di archiviazione restituito dal
  flusso upload-url. Le pubblicazioni con storage-id in staging devono includere anche il
  `clawpackUploadTicket` restituito con quell'URL di upload.
- Usa `files` oppure `clawpack`, mai entrambi nella stessa richiesta.
- I corpi JSON e i metadati `payload.files` / `payload.artifact`
  forniti dal chiamante vengono rifiutati.
- Le richieste di pubblicazione multipart dirette sono limitate a 18 MB. I tarball ClawPack possono
  usare il flusso upload-url fino al limite tarball di 120 MB.
- Campo payload opzionale: `ownerHandle`. Quando presente, solo gli admin possono pubblicare per conto di quel proprietario.

Punti salienti della convalida:

- `family` deve essere `code-plugin` o `bundle-plugin`.
- I pacchetti Plugin richiedono `openclaw.plugin.json`. I caricamenti ClawPack `.tgz` devono
  contenerlo in `package/openclaw.plugin.json`.
- I code plugin richiedono `package.json`, metadati del repository sorgente, metadati del commit sorgente,
  metadati dello schema di configurazione, `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` e `openclaw.environment` sono metadati opzionali.
- Solo l'editore dell'org `openclaw` e gli editori personali dei membri correnti dell'org `openclaw`
  possono pubblicare sul canale `official`.
- Le pubblicazioni per conto terzi convalidano comunque l'idoneità al canale ufficiale rispetto all'account del proprietario di destinazione.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Elimina con soft delete / ripristina una skill (proprietario, moderatore o admin).

Corpo JSON opzionale:

```json
{ "reason": "Held for moderation pending legal review." }
```

Quando presente, `reason` viene memorizzato come nota di moderazione della skill e copiato nel log di audit.
Le soft delete avviate dal proprietario riservano lo slug per 30 giorni, poi lo slug può essere rivendicato da
un altro editore. La risposta di eliminazione include `slugReservedUntil` quando si applica questa scadenza.
Gli occultamenti di moderatore/admin e le rimozioni di sicurezza non scadono in questo modo.

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

Solo admin. Garantisce che esista un editore org per un handle. Se l'handle punta ancora a un
utente/editore personale condiviso legacy, l'endpoint lo migra prima in un editore org.
Per un'org appena creata, fornisci `memberHandle`; l'admin agente non viene aggiunto come membro.
`memberRole` è predefinito a `owner`.

- Corpo: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Risposta: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Creazione autenticata self-service di editori org. Crea un nuovo editore org e aggiunge il
chiamante come proprietario. Questo endpoint non migra handle utente/personali esistenti e non
contrassegna l'editore come attendibile/ufficiale.

- Corpo: `{ "handle": "opik", "displayName": "Opik" }`
- Risposta: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Restituisce `409` quando l'handle è già usato da un editore, un utente o un editore personale.

### `POST /api/v1/users/reserve`

Solo admin. Riserva slug radice e nomi di pacchetti per un legittimo proprietario senza pubblicare una
release. I nomi dei pacchetti diventano pacchetti placeholder privati senza righe di release, così lo stesso
proprietario può pubblicare in seguito la vera release code-plugin o bundle-plugin in quel nome.

- Corpo: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Risposta: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Solo admin. Recupera un editore personale per un principal GitHub OAuth sostitutivo verificato
senza modificare le righe account di Convex Auth. La richiesta deve nominare entrambi gli id account immutabili
del provider GitHub; gli handle modificabili vengono usati solo come guardrail rivolto all'operatore.

L'endpoint usa dry-run per impostazione predefinita. L'applicazione del ripristino richiede `dryRun: false` e
`confirmIdentityVerified: true` dopo che lo staff ha verificato in modo indipendente la continuità tra entrambi i
principali GitHub. Il ripristino fallisce in modalità chiusa quando l'editore personale corrente dell'utente di destinazione
ha skill, pacchetti o sorgenti skill GitHub.
Il ripristino migra anche i campi legacy `ownerUserId` per le skill dell'editore ripristinato,
gli alias degli slug delle skill, i pacchetti, gli avvisi dell'ispettore pacchetti e le righe derivate del digest di ricerca, così che
i percorsi del proprietario diretto concordino con la nuova autorità dell'editore. Anche una prenotazione attiva di handle protetto
per l'handle ripristinato viene riassegnata all'utente sostitutivo, così che la successiva
sincronizzazione del profilo non possa ripristinare l'autorità concorrente dell'utente precedente. Ogni tabella primaria è limitata a
100 righe per transazione di applicazione; i ripristini più grandi devono prima usare una migrazione del proprietario riprendibile.
Le sorgenti skill GitHub sono nell'ambito dell'editore e vengono segnalate come controllate anziché riscritte.

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
- `merge` nasconde la voce sorgente e reindirizza lo slug sorgente alla voce di destinazione.

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

Escludi un utente ed elimina definitivamente le skill possedute (solo moderatore/amministratore).

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

Rimuovi l'esclusione di un utente e ripristina le skill idonee (solo amministratore).

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

Cambia il motivo memorizzato per un'esclusione esistente senza rimuovere l'esclusione né ripristinare
contenuti (solo amministratore). Usa dry-run per impostazione predefinita, a meno che `dryRun` sia `false`.

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

Cambia il ruolo di un utente (solo amministratore).

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

Parametri di query:

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

Aggiungi/rimuovi una stella (in evidenza). Entrambi gli endpoint sono idempotenti.

Risposte:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Endpoint CLI legacy (deprecati)

Ancora supportati per le versioni CLI precedenti:

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

## Rilevamento del registro (`/.well-known/clawhub.json`)

La CLI può rilevare le impostazioni di registro/autenticazione dal sito:

- `/.well-known/clawhub.json` (JSON, preferito)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Se fai self-hosting, servi questo file (oppure imposta `CLAWHUB_REGISTRY` esplicitamente; legacy `CLAWDHUB_REGISTRY`).
