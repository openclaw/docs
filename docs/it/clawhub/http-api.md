---
read_when:
    - Aggiunta/modifica degli endpoint
    - Debug delle richieste CLI ↔ registro
summary: Riferimento API HTTP (endpoint pubblici + endpoint CLI + autenticazione).
x-i18n:
    generated_at: "2026-05-11T20:23:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1580df58fe2342858dd2c86ebaf659993157b11508c0fc03530e541bd0118ae
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL di base: `https://clawhub.ai` (predefinito).

Tutti i percorsi v1 si trovano sotto `/api/v1/...`.
I percorsi legacy `/api/...` e `/api/cli/...` restano per compatibilità (vedi `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Riutilizzo del catalogo pubblico

Le directory di terze parti possono usare gli endpoint pubblici di lettura per elencare o cercare le Skills di ClawHub. Memorizza i risultati nella cache, rispetta `429`/`Retry-After`, rimanda gli utenti alla scheda canonica di ClawHub (`https://clawhub.ai/<owner>/<slug>`) ed evita di suggerire un'approvazione di ClawHub per il sito di terze parti. Non tentare di replicare contenuti nascosti, privati o bloccati dalla moderazione al di fuori della superficie dell'API pubblica.

Le scorciatoie degli slug web vengono risolte tra le famiglie del registro, ma i client API dovrebbero usare
gli URL canonici restituiti dagli endpoint di lettura invece di ricostruire la precedenza
delle route.

## Limiti di frequenza

Modello di applicazione:

- Richieste anonime: applicate per IP.
- Richieste autenticate (token Bearer valido): applicate per bucket utente.
- Se il token manca o non è valido, il comportamento ricade sull'applicazione per IP.
- Gli endpoint di scrittura autenticati non dovrebbero restituire un semplice `Unauthorized` quando
  il server conosce il motivo. Token mancanti, token non validi o revocati e
  account eliminati, bannati o disabilitati dovrebbero ricevere ciascuno un testo utilizzabile così che i client
  CLI possano dire agli utenti cosa li ha bloccati.

- Lettura: 600/min per IP, 2400/min per chiave
- Scrittura: 45/min per IP, 180/min per chiave
- Download: 30/min per IP, 180/min per chiave (`/api/v1/download`)

Header:

- Compatibilità legacy: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Standardizzati: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Su `429`: `Retry-After`

Semantica degli header:

- `X-RateLimit-Reset`: secondi assoluti dell'epoca Unix
- `RateLimit-Reset`: secondi fino al reset (ritardo)
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
- Se `Retry-After` manca, ricadi su `RateLimit-Reset` (o calcola da `X-RateLimit-Reset`).

Origine IP:

- Usa `cf-connecting-ip` (Cloudflare) per l'IP del client per impostazione predefinita.
- ClawHub usa header di forwarding attendibili per identificare gli IP client all'edge.
- Se non è disponibile alcun IP client attendibile, le richieste di download anonime usano un bucket di fallback con ambito endpoint invece di un unico bucket globale `ip:unknown`. Le richieste anonime di lettura/scrittura usano ancora il bucket unknown condiviso, così il routing con IP mancante resta visibile e conservativo.

## Endpoint pubblici (senza autenticazione)

### `GET /api/v1/search`

Parametri di query:

- `q` (obbligatorio): stringa di query
- `limit` (opzionale): intero
- `highlightedOnly` (opzionale): `true` per filtrare alle Skills evidenziate
- `nonSuspiciousOnly` (opzionale): `true` per nascondere le Skills sospette (`flagged.suspicious`)
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
      "updatedAt": 1730000000000
    }
  ]
}
```

Note:

- I risultati vengono restituiti in ordine di pertinenza (similarità degli embedding + boost per token esatti di slug/nome + priorità di popolarità dai download).
- La pertinenza è più forte della popolarità. Una corrispondenza precisa di slug o token del nome visualizzato può superare una corrispondenza più ampia con molti più download.
- Il testo ASCII viene tokenizzato sui confini di parola e punteggiatura. Per esempio, `personal-map` contiene un token autonomo `map`, mentre `amap-jsapi-skill` contiene `amap`, `jsapi` e `skill`; cercare `map` quindi dà a `personal-map` una corrispondenza lessicale più forte rispetto a `amap-jsapi-skill`.
- I download vengono usati come piccola priorità su scala logaritmica e come criterio di spareggio, non come segnale principale di classificazione. Le Skills con molti download possono classificarsi più in basso quando il testo della query è una corrispondenza più debole.
- Uno stato di moderazione sospetto o nascosto può rimuovere una Skill dalla ricerca pubblica in base ai filtri del chiamante e allo stato di moderazione corrente.

Indicazioni di reperibilità per i publisher:

- Inserisci i termini che gli utenti cercheranno letteralmente nel nome visualizzato, nel riepilogo e nei tag. Usa un token di slug autonomo solo quando è anche un'identità stabile che vuoi mantenere.
- Non rinominare uno slug solo per inseguire una query, a meno che il nuovo slug sia un nome canonico migliore a lungo termine. I vecchi slug diventano alias di reindirizzamento, ma l'URL canonico, lo slug visualizzato e i futuri digest di ricerca usano il nuovo slug.
- Gli alias di rinomina preservano la risoluzione per vecchi URL e installazioni che vengono risolti tramite il registro, ma il ranking di ricerca si basa sui metadati canonici della Skill dopo che la rinomina è stata indicizzata. Le statistiche esistenti restano con la Skill.
- Se una Skill è inaspettatamente invisibile, controlla prima lo stato di moderazione con `clawhub inspect <slug>` dopo aver effettuato l'accesso, prima di modificare metadati correlati al ranking.

### `GET /api/v1/skills`

Parametri di query:

- `limit` (opzionale): intero (1–200)
- `cursor` (opzionale): cursore di paginazione per qualsiasi ordinamento diverso da `trending`
- `sort` (opzionale): `updated` (predefinito), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (opzionale): `true` per nascondere le Skills sospette (`flagged.suspicious`)
- `nonSuspicious` (opzionale): alias legacy per `nonSuspiciousOnly`

Note:

- `trending` classifica in base alle installazioni negli ultimi 7 giorni (basato sulla telemetria).
- `createdAt` è stabile per le scansioni di nuove Skill; `updated` cambia quando Skills esistenti vengono ripubblicate.
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

- I vecchi slug creati dai flussi di rinomina/unione dell'owner vengono risolti alla Skill canonica.
- `metadata.os`: restrizioni OS dichiarate nel frontmatter della Skill (ad es. `["macos"]`, `["linux"]`). `null` se non dichiarato.
- `metadata.systems`: target di sistema Nix (ad es. `["aarch64-darwin", "x86_64-linux"]`). `null` se non dichiarato.
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

- Owner e moderatori possono accedere ai dettagli di moderazione per le Skills nascoste.
- I chiamanti pubblici ricevono `200` solo per Skills visibili già contrassegnate.
- Le prove vengono oscurate per i chiamanti pubblici e includono snippet grezzi solo per owner/moderatori.

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

### `POST /api/v1/skills/{slug}/appeal`

Endpoint per owner/publisher di Skill per presentare ricorso contro la moderazione su una Skill.

Autenticazione:

- Richiede un token API per l'owner della Skill o un membro del publisher.

Richiesta:

```json
{ "version": "1.2.3", "message": "The flagged command is documented setup." }
```

I ricorsi sono accettati per esiti di Skill nascoste, rimosse, sospette, malevole o
contrassegnate dallo scanner. ClawHub mantiene un ricorso aperto per Skill.

Risposta:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "skillAppeals:...",
  "skillId": "skills:...",
  "status": "open"
}
```

