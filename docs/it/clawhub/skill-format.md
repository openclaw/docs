---
read_when:
    - Pubblicazione delle Skills
    - Debug dei fallimenti di pubblicazione
summary: Formato della cartella Skills, file obbligatori, tipi di file consentiti, limiti.
x-i18n:
    generated_at: "2026-07-05T06:45:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Formato delle Skills

## Su disco

Una skill è una cartella.

Obbligatorio:

- `SKILL.md` (o `skill.md`; è accettato anche il legacy `skills.md`)

Opzionale:

- qualsiasi file _basato su testo_ di supporto (vedi “File consentiti”)
- `.clawhubignore` (pattern da ignorare per la pubblicazione, legacy `.clawdhubignore`)
- `.gitignore` (anch’esso rispettato)

## Importazione da GitHub

L’importatore GitHub web è più rigoroso rispetto a pubblicazione/sincronizzazione locali. Individua solo
file `SKILL.md` o legacy `skills.md` in repository pubblici, non fork, di proprietà
dell’account GitHub autenticato. Non importa repo privati, fork,
repo archiviati/disabilitati o repo pubblici di terze parti.

Metadati di installazione locale (scritti dalla CLI):

- `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

Stato di installazione della workdir (scritto dalla CLI):

- `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)

## `SKILL.md`

- Markdown con frontmatter YAML opzionale.
- Il server estrae i metadati dal frontmatter durante la pubblicazione.
- `description` viene usato come riepilogo della skill nell’interfaccia utente/ricerca.

## Metadati frontmatter

I metadati della skill vengono dichiarati nel frontmatter YAML all’inizio del tuo `SKILL.md`. Questo comunica al registro (e all’analisi di sicurezza) di cosa ha bisogno la tua skill per funzionare.

### Frontmatter di base

```yaml
---
name: my-skill
description: Breve riepilogo di cosa fa questa skill.
version: 1.0.0
---
```

### Metadati di runtime (`metadata.openclaw`)

Dichiara i requisiti di runtime della tua skill sotto `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Gestisci le attività tramite l’API Todoist.
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

Usa `requires.env` per le variabili d’ambiente che devono essere presenti prima che la skill possa essere eseguita. Usa `envVars` quando ti servono metadati per singola variabile, incluse variabili opzionali con `required: false`.

### Riferimento completo dei campi

| Campo              | Tipo       | Descrizione                                                                                                                                                         |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variabili d’ambiente obbligatorie attese dalla tua skill.                                                                                                           |
| `requires.bins`    | `string[]` | Binari CLI che devono essere tutti installati.                                                                                                                       |
| `requires.anyBins` | `string[]` | Binari CLI di cui deve esisterne almeno uno.                                                                                                                         |
| `requires.config`  | `string[]` | Percorsi dei file di configurazione letti dalla tua skill.                                                                                                           |
| `primaryEnv`       | `string`   | La variabile d’ambiente della credenziale principale per la tua skill.                                                                                               |
| `envVars`          | `array`    | Dichiarazioni di variabili d’ambiente con `name`, `required` opzionale e `description` opzionale. Imposta `required: false` per le variabili d’ambiente opzionali. |
| `always`           | `boolean`  | Se `true`, la skill è sempre attiva (non serve installazione esplicita).                                                                                             |
| `skillKey`         | `string`   | Sovrascrive la chiave di invocazione della skill.                                                                                                                    |
| `emoji`            | `string`   | Emoji visualizzata per la skill.                                                                                                                                     |
| `homepage`         | `string`   | URL della homepage o della documentazione della skill.                                                                                                               |
| `os`               | `string[]` | Restrizioni del sistema operativo (ad es. `["macos"]`, `["linux"]`).                                                                                                 |
| `install`          | `array`    | Specifiche di installazione per le dipendenze (vedi sotto).                                                                                                          |
| `nix`              | `object`   | Specifica del plugin Nix (vedi README).                                                                                                                             |
| `config`           | `object`   | Specifica di configurazione Clawdbot (vedi README).                                                                                                                 |

### Specifiche di installazione

Se la tua skill richiede l’installazione di dipendenze, dichiarale nell’array `install`:

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

### Variabili d’ambiente opzionali

Dichiara le variabili d’ambiente opzionali sotto `metadata.openclaw.envVars` e imposta `required: false`. Non aggiungere voci opzionali a `requires.env`, perché `requires.env` significa che la skill non può essere eseguita senza di esse.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Token API Todoist usato per richieste autenticate.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID progetto predefinito opzionale quando l’utente non ne specifica uno.
```

### Perché è importante

L’analisi di sicurezza di ClawHub verifica che ciò che la tua skill dichiara corrisponda a ciò che fa effettivamente. Se il tuo codice fa riferimento a `TODOIST_API_KEY` ma il frontmatter non lo dichiara sotto `requires.env`, `primaryEnv` o `envVars`, l’analisi segnalerà una mancata corrispondenza dei metadati. Mantenere accurate le dichiarazioni aiuta la tua skill a superare la revisione e aiuta gli utenti a capire cosa stanno installando.

### Esempio: frontmatter completo

```yaml
---
name: todoist-cli
description: Gestisci attività, progetti ed etichette Todoist dalla riga di comando.
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
        description: Token API Todoist.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID progetto predefinito opzionale.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## File consentiti

La pubblicazione accetta solo file “basati su testo”.

- L’allowlist delle estensioni è in `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- I file di script vengono comunque analizzati dopo il caricamento; i file PowerShell `.ps1`, `.psm1` e `.psd1` sono accettati come testo.
- I tipi di contenuto che iniziano con `text/` sono trattati come testo, più una piccola allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limiti (lato server):

- Dimensione totale del bundle: 50 MB.
- Il testo per gli embedding include `SKILL.md` + fino a circa 40 file non `.md` (limite best-effort).

## Slug

- Derivati per impostazione predefinita dal nome della cartella.
- Gli ambiti dei pacchetti devono corrispondere esattamente all’handle editore ClawHub. Gli handle editore possono usare lettere minuscole, numeri, trattini, punti e underscore; devono iniziare e finire con una lettera minuscola o un numero.
- Gli slug dei pacchetti devono essere minuscoli e compatibili con npm, per esempio `@example.tools/demo-plugin` o `demo-plugin`.

## Versionamento + tag

- Ogni pubblicazione crea una nuova versione (semver).
- I tag sono puntatori stringa a una versione; `latest` è comunemente usato.

## Licenza

- Tutte le skills pubblicate su ClawHub sono concesse in licenza sotto `MIT-0`.
- Chiunque può usare, modificare e ridistribuire le skills pubblicate, anche commercialmente.
- L’attribuzione non è richiesta.
- Non aggiungere termini di licenza in conflitto in `SKILL.md`; ClawHub non supporta override della licenza per singola skill.

## Skills a pagamento

- ClawHub non supporta skills a pagamento, prezzi per singola skill, paywall o condivisione dei ricavi.
- Non aggiungere metadati di prezzo a `SKILL.md`; non fanno parte del formato della skill e non renderanno a pagamento una skill pubblicata.
- Se la tua skill si integra con un servizio di terze parti a pagamento, documenta chiaramente il costo esterno e l’account richiesto nelle istruzioni della skill e nelle dichiarazioni env (`requires.env` per le variabili obbligatorie, oppure `envVars` con `required: false` per le variabili opzionali).
