---
read_when:
    - Aggiunta/modifica degli endpoint
    - Debug delle richieste CLI ↔ registro
summary: Riferimento API HTTP (endpoint pubblici + endpoint CLI + autenticazione).
x-i18n:
    generated_at: "2026-05-12T12:48:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# API HTTP

URL di base: `https://clawhub.ai` (predefinito).

Tutti i percorsi v1 sono sotto `/api/v1/...`.
I percorsi legacy `/api/...` e `/api/cli/...` restano per compatibilità (vedi `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Riutilizzo del catalogo pubblico

Le directory di terze parti possono usare gli endpoint di lettura pubblici per elencare o cercare le Skills di ClawHub. Memorizzare i risultati nella cache, rispettare `429`/`Retry-After`, collegare gli utenti alla voce ClawHub canonica (`https://clawhub.ai/<owner>/<slug>`) ed evitare di implicare un'approvazione di ClawHub per il sito di terze parti. Non tentare di replicare contenuti nascosti, privati o bloccati dalla moderazione al di fuori della superficie API pubblica.

Le scorciatoie degli slug web si risolvono tra famiglie di registri, ma i client API dovrebbero usare
gli URL canonici restituiti dagli endpoint di lettura invece di ricostruire la precedenza
delle route.

## Limiti di frequenza

Modello di applicazione:

- Richieste anonime: applicate per IP.
- Richieste autenticate (token Bearer valido): applicate per bucket utente.
- Se il token è mancante/non valido, il comportamento ricade sull'applicazione per IP.
- Gli endpoint di scrittura autenticati non dovrebbero restituire un semplice `Unauthorized` quando
  il server conosce il motivo. Token mancanti, token non validi/revocati e
  account eliminati/bannati/disabilitati dovrebbero ciascuno ricevere testo utilizzabile così che i client
  CLI possano indicare agli utenti cosa li ha bloccati.

- Lettura: 600/min per IP, 2400/min per chiave
- Scrittura: 45/min per IP, 180/min per chiave
- Download: 30/min per IP, 180/min per chiave (`/api/v1/download`)

Header:

- Compatibilità legacy: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Standardizzati: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Su `429`: `Retry-After`

Semantica degli header:

- `X-RateLimit-Reset`: secondi epoch Unix assoluti
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

Indicazioni per i client:

- Se `Retry-After` esiste, attendere quel numero di secondi prima di riprovare.
- Usare backoff con jitter per evitare tentativi sincronizzati.
- Se `Retry-After` manca, ripiegare su `RateLimit-Reset` (o calcolare da `X-RateLimit-Reset`).

Sorgente IP:

- Usa `cf-connecting-ip` (Cloudflare) per l'IP client per impostazione predefinita.
- ClawHub usa header di inoltro attendibili per identificare gli IP client all'edge.
- Se non è disponibile alcun IP client attendibile, le richieste di download anonime usano un bucket di fallback circoscritto all'endpoint invece di un unico bucket globale `ip:unknown`. Le richieste anonime di lettura/scrittura usano ancora il bucket sconosciuto condiviso, così il routing con IP mancante resta visibile e prudente.

## Endpoint pubblici (senza auth)

### `GET /api/v1/search`

Parametri di query:

- `q` (obbligatorio): stringa di query
- `limit` (facoltativo): intero
- `highlightedOnly` (facoltativo): `true` per filtrare alle Skills evidenziate
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
      "updatedAt": 1730000000000
    }
  ]
}
```

Note:

- I risultati vengono restituiti in ordine di rilevanza (similarità degli embedding + boost dei token esatti di slug/nome + prior di popolarità dai download).
- La rilevanza è più forte della popolarità. Una corrispondenza precisa dello slug o del token del nome visualizzato può superare una corrispondenza più generica con molti più download.
- Il testo ASCII viene tokenizzato sui confini di parole e punteggiatura. Per esempio, `personal-map` contiene un token autonomo `map`, mentre `amap-jsapi-skill` contiene `amap`, `jsapi` e `skill`; quindi la ricerca di `map` dà a `personal-map` una corrispondenza lessicale più forte rispetto a `amap-jsapi-skill`.
- I download sono usati come piccolo prior scalato logaritmicamente e criterio di spareggio, non come segnale di ranking principale. Le Skills con molti download possono posizionarsi più in basso quando il testo della query ha una corrispondenza più debole.
- Uno stato di moderazione sospetto o nascosto può rimuovere una skill dalla ricerca pubblica a seconda dei filtri del chiamante e dello stato di moderazione corrente.

Indicazioni di individuabilità per i publisher:

- Inserire i termini che gli utenti cercheranno letteralmente nel nome visualizzato, nel riepilogo e nei tag. Usare un token slug autonomo solo quando è anche un'identità stabile che si vuole mantenere.
- Non rinominare uno slug solo per inseguire una query, a meno che il nuovo slug sia un nome canonico migliore a lungo termine. I vecchi slug diventano alias di reindirizzamento, ma l'URL canonico, lo slug visualizzato e i digest di ricerca futuri usano il nuovo slug.
- Gli alias di rinomina preservano la risoluzione per i vecchi URL e le installazioni che si risolvono tramite il registro, ma il ranking di ricerca si basa sui metadati canonici della skill dopo che la rinomina è stata indicizzata. Le statistiche esistenti restano con la skill.
- Se una skill è inaspettatamente invisibile, controllare prima lo stato di moderazione con `clawhub inspect <slug>` dopo aver effettuato l'accesso, prima di modificare metadati relativi al ranking.

### `GET /api/v1/skills`

Parametri di query:

- `limit` (facoltativo): intero (1-200)
- `cursor` (facoltativo): cursore di paginazione per qualsiasi ordinamento non `trending`
- `sort` (facoltativo): `updated` (predefinito), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), `installsCurrent` (alias: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (facoltativo): `true` per nascondere Skills sospette (`flagged.suspicious`)
- `nonSuspicious` (facoltativo): alias legacy per `nonSuspiciousOnly`

Note:

- `trending` ordina per installazioni negli ultimi 7 giorni (basato sulla telemetria).
- `createdAt` è stabile per le scansioni di nuove skill; `updated` cambia quando le skill esistenti vengono ripubblicate.
- Quando `nonSuspiciousOnly=true`, gli ordinamenti basati su cursore possono restituire meno di `limit` elementi in una pagina perché le Skills sospette vengono filtrate dopo il recupero della pagina.
- Usare `nextCursor` per continuare la paginazione quando presente. Una pagina breve non significa di per sé fine dei risultati.

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

- I vecchi slug creati da flussi di rinomina/unione del proprietario si risolvono alla skill canonica.
- `metadata.os`: restrizioni OS dichiarate nel frontmatter della skill (per esempio `["macos"]`, `["linux"]`). `null` se non dichiarate.
- `metadata.systems`: target di sistema Nix (per esempio `["aarch64-darwin", "x86_64-linux"]`). `null` se non dichiarati.
- `metadata` è `null` se la skill non ha metadati di piattaforma.
- `moderation` è incluso solo quando la skill è contrassegnata o il proprietario la sta visualizzando.

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
- I chiamanti pubblici ricevono `200` solo per Skills visibili già contrassegnate.
- Le prove vengono redatte per i chiamanti pubblici e includono snippet grezzi solo per proprietari/moderatori.

### `POST /api/v1/skills/{slug}/report`

Segnala una skill per revisione da parte dei moderatori. Le segnalazioni sono a livello di skill, facoltativamente collegate
a una versione, e alimentano la coda delle segnalazioni di skill.

Auth:

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

Endpoint moderatore/admin per l'acquisizione delle segnalazioni di skill.

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

Endpoint moderatore/admin per risolvere o riaprire le segnalazioni di skill.

Richiesta:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` è obbligatorio per `confirmed` e `dismissed`; può essere omesso quando
si imposta di nuovo `status` su `open`. Passare `finalAction: "hide"` con una segnalazione
triaged per nascondere la skill nello stesso workflow verificabile.