### `POST /api/v1/skills/{slug}/rescan`

Richiede una nuova scansione di sicurezza per l'ultima versione pubblicata della Skill.

Autenticazione:

- Richiede un token API per l'owner della Skill, un amministratore del publisher, un moderatore
  della piattaforma o un amministratore della piattaforma.
- Owner e amministratori del publisher sono soggetti al limite di recupero dell'owner
  per versione. Moderatori e amministratori della piattaforma non lo sono, ma ClawHub consente comunque solo
  una nuova scansione attiva per versione.

Risposta:

```json
{
  "ok": true,
  "targetKind": "skill",
  "name": "gifgrep",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/skills/-/reports`

Endpoint moderatore/amministratore per l'acquisizione delle segnalazioni delle Skill.

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

Endpoint moderatore/amministratore per risolvere o riaprire segnalazioni delle Skill.

Richiesta:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` è obbligatorio per `confirmed` e `dismissed`; può essere omesso quando
si reimposta `status` su `open`. Passa `finalAction: "hide"` con una segnalazione
triaged per nascondere la Skill nello stesso workflow verificabile.

### `GET /api/v1/skills/-/appeals`

Endpoint moderatore/amministratore per l'acquisizione dei ricorsi delle Skill.

Parametri di query:

- `status` (opzionale): `open` (predefinito), `accepted`, `rejected` o `all`
- `limit` (opzionale): intero (1-200)
- `cursor` (opzionale): cursore di paginazione

### `POST /api/v1/skills/-/appeals/{appealId}/resolve`

Endpoint moderatore/amministratore per accettare, rifiutare o riaprire un ricorso di una Skill.
`note` è obbligatorio per `accepted` e `rejected`; può essere omesso quando si reimposta
`status` su `open`. Passa `finalAction: "restore"` con un ricorso accettato
per rendere nuovamente disponibile la Skill.

### `GET /api/v1/skills/{slug}/versions`

Parametri di query:

- `limit` (opzionale): intero
- `cursor` (opzionale): cursore di paginazione

### `GET /api/v1/skills/{slug}/versions/{version}`

Restituisce i metadati della versione + l'elenco dei file.

- `version.security` include lo stato di verifica della scansione normalizzato e i dettagli dello scanner
  (VirusTotal + LLM), quando disponibili.

### `GET /api/v1/skills/{slug}/scan`

Restituisce i dettagli di verifica della scansione di sicurezza per una versione di skill.

Parametri di query:

- `version` (opzionale): stringa di versione specifica.
- `tag` (opzionale): risolve una versione con tag (ad esempio `latest`).

Note:

- Se non viene fornito né `version` né `tag`, usa la versione più recente.
- Include lo stato di verifica normalizzato più i dettagli specifici dello scanner.
- `security.capabilityTags` include etichette deterministiche di capacità/rischio come
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` e `posts-externally` quando rilevate.
- `security.hasScanResult` è `true` solo quando uno scanner ha prodotto un verdetto definitivo (`clean`, `suspicious` o `malicious`).
- `moderation` è uno snapshot corrente della moderazione a livello di skill derivato dalla versione più recente.
- Quando interroghi una versione storica, controlla `moderation.matchesRequestedVersion` e `moderation.sourceVersion` prima di trattare `moderation` e `security` come lo stesso contesto di versione.

