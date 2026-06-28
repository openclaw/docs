---
read_when:
    - Pubblicazione delle Skills
    - Debug dei fallimenti di pubblicazione
summary: Formato della cartella delle skill, file obbligatori, tipi di file consentiti, limiti.
x-i18n:
    generated_at: "2026-06-28T05:07:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Formato Skill

## Su disco

Una Skill è una cartella.

Obbligatorio:

- `SKILL.md` (o `skill.md`; è accettato anche il legacy `skills.md`)

Facoltativo:

- eventuali file di supporto _testuali_ (vedi “File consentiti”)
- `.clawhubignore` (pattern da ignorare per la pubblicazione, legacy `.clawdhubignore`)
- `.gitignore` (anch'esso rispettato)

## Importazione da GitHub

L'importatore web di GitHub è più restrittivo della pubblicazione/sincronizzazione locale. Rileva solo
file `SKILL.md` o legacy `skills.md` in repository pubblici, non fork, posseduti
dall'account GitHub connesso. Non importa repository privati, fork,
repository archiviati/disabilitati o repository pubblici di terze parti.

Metadati di installazione locale (scritti dalla CLI):

- `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

Stato di installazione della workdir (scritto dalla CLI):

- `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)

## `SKILL.md`

- Markdown con frontmatter YAML facoltativo.
- Il server estrae i metadati dal frontmatter durante la pubblicazione.
- `description` viene usato come riepilogo della Skill nell'interfaccia utente/ricerca.

## Metadati frontmatter

I metadati della Skill sono dichiarati nel frontmatter YAML all'inizio del tuo `SKILL.md`. Questo indica al registro (e all'analisi di sicurezza) cosa serve alla tua Skill per essere eseguita.

### Frontmatter di base

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Metadati di runtime (`metadata.openclaw`)

Dichiara i requisiti di runtime della tua Skill sotto `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

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

Usa `requires.env` per le variabili d'ambiente che devono essere presenti prima che la Skill possa essere eseguita. Usa `envVars` quando ti servono metadati per singola variabile, incluse variabili facoltative con `required: false`.

### Riferimento completo dei campi

| Campo              | Tipo       | Descrizione                                                                                                                                              |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variabili d'ambiente obbligatorie attese dalla tua Skill.                                                                                                |
| `requires.bins`    | `string[]` | Binari CLI che devono essere tutti installati.                                                                                                           |
| `requires.anyBins` | `string[]` | Binari CLI per cui almeno uno deve esistere.                                                                                                             |
| `requires.config`  | `string[]` | Percorsi dei file di configurazione letti dalla tua Skill.                                                                                               |
| `primaryEnv`       | `string`   | La variabile d'ambiente principale delle credenziali per la tua Skill.                                                                                   |
| `envVars`          | `array`    | Dichiarazioni di variabili d'ambiente con `name`, `required` facoltativo e `description` facoltativa. Imposta `required: false` per variabili facoltative. |
| `always`           | `boolean`  | Se `true`, la Skill è sempre attiva (non serve un'installazione esplicita).                                                                              |
| `skillKey`         | `string`   | Sovrascrive la chiave di invocazione della Skill.                                                                                                       |
| `emoji`            | `string`   | Emoji visualizzata per la Skill.                                                                                                                        |
| `homepage`         | `string`   | URL della homepage o della documentazione della Skill.                                                                                                  |
| `os`               | `string[]` | Restrizioni del sistema operativo (ad es. `["macos"]`, `["linux"]`).                                                                                    |
| `install`          | `array`    | Specifiche di installazione per le dipendenze (vedi sotto).                                                                                             |
| `nix`              | `object`   | Specifica del Plugin Nix (vedi README).                                                                                                                 |
| `config`           | `object`   | Specifica di configurazione Clawdbot (vedi README).                                                                                                     |

### Specifiche di installazione

Se la tua Skill richiede dipendenze installate, dichiarale nell'array `install`:

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

Dichiara le variabili d'ambiente facoltative sotto `metadata.openclaw.envVars` e imposta `required: false`. Non aggiungere voci facoltative a `requires.env`, perché `requires.env` significa che la Skill non può essere eseguita senza di esse.

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

L'analisi di sicurezza di ClawHub verifica che ciò che la tua Skill dichiara corrisponda a ciò che fa effettivamente. Se il tuo codice fa riferimento a `TODOIST_API_KEY` ma il frontmatter non lo dichiara sotto `requires.env`, `primaryEnv` o `envVars`, l'analisi segnalerà una mancata corrispondenza dei metadati. Mantenere accurate le dichiarazioni aiuta la tua Skill a superare la revisione e aiuta gli utenti a capire cosa stanno installando.

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

Solo file “testuali” sono accettati dalla pubblicazione.

- La allowlist delle estensioni è in `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- I file di script vengono comunque analizzati dopo il caricamento; i file PowerShell `.ps1`, `.psm1` e `.psd1` sono accettati come testo.
- I tipi di contenuto che iniziano con `text/` sono trattati come testo; più una piccola allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limiti (lato server):

- Dimensione totale del bundle: 50MB.
- Il testo per l'embedding include `SKILL.md` + fino a circa 40 file non `.md` (limite best-effort).

## Slug

- Derivati dal nome della cartella per impostazione predefinita.
- Gli scope dei pacchetti devono corrispondere esattamente all'handle dell'editore ClawHub. Gli handle degli editori possono usare lettere minuscole, numeri, trattini, punti e underscore; devono iniziare e terminare con una lettera minuscola o un numero.
- Gli slug dei pacchetti devono essere minuscoli e compatibili con npm, per esempio `@example.tools/demo-plugin` o `demo-plugin`.

## Versionamento + tag

- Ogni pubblicazione crea una nuova versione (semver).
- I tag sono puntatori stringa a una versione; `latest` è usato comunemente.

## Licenza

- Tutte le Skills pubblicate su ClawHub sono concesse in licenza sotto `MIT-0`.
- Chiunque può usare, modificare e ridistribuire Skills pubblicate, anche commercialmente.
- L'attribuzione non è richiesta.
- Non aggiungere termini di licenza in conflitto in `SKILL.md`; ClawHub non supporta sovrascritture della licenza per singola Skill.

## Skills a pagamento

- ClawHub non supporta Skills a pagamento, prezzi per singola Skill, paywall o condivisione dei ricavi.
- Non aggiungere metadati di prezzo a `SKILL.md`; non fanno parte del formato Skill e non renderanno a pagamento una Skill pubblicata.
- Se la tua Skill si integra con un servizio di terze parti a pagamento, documenta chiaramente il costo esterno e l'account richiesto nelle istruzioni della Skill e nelle dichiarazioni env (`requires.env` per variabili obbligatorie, oppure `envVars` con `required: false` per variabili facoltative).