### `GET /api/v1/skills/{slug}/versions`

Parametri di query:

- `limit` (facoltativo): intero
- `cursor` (facoltativo): cursore di paginazione

### `GET /api/v1/skills/{slug}/versions/{version}`

Restituisce i metadati della versione + l'elenco dei file.

- `version.security` include lo stato di verifica della scansione normalizzato e i dettagli dello scanner
  (VirusTotal + LLM), quando disponibili.

### `GET /api/v1/skills/{slug}/scan`

Restituisce i dettagli di verifica della scansione di sicurezza per una versione della skill.

Parametri di query:

- `version` (facoltativo): stringa di versione specifica.
- `tag` (facoltativo): risolve una versione con tag (per esempio `latest`).

Note:

- Se non viene fornito né `version` né `tag`, usa la versione più recente.
- Include lo stato di verifica normalizzato più dettagli specifici dello scanner.
- `security.capabilityTags` include etichette deterministiche di capacità/rischio come
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` e `posts-externally` quando rilevate.
- `security.hasScanResult` è `true` solo quando uno scanner ha prodotto un verdetto definitivo (`clean`, `suspicious` o `malicious`).
- `moderation` è uno snapshot corrente della moderazione a livello di skill derivato dalla versione più recente.
- Quando si interroga una versione storica, controllare `moderation.matchesRequestedVersion` e `moderation.sourceVersion` prima di trattare `moderation` e `security` come lo stesso contesto di versione.

### `GET /api/v1/skills/{slug}/file`

Restituisce il contenuto testuale grezzo.

Parametri di query:

- `path` (obbligatorio)
- `version` (facoltativo)
- `tag` (facoltativo)

Note:

- Il valore predefinito è la versione più recente.
- Limite dimensione file: 200KB.

### `GET /api/v1/packages`

Endpoint di catalogo unificato per:

- Skills
- Plugin di codice
- Plugin bundle

Parametri di query:

- `limit` (facoltativo): numero intero (1–100)
- `cursor` (facoltativo): cursore di paginazione
- `family` (facoltativo): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (facoltativo): `official`, `community` o `private`
- `isOfficial` (facoltativo): `true` o `false`
- `executesCode` (facoltativo): `true` o `false`
- `capabilityTag` (facoltativo): filtro di capacità per i pacchetti Plugin
- `target` / `hostTarget` (facoltativo): abbreviazione per `host:<target>`
- `os`, `arch`, `libc` (facoltativo): abbreviazione per i filtri delle capacità dell'host
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (facoltativo): abbreviazione `true`/`1` per i tag dei requisiti di ambiente
- `externalService`, `binary`, `osPermission` (facoltativo): abbreviazione per i tag
  dei requisiti di ambiente denominati
- `artifactKind` (facoltativo): `legacy-zip` o `npm-pack`
- `npmMirror` (facoltativo): `true`/`1` per mostrare le versioni dei pacchetti basate su ClawPack
  disponibili tramite il mirror npm

Note:

- `GET /api/v1/code-plugins` e `GET /api/v1/bundle-plugins` restano alias a famiglia fissa.
- Le voci Skill restano basate sul registro degli skill e possono comunque essere pubblicate solo tramite `POST /api/v1/skills`.
- `POST /api/v1/packages` è ancora solo per le release code-plugin e bundle-plugin.
- I chiamanti anonimi vedono solo i canali di pacchetti pubblici.
- I chiamanti autenticati possono vedere nei risultati di elenco/ricerca i pacchetti privati degli editori a cui appartengono.
- `channel=private` restituisce solo i pacchetti che il chiamante autenticato può leggere.

### `GET /api/v1/packages/search`

Ricerca unificata del catalogo tra Skills e pacchetti Plugin.

Parametri di query:

- `q` (obbligatorio): stringa di query
- `limit` (facoltativo): numero intero (1–100)
- `family` (facoltativo): `skill`, `code-plugin` o `bundle-plugin`
- `channel` (facoltativo): `official`, `community` o `private`
- `isOfficial` (facoltativo): `true` o `false`
- `executesCode` (facoltativo): `true` o `false`
- `capabilityTag` (facoltativo): filtro di capacità per i pacchetti Plugin
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` e
  `osPermission` sono accettati come abbreviazioni per i tag di capacità comuni