### `GET /api/v1/skills/{slug}/file`

Restituisce contenuto di testo non elaborato.

Parametri di query:

- `path` (obbligatorio)
- `version` (opzionale)
- `tag` (opzionale)

Note:

- Usa per impostazione predefinita la versione più recente.
- Limite dimensione file: 200KB.

### `GET /api/v1/packages`

Endpoint di catalogo unificato per:

- skill
- plugin di codice
- plugin bundle

Parametri di query:

- `limit` (opzionale): intero (1–100)
- `cursor` (opzionale): cursore di paginazione
- `family` (opzionale): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (opzionale): `official`, `community` o `private`
- `isOfficial` (opzionale): `true` o `false`
- `executesCode` (opzionale): `true` o `false`
- `capabilityTag` (opzionale): filtro capacità per i pacchetti plugin
- `target` / `hostTarget` (opzionale): abbreviazione per `host:<target>`
- `os`, `arch`, `libc` (opzionale): abbreviazione per filtri di capacità host
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (opzionale): abbreviazione `true`/`1` per tag di requisito dell'ambiente
- `externalService`, `binary`, `osPermission` (opzionale): abbreviazione per tag di requisito dell'ambiente denominati
- `artifactKind` (opzionale): `legacy-zip` o `npm-pack`
- `npmMirror` (opzionale): `true`/`1` per mostrare le versioni dei pacchetti basate su ClawPack
  disponibili tramite il mirror npm

Note:

- `GET /api/v1/code-plugins` e `GET /api/v1/bundle-plugins` rimangono alias a famiglia fissa.
- Le voci delle skill restano supportate dal registro delle skill e possono comunque essere pubblicate solo tramite `POST /api/v1/skills`.
- `POST /api/v1/packages` è ancora solo per rilasci di code-plugin e bundle-plugin.
- I chiamanti anonimi vedono solo i canali pubblici dei pacchetti.
- I chiamanti autenticati possono vedere nei risultati di elenco/ricerca i pacchetti privati degli editori a cui appartengono.
- `channel=private` restituisce solo i pacchetti che il chiamante autenticato può leggere.

