---
read_when:
    - Pubblicare Skills
    - Debug degli errori di pubblicazione/sincronizzazione
summary: Formato della cartella Skill, file obbligatori, tipi di file consentiti, limiti.
x-i18n:
    generated_at: "2026-05-12T23:29:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Formato skill

## Su disco

Una skill è una cartella.

Obbligatorio:

- `SKILL.md` (o `skill.md`)

Facoltativo:

- qualsiasi file di supporto _basato su testo_ (vedi “File consentiti”)
- `.clawhubignore` (pattern da ignorare per pubblicazione/sincronizzazione, legacy `.clawdhubignore`)
- `.gitignore` (anch'esso rispettato)

Metadati di installazione locale (scritti dalla CLI):

- `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

Stato di installazione della workdir (scritto dalla CLI):

- `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)

## `SKILL.md`

- Markdown con frontmatter YAML facoltativo.
- Il server estrae i metadati dal frontmatter durante la pubblicazione.
- `description` viene usato come riepilogo della skill nella UI/ricerca.

## Metadati del frontmatter

I metadati della skill sono dichiarati nel frontmatter YAML all'inizio del tuo `SKILL.md`. Questo indica al registro (e all'analisi di sicurezza) di cosa ha bisogno la skill per funzionare.

### Frontmatter di base

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Metadati di runtime (`metadata.openclaw`)

Dichiara i requisiti di runtime della skill sotto `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

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

Usa `requires.env` per le variabili d'ambiente che devono essere presenti prima che la skill possa essere eseguita. Usa `envVars` quando ti servono metadati per singola variabile, incluse variabili facoltative con `required: false`.

### Riferimento completo dei campi

| Campo              | Tipo       | Descrizione                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variabili d'ambiente obbligatorie attese dalla skill.                                                                                        |
| `requires.bins`    | `string[]` | Binari CLI che devono essere tutti installati.                                                                                               |
| `requires.anyBins` | `string[]` | Binari CLI di cui deve esisterne almeno uno.                                                                                                 |
| `requires.config`  | `string[]` | Percorsi dei file di configurazione letti dalla skill.                                                                                       |
| `primaryEnv`       | `string`   | La variabile d'ambiente principale per le credenziali della skill.                                                                           |
| `envVars`          | `array`    | Dichiarazioni di variabili d'ambiente con `name`, `required` facoltativo e `description` facoltativa. Imposta `required: false` per variabili d'ambiente facoltative. |
| `always`           | `boolean`  | Se `true`, la skill è sempre attiva (non è necessaria un'installazione esplicita).                                                           |
| `skillKey`         | `string`   | Sovrascrive la chiave di invocazione della skill.                                                                                            |
| `emoji`            | `string`   | Emoji visualizzata per la skill.                                                                                                             |
| `homepage`         | `string`   | URL della homepage o della documentazione della skill.                                                                                       |
| `os`               | `string[]` | Restrizioni del sistema operativo (ad es. `["macos"]`, `["linux"]`).                                                                         |
| `install`          | `array`    | Specifiche di installazione per le dipendenze (vedi sotto).                                                                                  |
| `nix`              | `object`   | Specifica del Plugin Nix (vedi README).                                                                                                      |
| `config`           | `object`   | Specifica di configurazione Clawdbot (vedi README).                                                                                          |

### Specifiche di installazione

Se la tua skill richiede dipendenze installate, dichiarale nell'array `install`:

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

### Variabili d'ambiente facoltative

Dichiara le variabili d'ambiente facoltative sotto `metadata.openclaw.envVars` e imposta `required: false`. Non aggiungere voci facoltative a `requires.env`, perché `requires.env` significa che la skill non può funzionare senza di esse.

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

L'analisi di sicurezza di ClawHub verifica che ciò che la skill dichiara corrisponda a ciò che effettivamente fa. Se il codice fa riferimento a `TODOIST_API_KEY` ma il frontmatter non lo dichiara sotto `requires.env`, `primaryEnv` o `envVars`, l'analisi segnalerà una mancata corrispondenza dei metadati. Mantenere dichiarazioni accurate aiuta la skill a superare la revisione e aiuta gli utenti a capire cosa stanno installando.

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

- L'allowlist delle estensioni è in `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- I file script vengono comunque analizzati dopo il caricamento; i file PowerShell `.ps1`, `.psm1` e `.psd1` sono accettati come testo.
- I tipi di contenuto che iniziano con `text/` sono trattati come testo; in più c'è una piccola allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limiti (lato server):

- Dimensione totale del bundle: 50 MB.
- Il testo per gli embedding include `SKILL.md` + fino a circa 40 file non `.md` (limite best-effort).

## Slug

- Derivati per impostazione predefinita dal nome della cartella.
- Devono essere minuscoli e sicuri per gli URL: `^[a-z0-9][a-z0-9-]*$`.

## Versionamento + tag

- Ogni pubblicazione crea una nuova versione (semver).
- I tag sono puntatori stringa a una versione; `latest` è comunemente usato.

## Licenza

- Tutte le skill pubblicate su ClawHub sono concesse in licenza sotto `MIT-0`.
- Chiunque può usare, modificare e ridistribuire le skill pubblicate, anche commercialmente.
- L'attribuzione non è richiesta.
- Non aggiungere termini di licenza in conflitto in `SKILL.md`; ClawHub non supporta override della licenza per singola skill.

## Skill a pagamento

- ClawHub non supporta skill a pagamento, prezzi per singola skill, paywall o condivisione dei ricavi.
- Non aggiungere metadati di prezzo a `SKILL.md`; non fanno parte del formato della skill e non renderanno a pagamento una skill pubblicata.
- Se la tua skill si integra con un servizio di terze parti a pagamento, documenta chiaramente il costo esterno e l'account richiesto nelle istruzioni della skill e nelle dichiarazioni delle variabili d'ambiente (`requires.env` per variabili obbligatorie, oppure `envVars` con `required: false` per variabili facoltative).