- `artifactKind` (facoltativo): `legacy-zip` o `npm-pack`
- `npmMirror` (facoltativo): `true`/`1` per cercare le versioni dei pacchetti basate su ClawPack
  disponibili tramite il mirror npm

Note:

- I chiamanti anonimi vedono solo i canali di pacchetti pubblici.
- I chiamanti autenticati possono cercare pacchetti privati degli editori a cui appartengono.
- `channel=private` restituisce solo i pacchetti che il chiamante autenticato può leggere.
- I filtri degli artefatti sono basati su tag di capacità indicizzati:
  `artifact:legacy-zip`, `artifact:npm-pack` e `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Restituisce i metadati dettagliati del pacchetto.

Note:

- Anche gli Skills possono essere risolti tramite questa rotta nel catalogo unificato.
- I pacchetti privati restituiscono `404` a meno che il chiamante non possa leggere l'editore proprietario.

### `DELETE /api/v1/packages/{name}`

Elimina in modo reversibile un pacchetto e tutte le release.

Note:

- Richiede un token API per il proprietario del pacchetto, un proprietario/amministratore dell'editore dell'organizzazione,
  un moderatore della piattaforma o un amministratore della piattaforma.

### `GET /api/v1/packages/{name}/versions`

Restituisce la cronologia delle versioni.

Parametri di query:

- `limit` (facoltativo): numero intero (1–100)
- `cursor` (facoltativo): cursore di paginazione

Note:

- I pacchetti privati restituiscono `404` a meno che il chiamante non possa leggere l'editore proprietario.

### `GET /api/v1/packages/{name}/versions/{version}`

Restituisce una versione del pacchetto, inclusi metadati dei file, compatibilità,
capacità, verifica, metadati dell'artefatto e dati di scansione.

Note:

- `version.artifact.kind` è `legacy-zip` per gli archivi di pacchetti precedenti o
  `npm-pack` per le release basate su ClawPack.
- Le release ClawPack includono i campi compatibili con npm `npmIntegrity`, `npmShasum` e
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
- Questa è la superficie del resolver OpenClaw; evita di indovinare il formato dell'archivio da
  un URL condiviso.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Scarica l'artefatto della versione tramite il percorso esplicito del resolver.

Note:

- Le versioni ClawPack trasmettono in streaming i byte esatti del `.tgz` npm-pack caricato.
- Le versioni ZIP legacy reindirizzano a `/api/v1/packages/{name}/download?version=`.
- Usa il bucket di limitazione della frequenza di download.

### `GET /api/v1/packages/{name}/readiness`

Restituisce la prontezza calcolata per il consumo futuro da parte di OpenClaw.

I controlli di prontezza coprono:

- stato del canale ufficiale
- disponibilità dell'ultima versione
- disponibilità dell'artefatto ClawPack npm-pack
- digest dell'artefatto
- repo sorgente e provenienza del commit
- metadati di compatibilità OpenClaw
- destinazioni host
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

- Richiede un token API per un utente moderatore o amministratore.

Parametri di query:

- `phase` (facoltativo): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` o
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