### `GET /api/v1/packages/search`

Ricerca nel catalogo unificato tra skill + pacchetti plugin.

Parametri di query:

- `q` (obbligatorio): stringa di ricerca
- `limit` (opzionale): intero (1–100)
- `family` (opzionale): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (opzionale): `official`, `community` o `private`
- `isOfficial` (opzionale): `true` o `false`
- `executesCode` (opzionale): `true` o `false`
- `capabilityTag` (opzionale): filtro capacità per i pacchetti plugin
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` e
  `osPermission` sono accettati come abbreviazioni per tag di capacità comuni
- `artifactKind` (opzionale): `legacy-zip` o `npm-pack`
- `npmMirror` (opzionale): `true`/`1` per cercare versioni di pacchetti basate su ClawPack
  disponibili tramite il mirror npm

Note:

- I chiamanti anonimi vedono solo i canali pubblici dei pacchetti.
- I chiamanti autenticati possono cercare pacchetti privati per gli editori a cui appartengono.
- `channel=private` restituisce solo i pacchetti che il chiamante autenticato può leggere.
- I filtri degli artefatti sono basati su tag di capacità indicizzati:
  `artifact:legacy-zip`, `artifact:npm-pack` e `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Restituisce i metadati di dettaglio del pacchetto.

Note:

- Le skill possono essere risolte anche tramite questa route nel catalogo unificato.
- I pacchetti privati restituiscono `404` a meno che il chiamante non possa leggere l'editore proprietario.

### `DELETE /api/v1/packages/{name}`

Elimina in modo soft un pacchetto e tutti i rilasci.

Note:

- Richiede un token API per il proprietario del pacchetto, un proprietario/admin dell'editore dell'organizzazione,
  moderatore della piattaforma o admin della piattaforma.

### `GET /api/v1/packages/{name}/versions`

Restituisce la cronologia delle versioni.

Parametri di query:

- `limit` (opzionale): intero (1–100)
- `cursor` (opzionale): cursore di paginazione

Note:

- I pacchetti privati restituiscono `404` a meno che il chiamante non possa leggere l'editore proprietario.

### `GET /api/v1/packages/{name}/versions/{version}`

Restituisce una versione del pacchetto, inclusi metadati dei file, compatibilità,
capacità, verifica, metadati dell'artefatto e dati di scansione.

Note:

- `version.artifact.kind` è `legacy-zip` per gli archivi di pacchetti del vecchio sistema o
  `npm-pack` per i rilasci basati su ClawPack.
