---
read_when:
    - Pubblicare Skills
    - Debug dei problemi di pubblicazione
summary: Formato della cartella delle Skills, file richiesti, tipi di file consentiti, limiti.
x-i18n:
    generated_at: "2026-06-30T22:18:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Formato Skill

## Su disco

Una skill è una cartella.

Obbligatorio:

- `SKILL.md` (o `skill.md`; è accettato anche il legacy `skills.md`)

Facoltativo:

- qualsiasi file _testuale_ di supporto (vedi “File consentiti”)
- `.clawhubignore` (pattern da ignorare per la pubblicazione, legacy `.clawdhubignore`)
- `.gitignore` (anch’esso rispettato)

## Importazione da GitHub

L’importatore web GitHub è più restrittivo della pubblicazione/sincronizzazione locale. Rileva solo
file `SKILL.md` o legacy `skills.md` in repository pubblici, non fork, di proprietà
dell’account GitHub connesso. Non importa repository privati, fork,
repository archiviati/disabilitati o repository pubblici di terze parti.

Metadati di installazione locale (scritti dalla CLI):

- `<skill>/.clawhub/origin.json` (legacy `.clawdhub`)

Stato di installazione nella workdir (scritto dalla CLI):

- `<workdir>/.clawhub/lock.json` (legacy `.clawdhub`)

## `SKILL.md`

- Markdown con frontmatter YAML facoltativo.
- Il server estrae i metadati dal frontmatter durante la pubblicazione.
- `description` è usato come riepilogo della skill nell’UI/ricerca.

## Metadati frontmatter

I metadati della skill sono dichiarati nel frontmatter YAML all’inizio del tuo `SKILL.md`. Questo indica al registro (e all’analisi di sicurezza) di cosa ha bisogno la tua skill per essere eseguita.

### Frontmatter di base

```yaml
---
name: my-skill
description: Breve riepilogo di cosa fa questa skill.
version: 1.0.0
---
```

### Metadati runtime (`metadata.openclaw`)

Dichiara i requisiti runtime della tua skill sotto `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Gestisci attività tramite l'API Todoist.
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

Usa `requires.env` per le variabili d’ambiente che devono essere presenti prima che la skill possa essere eseguita. Usa `envVars` quando ti servono metadati per singola variabile, incluse variabili facoltative con `required: false`.

### Riferimento completo dei campi

| Campo              | Tipo       | Descrizione                                                                                                                                                 |
| ------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variabili d’ambiente obbligatorie attese dalla tua skill.                                                                                                   |
| `requires.bins`    | `string[]` | Binari CLI che devono essere tutti installati.                                                                                                              |
| `requires.anyBins` | `string[]` | Binari CLI di cui almeno uno deve esistere.                                                                                                                 |
| `requires.config`  | `string[]` | Percorsi dei file di configurazione letti dalla tua skill.                                                                                                  |
| `primaryEnv`       | `string`   | La variabile d’ambiente della credenziale principale per la tua skill.                                                                                      |
| `envVars`          | `array`    | Dichiarazioni di variabili d’ambiente con `name`, `required` facoltativo e `description` facoltativa. Imposta `required: false` per le env var facoltative. |
| `always`           | `boolean`  | Se `true`, la skill è sempre attiva (non serve installazione esplicita).                                                                                    |
| `skillKey`         | `string`   | Sostituisce la chiave di invocazione della skill.                                                                                                          |
| `emoji`            | `string`   | Emoji visualizzata per la skill.                                                                                                                           |
| `homepage`         | `string`   | URL della homepage o della documentazione della skill.                                                                                                     |
| `os`               | `string[]` | Restrizioni OS (ad es. `["macos"]`, `["linux"]`).                                                                                                          |
| `install`          | `array`    | Specifiche di installazione per le dipendenze (vedi sotto).                                                                                                |
| `nix`              | `object`   | Specifica del Plugin Nix (vedi README).                                                                                                                    |
| `config`           | `object`   | Specifica di configurazione Clawdbot (vedi README).                                                                                                        |

### Specifiche di installazione

Se la tua skill necessita di dipendenze installate, dichiarale nell’array `install`:

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

Dichiara le variabili d’ambiente facoltative sotto `metadata.openclaw.envVars` e imposta `required: false`. Non aggiungere voci facoltative a `requires.env`, perché `requires.env` significa che la skill non può essere eseguita senza di esse.

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
        description: ID progetto predefinito facoltativo quando l'utente non ne specifica uno.
```

### Perché è importante

L’analisi di sicurezza di ClawHub verifica che ciò che la tua skill dichiara corrisponda a ciò che fa realmente. Se il tuo codice fa riferimento a `TODOIST_API_KEY` ma il frontmatter non lo dichiara sotto `requires.env`, `primaryEnv` o `envVars`, l’analisi segnalerà una mancata corrispondenza dei metadati. Mantenere accurate le dichiarazioni aiuta la tua skill a superare la revisione e aiuta gli utenti a capire cosa stanno installando.

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
        description: ID progetto predefinito facoltativo.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## File consentiti

Solo i file “testuali” sono accettati dalla pubblicazione.

- L’allowlist delle estensioni è in `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- I file script vengono comunque analizzati dopo il caricamento; i file PowerShell `.ps1`, `.psm1` e `.psd1` sono accettati come testo.
- I tipi di contenuto che iniziano con `text/` sono trattati come testo; più una piccola allowlist (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limiti (lato server):

- Dimensione totale del bundle: 50 MB.
- Il testo per embedding include `SKILL.md` + fino a circa 40 file non `.md` (limite best effort).

## Slug

- Derivati per impostazione predefinita dal nome della cartella.
- Gli scope dei pacchetti devono corrispondere esattamente all’handle publisher di ClawHub. Gli handle publisher possono usare lettere minuscole, numeri, trattini, punti e trattini bassi; devono iniziare e terminare con una lettera minuscola o un numero.
- Gli slug dei pacchetti devono essere minuscoli e compatibili con npm, ad esempio `@example.tools/demo-plugin` o `demo-plugin`.

## Versionamento + tag

- Ogni pubblicazione crea una nuova versione (semver).
- I tag sono puntatori stringa a una versione; `latest` è usato comunemente.

## Licenza

- Tutte le skill pubblicate su ClawHub sono concesse in licenza sotto `MIT-0`.
- Chiunque può usare, modificare e ridistribuire le skill pubblicate, anche commercialmente.
- L’attribuzione non è richiesta.
- Non aggiungere termini di licenza in conflitto in `SKILL.md`; ClawHub non supporta override di licenza per singola skill.

## Skill a pagamento

- ClawHub non supporta skill a pagamento, prezzi per singola skill, paywall o condivisione dei ricavi.
- Non aggiungere metadati di prezzo a `SKILL.md`; non fa parte del formato skill e non renderà a pagamento una skill pubblicata.
- Se la tua skill si integra con un servizio di terze parti a pagamento, documenta chiaramente il costo esterno e l’account richiesto nelle istruzioni della skill e nelle dichiarazioni env (`requires.env` per variabili obbligatorie, o `envVars` con `required: false` per variabili facoltative).