Endpoint amministratore per creare o aggiornare una riga di migrazione di un Plugin ufficiale.

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

- `bundledPluginId` viene normalizzato in minuscolo ed è la chiave stabile di upsert.
- `packageName` è normalizzato come nome npm; il pacchetto può mancare per le migrazioni
  pianificate.
- Tiene traccia solo della prontezza della migrazione. Non modifica OpenClaw né genera
  ClawPack.

### `GET /api/v1/packages/moderation/queue`

Endpoint per moderatori/amministratori per le code di revisione delle release dei pacchetti.

Autenticazione:

- Richiede un token API per un utente moderatore o amministratore.

Parametri di query:

- `status` (facoltativo): `open` (predefinito), `blocked`, `manual` o `all`
- `limit` (facoltativo): numero intero (1-100)
- `cursor` (facoltativo): cursore di paginazione

Significati degli stati:

- `open`: release sospette, malevole, in sospeso, in quarantena, revocate o segnalate.
- `blocked`: release in quarantena, revocate o malevole.
- `manual`: qualsiasi release con un override di moderazione manuale.
- `all`: qualsiasi release con un override manuale, stato di scansione non pulito o segnalazione del pacchetto.

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

Segnala un pacchetto per la revisione da parte dei moderatori. Le segnalazioni sono a livello di pacchetto,
facoltativamente collegate a una versione. Alimentano la coda di moderazione ma non nascondono automaticamente né
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