- I rilasci ClawPack includono campi compatibili con npm `npmIntegrity`, `npmShasum` e
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` e `version.staticScan` sono inclusi quando esistono dati di scansione.
- I pacchetti privati restituiscono `404` a meno che il chiamante non possa leggere l'editore proprietario.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Restituisce i metadati espliciti del resolver dell'artefatto per una versione del pacchetto.

Note:

- Le versioni di pacchetti legacy restituiscono un artefatto `legacy-zip` e un
  `downloadUrl` ZIP legacy.
- Le versioni ClawPack restituiscono un artefatto `npm-pack`, campi di integrità npm, un
  `tarballUrl` e l'URL di compatibilità ZIP legacy.
- Questa è la superficie del resolver OpenClaw; evita di dedurre il formato dell'archivio da
  un URL condiviso.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Scarica l'artefatto della versione tramite il percorso esplicito del resolver.

Note:

- Le versioni ClawPack trasmettono in streaming i byte esatti `.tgz` npm-pack caricati.
- Le versioni ZIP legacy reindirizzano a `/api/v1/packages/{name}/download?version=`.
- Usa il bucket del limite di frequenza per i download.

### `GET /api/v1/packages/{name}/readiness`

Restituisce la readiness calcolata per il consumo futuro da parte di OpenClaw.

I controlli di readiness coprono:

- stato del canale ufficiale
- disponibilità della versione più recente
- disponibilità dell'artefatto npm-pack ClawPack
- digest dell'artefatto
- provenienza del repository sorgente e del commit
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

Endpoint moderatore per elencare le righe di migrazione dei plugin ufficiali OpenClaw.

Autenticazione:

- Richiede un token API per un utente moderatore o admin.

Parametri di query:

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

Endpoint admin per creare o aggiornare una riga di migrazione di un plugin ufficiale.

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
- `packageName` è normalizzato come nome npm; il pacchetto può mancare per le migrazioni
  pianificate.
- Questo traccia solo la readiness della migrazione. Non modifica OpenClaw né genera
  ClawPack.

### `GET /api/v1/packages/moderation/queue`

Endpoint moderatore/admin per le code di revisione dei rilasci dei pacchetti.

Autenticazione:

- Richiede un token API per un utente moderatore o admin.

Parametri di query:

- `status` (opzionale): `open` (predefinito), `blocked`, `manual` o `all`
- `limit` (opzionale): intero (1-100)
- `cursor` (opzionale): cursore di paginazione

Significato degli stati:

- `open`: rilasci sospetti, malevoli, in sospeso, in quarantena, revocati o segnalati.
- `blocked`: rilasci in quarantena, revocati o malevoli.
- `manual`: qualsiasi rilascio con un override manuale di moderazione.
- `all`: qualsiasi rilascio con un override manuale, stato di scansione non pulito o segnalazione del pacchetto.

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

Segnala un pacchetto per la revisione da parte dei moderatori. Le segnalazioni sono a livello di pacchetto, opzionalmente
collegate a una versione. Alimentano la coda di moderazione ma non nascondono automaticamente né
bloccano i download da sole; i moderatori devono usare la moderazione dei rilasci per
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

### `POST /api/v1/packages/{name}/appeal`

Endpoint per proprietario/editore del pacchetto per presentare ricorso contro la moderazione di un rilascio.

Autenticazione:

- Richiede un token API per il proprietario del pacchetto o un membro dell'editore.

Richiesta:

```json
{
  "version": "1.2.3",
  "message": "The native binary is signed and matches the linked source release."
}
```

I ricorsi sono accettati solo per rilasci in quarantena, revocati,
sospetti o malevoli. ClawHub mantiene un ricorso aperto per rilascio.

Risposta:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "open"
}
```

### `POST /api/v1/packages/{name}/rescan`

Richiede una nuova scansione di sicurezza per l'ultima release del pacchetto pubblicata.

Autenticazione:

- Richiede un token API per il proprietario del pacchetto, l'amministratore del publisher, il
  moderatore della piattaforma o l'amministratore della piattaforma.
- I proprietari e gli amministratori dei publisher sono soggetti al limite di
  ripristino del proprietario per release. I moderatori e gli amministratori della piattaforma non lo sono, ma ClawHub consente comunque solo
  una nuova scansione attiva per release.

Risposta:

```json
{
  "ok": true,
  "targetKind": "package",
  "name": "@openclaw/example-plugin",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/packages/appeals`

Endpoint per moderatori/amministratori per l'acquisizione degli appelli sui pacchetti.

Autenticazione:

- Richiede un token API per un utente moderatore o amministratore.

Parametri di query:

- `status` (opzionale): `open` (predefinito), `accepted`, `rejected` o `all`
- `limit` (opzionale): intero (1-100)
- `cursor` (opzionale): cursore di paginazione

Risposta:

```json
{
  "items": [
    {
      "appealId": "packageAppeals:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "message": "The native binary is signed.",
      "status": "open",
      "createdAt": 1730000000000,
      "submitter": {
        "userId": "users:...",
        "handle": "publisher",
        "displayName": "Publisher"
      },
      "resolvedAt": null,
      "resolvedBy": null,
      "resolutionNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/appeals/{appealId}/resolve`

Endpoint per moderatori/amministratori per accettare, rifiutare o riaprire un appello.

Richiesta:

```json
{ "status": "accepted", "note": "False positive confirmed.", "finalAction": "approve" }
```

`note` è obbligatorio per `accepted` e `rejected`; può essere omesso quando
si reimposta `status` su `open`. Passa `finalAction: "approve"` con un appello accettato
per approvare la release interessata nello stesso flusso di lavoro verificabile.

Risposta:

```json
{
  "ok": true,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "rejected"
}
```

### `GET /api/v1/packages/reports`

