---
read_when:
    - Pubblicazione delle Skills
    - Debug dei fallimenti di pubblicazione
summary: Formato della cartella Skill, file obbligatori, tipi di file consentiti, limiti.
x-i18n:
    generated_at: "2026-07-04T03:51:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Formato degli skill

## Su disco

Uno skill è una cartella.

Obbligatorio:

- `SKILL.md` (o `skill.md`; è accettato anche il legacy `skills.md`)

Facoltativo:

- qualsiasi file di supporto _basato su testo_ (vedi “File consentiti”)
- `.clawhubignore` (pattern da ignorare per la pubblicazione, legacy `.clawdhubignore`)
- `.gitignore` (anch’esso rispettato)

## Importazione da GitHub

L’importatore web di GitHub è più rigoroso della pubblicazione/sincronizzazione locale. Rileva solo
file `SKILL.md` o legacy `skills.md` in repository pubblici, non fork, di proprietà
dell’account GitHub autenticato. Non importa repository privati, fork,
repository archiviati/disabilitati o repository pubblici di terze parti.

Metadati di installazione locale (scritti dalla CLI):

- `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

Stato di installazione della workdir (scritto dalla CLI):

- `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)

## `SKILL.md`

- Markdown con frontmatter YAML facoltativo.
- Il server estrae i metadati dal frontmatter durante la pubblicazione.
- `description` viene usato come riepilogo dello skill nell’interfaccia utente/ricerca.

## Metadati frontmatter

I metadati dello skill sono dichiarati nel frontmatter YAML all’inizio del tuo `SKILL.md`. Questo indica al registro (e all’analisi di sicurezza) di cosa ha bisogno il tuo skill per essere eseguito.

### Frontmatter di base

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Metadati di runtime (`metadata.openclaw`)

Dichiara i requisiti di runtime del tuo skill sotto `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

Usa `requires.env` per le variabili d’ambiente che devono essere presenti prima che lo skill possa essere eseguito. Usa `envVars` quando ti servono metadati per singola variabile, incluse variabili facoltative con `required: false`.

### Riferimento completo dei campi

| Campo              | Tipo       | Descrizione                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variabili d’ambiente obbligatorie che il tuo skill si aspetta.                                                                               |
| `requires.bins`    | `string[]` | Binari CLI che devono essere tutti installati.                                                                                                |
| `requires.anyBins` | `string[]` | Binari CLI di cui almeno uno deve esistere.                                                                                                   |
| `requires.config`  | `string[]` | Percorsi dei file di configurazione letti dal tuo skill.                                                                                      |
| `primaryEnv`       | `string`   | La variabile d’ambiente della credenziale principale per il tuo skill.                                                                        |
| `envVars`          | `array`    | Dichiarazioni di variabili d’ambiente con `name`, `required` facoltativo e `description` facoltativa. Imposta `required: false` per variabili d’ambiente facoltative. |
| `always`           | `boolean`  | Se `true`, lo skill è sempre attivo (non serve installazione esplicita).                                                                      |
| `skillKey`         | `string`   | Sostituisce la chiave di invocazione dello skill.                                                                                             |
| `emoji`            | `string`   | Emoji visualizzata per lo skill.                                                                                                              |
| `homepage`         | `string`   | URL della homepage o della documentazione dello skill.                                                                                        |
| `os`               | `string[]` | Restrizioni di sistema operativo (ad es. `["macos"]`, `["linux"]`).                                                                           |
| `install`          | `array`    | Specifiche di installazione per le dipendenze (vedi sotto).                                                                                  |
| `nix`              | `object`   | Specifica del plugin Nix (vedi README).                                                                                                       |
| `config`           | `object`   | Specifica di configurazione Clawdbot (vedi README).                                                                                          |

### Specifiche di installazione

Se il tuo skill richiede dipendenze installate, dichiarale nell’array `install`:

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

Tipi di installazione supportati: `brew`, `node`, `go`, `uv`.

### Variabili d’ambiente facoltative

Dichiara le variabili d’ambiente facoltative sotto `metadata.openclaw.envVars` e imposta `required: false`. Non aggiungere voci facoltative a `requires.env`, perché `requires.env` significa che lo skill non può essere eseguito senza di esse.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### Perché è importante

L’analisi di sicurezza di ClawHub verifica che ciò che il tuo skill dichiara corrisponda a ciò che fa realmente. Se il tuo codice fa riferimento a `TODOIST_API_KEY` ma il frontmatter non la dichiara sotto `requires.env`, `primaryEnv` o `envVars`, l’analisi segnalerà una mancata corrispondenza dei metadati. Mantenere dichiarazioni accurate aiuta il tuo skill a superare la revisione e aiuta gli utenti a capire cosa stanno installando.

### Esempio: frontmatter completo

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## File consentiti

La pubblicazione accetta solo file “basati su testo”.

- L’elenco consentito delle estensioni si trova in `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- I file di script vengono comunque analizzati dopo il caricamento; i file PowerShell `.ps1`, `.psm1` e `.psd1` sono accettati come testo.
- I tipi di contenuto che iniziano con `text/` sono trattati come testo; più un piccolo elenco consentito (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limiti (lato server):

- Dimensione totale del bundle: 50 MB.
- Il testo per embedding include `SKILL.md` + fino a ~40 file non `.md` (limite best-effort).

## Slug

- Derivati dal nome della cartella per impostazione predefinita.
- Gli scope dei pacchetti devono corrispondere esattamente all’handle publisher di ClawHub. Gli handle publisher possono usare lettere minuscole, numeri, trattini, punti e underscore; devono iniziare e terminare con una lettera minuscola o un numero.
- Gli slug dei pacchetti devono essere minuscoli e sicuri per npm, per esempio `@example.tools/demo-plugin` o `demo-plugin`.

## Versionamento + tag

- Ogni pubblicazione crea una nuova versione (semver).
- I tag sono puntatori stringa a una versione; `latest` è usato comunemente.

## Licenza

- Tutti gli skill pubblicati su ClawHub sono concessi in licenza con `MIT-0`.
- Chiunque può usare, modificare e ridistribuire gli skill pubblicati, anche commercialmente.
- L’attribuzione non è richiesta.
- Non aggiungere termini di licenza in conflitto in `SKILL.md`; ClawHub non supporta override di licenza per singolo skill.

## Skill a pagamento

- ClawHub non supporta skill a pagamento, prezzi per singolo skill, paywall o condivisione dei ricavi.
- Non aggiungere metadati di prezzo a `SKILL.md`; non fanno parte del formato dello skill e non renderanno a pagamento uno skill pubblicato.
- Se il tuo skill si integra con un servizio di terze parti a pagamento, documenta chiaramente il costo esterno e l’account richiesto nelle istruzioni dello skill e nelle dichiarazioni env (`requires.env` per le variabili obbligatorie, oppure `envVars` con `required: false` per le variabili facoltative).