Endpoint per moderatori/amministratori per la ricezione delle segnalazioni dei pacchetti.

Autenticazione:

- Richiede un token API per un utente moderatore o amministratore.

Parametri di query:

- `status` (facoltativo): `open` (predefinito), `confirmed`, `dismissed` o `all`
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

- Richiede un token API per il proprietario del pacchetto, un membro dell'editore, un moderatore o
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

Endpoint per moderatori/amministratori per risolvere o riaprire le segnalazioni dei pacchetti.

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
`finalAction: "revoke"` con una segnalazione confermata per applicare la moderazione del rilascio nello
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

Endpoint per moderatori/amministratori per la revisione dei rilasci dei pacchetti.

Richiesta:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Stati supportati:

- `approved`: revisionato manualmente e consentito.
- `quarantined`: bloccato in attesa di follow-up.
- `revoked`: bloccato dopo che un rilascio era stato precedentemente considerato attendibile.

I rilasci in quarantena e revocati restituiscono `403` dalle route di download degli artifact.
Ogni modifica scrive una voce nel log di audit.

### `POST /api/v1/packages/backfill/artifacts`

Endpoint di manutenzione solo per amministratori per etichettare i rilasci di pacchetti più vecchi con
metadati espliciti sul tipo di artifact.

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

- Il valore predefinito è dry-run.
- I rilasci senza archiviazione ClawPack sono etichettati `legacy-zip`.
- Le righe esistenti basate su ClawPack prive di `artifactKind` vengono corrette come
  `npm-pack`.
- Questo non genera ClawPack né modifica i byte degli artifact.

### `GET /api/v1/packages/{name}/file`

Restituisce il contenuto testuale raw di un file del pacchetto.

Parametri di query:

- `path` (obbligatorio)
- `version` (facoltativo)
- `tag` (facoltativo)

Note:

- Il valore predefinito è l'ultimo rilascio.
- Usa il bucket di limitazione per lettura, non quello per download.
- I file binari restituiscono `415`.
- Limite di dimensione del file: 200KB.
- Le scansioni VirusTotal in sospeso non bloccano le letture; i rilasci dannosi possono comunque essere trattenuti altrove.
- I pacchetti privati restituiscono `404` a meno che il chiamante possa leggere il publisher proprietario.

### `GET /api/v1/packages/{name}/download`

Scarica l'archivio ZIP deterministico legacy per un rilascio di pacchetto.

Parametri di query:

- `version` (facoltativo)
- `tag` (facoltativo)

Note:

- Il valore predefinito è l'ultimo rilascio.
- Skills reindirizza a `GET /api/v1/download`.
- Gli archivi Plugin/pacchetto sono file zip con una radice `package/` in modo che i vecchi client OpenClaw
  continuino a funzionare.
- Questa route rimane solo ZIP. Non trasmette in streaming file ClawPack `.tgz`.
- Le risposte includono gli header `ETag`, `Digest`, `X-ClawHub-Artifact-Type` e
  `X-ClawHub-Artifact-Sha256` per i controlli di integrità del resolver.
- I metadati solo del registro non vengono iniettati nell'archivio scaricato.
- Le scansioni VirusTotal in sospeso non bloccano i download; i rilasci dannosi restituiscono `403`.
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

Trasmette in streaming i byte esatti del tarball ClawPack caricato per i client mirror npm.

Note:

- Usa il bucket di limitazione per download.
- Gli header di download includono SHA-256 ClawHub più i metadati npm integrity/shasum.
- I controlli di moderazione e accesso ai pacchetti privati si applicano comunque.

### `GET /api/v1/resolve`

Usato dalla CLI per mappare un fingerprint locale a una versione nota.