Endpoint per moderatori/amministratori per l'acquisizione delle segnalazioni sui pacchetti.

Autenticazione:

- Richiede un token API per un utente moderatore o amministratore.

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

Endpoint per proprietari/moderatori per la visibilità della moderazione dei pacchetti.

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

Endpoint per moderatori/amministratori per risolvere o riaprire le segnalazioni sui pacchetti.

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

Endpoint per moderatori/amministratori per la revisione delle release dei pacchetti.

Richiesta:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Stati supportati:

- `approved`: esaminata manualmente e consentita.
- `quarantined`: bloccata in attesa di follow-up.
- `revoked`: bloccata dopo che una release era stata precedentemente considerata attendibile.

Le release in quarantena e revocate restituiscono `403` dalle route di download degli artefatti.
Ogni modifica scrive una voce nel log di audit.

### `POST /api/v1/packages/backfill/artifacts`

Endpoint di manutenzione riservato agli amministratori per etichettare le release dei pacchetti più vecchie con
metadati espliciti sul tipo di artefatto.

Corpo della richiesta:

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

Risposta:

```json
{
  "ok": true,
  "scanned": 100,
  "updated": 12,
  "nextCursor": "cursor...",
  "done": false,
  "dryRun": true
}
```

Note:

- Il comportamento predefinito è dry-run.
- Le release senza storage ClawPack sono etichettate come `legacy-zip`.
- Le righe esistenti basate su ClawPack prive di `artifactKind` vengono riparate come
  `npm-pack`.
- Questo non genera ClawPack né modifica i byte degli artefatti.

### `GET /api/v1/packages/{name}/file`

Restituisce il contenuto di testo non elaborato di un file del pacchetto.

Parametri di query:

- `path` (obbligatorio)
- `version` (opzionale)
- `tag` (opzionale)

Note:

- Il valore predefinito è l'ultima release.
- Usa il bucket della frequenza di lettura, non il bucket di download.
- I file binari restituiscono `415`.
- Limite di dimensione del file: 200KB.
- Le scansioni VirusTotal in sospeso non bloccano le letture; le release malevole possono comunque essere trattenute altrove.
- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.

### `GET /api/v1/packages/{name}/download`

Scarica l'archivio ZIP deterministico legacy per una release del pacchetto.

Parametri di query:

- `version` (opzionale)
- `tag` (opzionale)

Note:

- Il valore predefinito è l'ultima release.
- Skills reindirizza a `GET /api/v1/download`.
- Gli archivi di Plugin/pacchetti sono file zip con una radice `package/` affinché i vecchi client OpenClaw
  continuino a funzionare.
- Questa route rimane solo ZIP. Non trasmette in streaming file ClawPack `.tgz`.
- Le risposte includono gli header `ETag`, `Digest`, `X-ClawHub-Artifact-Type` e
  `X-ClawHub-Artifact-Sha256` per i controlli di integrità del resolver.
- I metadati solo del registry non vengono inseriti nell'archivio scaricato.
- Le scansioni VirusTotal in sospeso non bloccano i download; le release malevole restituiscono `403`.
- I pacchetti privati restituiscono `404` a meno che il chiamante sia il proprietario.

### `GET /api/npm/{package}`

Restituisce un packument compatibile con npm per le versioni dei pacchetti basate su ClawPack.

Note:

- Sono elencate solo le versioni con tarball npm-pack ClawPack caricati.
- Le versioni legacy solo ZIP sono omesse intenzionalmente.
- `dist.tarball`, `dist.integrity` e `dist.shasum` usano campi compatibili con npm
  affinché gli utenti possano puntare npm al mirror se lo desiderano.
- I packument dei pacchetti scoped supportano sia `/api/npm/@scope/name` sia il percorso di richiesta
  codificato di npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Trasmette in streaming i byte esatti del tarball ClawPack caricato per i client mirror npm.

Note:

- Usa il bucket della frequenza di download.
- Gli header di download includono lo SHA-256 di ClawHub più i metadati integrity/shasum di npm.
- I controlli di moderazione e accesso ai pacchetti privati continuano ad applicarsi.

### `GET /api/v1/resolve`

Usato dalla CLI per associare un'impronta locale a una versione nota.

Parametri di query:

- `slug` (obbligatorio)
- `hash` (obbligatorio): sha256 esadecimale di 64 caratteri dell'impronta del bundle

Risposta:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Scarica uno zip di una versione di una skill.

Parametri di query:

- `slug` (obbligatorio)
- `version` (opzionale): stringa semver
- `tag` (opzionale): nome del tag (ad es. `latest`)

Note:

- Se non viene fornito né `version` né `tag`, viene usata l'ultima versione.
- Le versioni eliminate in modo reversibile restituiscono `410`.
- Le statistiche di download vengono conteggiate come identità univoche per ora (`userId` quando il token API è valido, altrimenti IP).

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
- Campo payload opzionale: `ownerHandle`. Quando presente, l'API risolve quel
  publisher lato server e richiede che l'attore abbia accesso al publisher.
- Campo payload opzionale: `migrateOwner`. Quando `true` con `ownerHandle`, una
  skill esistente può essere spostata a quel proprietario se l'attore è amministratore/proprietario sia sul
  publisher corrente sia su quello di destinazione. Senza questa adesione esplicita, le modifiche del proprietario vengono
  rifiutate.

### `POST /api/v1/packages`

Pubblica una release code-plugin o bundle-plugin.

- Richiede l'autenticazione con token Bearer.
- Preferito: `multipart/form-data` con JSON `payload` + blob `files[]`.
- È accettato anche il corpo JSON con `files` (basati su storageId).
- Campo payload opzionale: `ownerHandle`. Quando presente, solo gli amministratori possono pubblicare per conto di quel proprietario.

Punti principali della validazione:

- `family` deve essere `code-plugin` o `bundle-plugin`.
- I pacchetti Plugin richiedono `openclaw.plugin.json`. I caricamenti ClawPack `.tgz` devono
  contenerlo in `package/openclaw.plugin.json`.
- I code plugin richiedono `package.json`, metadati del repository sorgente, metadati del commit sorgente,
  metadati dello schema di configurazione, `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` e `openclaw.environment` sono metadati opzionali.
- Solo i publisher attendibili possono pubblicare nel canale `official`.
- Le pubblicazioni per conto di altri validano comunque l'idoneità al canale ufficiale rispetto all'account proprietario di destinazione.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Elimina in modo reversibile / ripristina una skill (proprietario, moderatore o amministratore).

Corpo JSON opzionale:

```json
{ "reason": "Held for moderation pending legal review." }
```

Quando presente, `reason` viene memorizzato come nota di moderazione della skill e copiato nel log di audit.
Le eliminazioni reversibili avviate dal proprietario riservano lo slug per 30 giorni, poi lo slug può essere rivendicato da
un altro publisher. La risposta di eliminazione include `slugReservedUntil` quando si applica questa scadenza.
Gli occultamenti e le rimozioni di sicurezza da parte di moderatori/amministratori non scadono in questo modo.

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

Solo amministratori. Garantisce l'esistenza di un publisher di organizzazione per un handle. Se l'handle punta ancora a un
publisher utente/personale condiviso legacy, l'endpoint lo migra prima in un publisher di organizzazione.

- Corpo: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Risposta: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Solo amministratori. Riserva slug radice e nomi di pacchetti per un proprietario legittimo senza pubblicare una
release. I nomi dei pacchetti diventano pacchetti segnaposto privati senza righe di release, così lo stesso
proprietario potrà in seguito pubblicare la vera release code-plugin o bundle-plugin con quel nome.

- Corpo: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Risposta: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

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
- `merge` nasconde l'elenco sorgente e reindirizza lo slug sorgente all'elenco di destinazione.

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

Bandisce un utente ed elimina definitivamente le skill di sua proprietà (solo moderatore/amministratore).

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

Revoca il ban di un utente e ripristina le skill idonee (solo amministratore).

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

Parametri di query:

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

Aggiunge/rimuove una stella (highlight). Entrambi gli endpoint sono idempotenti.

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
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Consulta `DEPRECATIONS.md` per il piano di rimozione.

## Rilevamento del registry (`/.well-known/clawhub.json`)

La CLI può rilevare le impostazioni di registry/autenticazione dal sito:

- `/.well-known/clawhub.json` (JSON, preferito)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Se usi il self-hosting, servi questo file (oppure imposta `CLAWHUB_REGISTRY` esplicitamente; legacy `CLAWDHUB_REGISTRY`).