Parametri di query:

- `slug` (obbligatorio)
- `hash` (obbligatorio): sha256 esadecimale di 64 caratteri del fingerprint del bundle

Risposta:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Scarica uno zip di una versione di skill.

Parametri di query:

- `slug` (obbligatorio)
- `version` (facoltativo): stringa semver
- `tag` (facoltativo): nome del tag (ad es. `latest`)

Note:

- Se non viene fornito né `version` né `tag`, viene usata la versione più recente.
- Le versioni eliminate in modo reversibile restituiscono `410`.
- Le statistiche di download sono conteggiate come identità uniche per ora (`userId` quando il token API è valido, altrimenti IP).

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
  skill esistente può essere spostata a quel proprietario se l'attore è amministratore/proprietario su entrambi
  i publisher corrente e di destinazione. Senza questa opzione esplicita, le modifiche del proprietario vengono
  rifiutate.

### `POST /api/v1/packages`

Pubblica un rilascio code-plugin o bundle-plugin.

- Richiede autenticazione con token Bearer.
- Preferito: `multipart/form-data` con JSON `payload` + blob `files[]`.
- È accettato anche un corpo JSON con `files` (basato su storageId).
- Campo payload facoltativo: `ownerHandle`. Quando presente, solo gli amministratori possono pubblicare per conto di quel proprietario.

Punti principali della convalida:

- `family` deve essere `code-plugin` o `bundle-plugin`.
- I pacchetti Plugin richiedono `openclaw.plugin.json`. I caricamenti ClawPack `.tgz` devono
  contenerlo in `package/openclaw.plugin.json`.
- I code plugin richiedono `package.json`, metadati del repository sorgente, metadati del commit sorgente,
  metadati dello schema di configurazione, `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` e `openclaw.environment` sono metadati facoltativi.
- Solo i publisher attendibili possono pubblicare nel canale `official`.
- Le pubblicazioni per conto di altri convalidano comunque l'idoneità al canale ufficiale rispetto all'account proprietario di destinazione.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Elimina in modo reversibile / ripristina una skill (proprietario, moderatore o amministratore).

Corpo JSON facoltativo:

```json
{ "reason": "Held for moderation pending legal review." }
```

Quando presente, `reason` viene memorizzato come nota di moderazione della skill e copiato nel log di audit.
Le eliminazioni reversibili avviate dal proprietario riservano lo slug per 30 giorni, poi lo slug può essere rivendicato da
un altro publisher. La risposta di eliminazione include `slugReservedUntil` quando si applica questa scadenza.
Le rimozioni da parte di moderatore/amministratore e per sicurezza non scadono in questo modo.

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

Solo amministratori. Garantisce che esista un publisher di organizzazione per un handle. Se l'handle punta ancora a un
publisher utente/personale condiviso legacy, l'endpoint lo migra prima in un publisher di organizzazione.

- Corpo: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Risposta: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Solo amministratori. Riserva slug root e nomi di pacchetto per un proprietario legittimo senza pubblicare un
rilascio. I nomi di pacchetto diventano pacchetti segnaposto privati senza righe di rilascio, così lo stesso
proprietario può in seguito pubblicare il rilascio code-plugin o bundle-plugin reale con quel nome.

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

- Entrambi gli endpoint richiedono autenticazione con token API e funzionano solo per il proprietario della skill.
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

Bandisce un utente ed elimina definitivamente le skill possedute (solo moderatore/amministratore).

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

Rimuove il ban da un utente e ripristina le skill idonee (solo amministratore).

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

Aggiunge/rimuove una stella (in evidenza). Entrambi gli endpoint sono idempotenti.

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
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Vedi `DEPRECATIONS.md` per il piano di rimozione.

## Scoperta del registro (`/.well-known/clawhub.json`)

La CLI può scoprire le impostazioni di registro/autenticazione dal sito:

- `/.well-known/clawhub.json` (JSON, preferito)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Se fai self-hosting, servi questo file (oppure imposta `CLAWHUB_REGISTRY` esplicitamente; legacy `CLAWDHUB_REGISTRY`).
