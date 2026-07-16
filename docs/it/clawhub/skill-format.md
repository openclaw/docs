---
read_when:
    - Pubblicazione delle Skills
    - Debug degli errori di pubblicazione
summary: Formato della cartella delle Skill, file obbligatori, tipi di file consentiti, limiti.
x-i18n:
    generated_at: "2026-07-16T14:05:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Formato delle skill

## Su disco

Una skill è una cartella.

Obbligatorio:

- `SKILL.md` (oppure `skill.md`; è accettato anche il formato precedente `skills.md`)

Facoltativo:

- qualsiasi file di supporto _basato su testo_ (vedere “File consentiti”)
- `.clawhubignore` (pattern da ignorare per la pubblicazione, formato precedente `.clawdhubignore`)
- `.gitignore` (anch'esso rispettato)

## Importazione da GitHub

L'importatore web di GitHub è più restrittivo della pubblicazione e sincronizzazione locale. Rileva solo
i file `SKILL.md` o nel formato precedente `skills.md` nei repository pubblici non fork di proprietà
dell'account GitHub connesso. Non importa repository privati, fork,
repository archiviati o disabilitati né repository pubblici di terze parti.

Metadati di installazione locale (scritti dalla CLI):

- `<skill>/.clawhub/origin.json` (formato precedente `.clawdhub`)

Stato di installazione della directory di lavoro (scritto dalla CLI):

- `<workdir>/.clawhub/lock.json` (formato precedente `.clawdhub`)

## `SKILL.md`

- Markdown con frontmatter YAML facoltativo.
- Durante la pubblicazione, il server estrae i metadati dal frontmatter.
- `description` viene usato come riepilogo della skill nell'interfaccia utente e nella ricerca.

Per le Agent Skills portabili, `name` deve corrispondere alla directory superiore e utilizzare
da 1 a 64 lettere minuscole, numeri o trattini. ClawHub mantiene separati lo slug instradabile e
il nome visualizzato nel catalogo, quindi i nomi esistenti provenienti da altri client restano
pubblicabili e non vengono riscritti automaticamente. Gli elenchi del catalogo possono abbreviare visivamente i nomi lunghi
senza modificare il nome memorizzato.

## Metadati del frontmatter

I metadati della skill vengono dichiarati nel frontmatter YAML all'inizio del file `SKILL.md`. Indicano al registro (e all'analisi di sicurezza) ciò di cui la skill ha bisogno per essere eseguita.

### Frontmatter di base

```yaml
---
name: my-skill
description: Breve riepilogo delle funzioni di questa skill.
version: 1.0.0
---
```

### Metadati di runtime (`metadata.openclaw`)

Dichiarare i requisiti di runtime della skill sotto `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Gestisce le attività tramite l'API Todoist.
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

Usare `requires.env` per le variabili d'ambiente che devono essere presenti prima che la skill possa essere eseguita. Usare `envVars` quando sono necessari metadati per ogni variabile, incluse le variabili facoltative con `required: false`.

### Riferimento completo dei campi

| Campo              | Tipo       | Descrizione                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variabili d'ambiente obbligatorie richieste dalla skill.                                                                                           |
| `requires.bins`    | `string[]` | Eseguibili CLI che devono essere tutti installati.                                                                                                     |
| `requires.anyBins` | `string[]` | Eseguibili CLI dei quali deve esserne presente almeno uno.                                                                                                  |
| `requires.config`  | `string[]` | Percorsi dei file di configurazione letti dalla skill.                                                                                                          |
| `primaryEnv`       | `string`   | Variabile d'ambiente principale contenente le credenziali della skill.                                                                                                  |
| `envVars`          | `array`    | Dichiarazioni delle variabili d'ambiente con `name`, `required` facoltativo e `description` facoltativo. Impostare `required: false` per le variabili d'ambiente facoltative. |
| `always`           | `boolean`  | Se `true`, la skill è sempre attiva (non è necessaria un'installazione esplicita).                                                                              |
| `skillKey`         | `string`   | Sostituisce la chiave di invocazione della skill.                                                                                                         |
| `emoji`            | `string`   | Emoji visualizzata per la skill.                                                                                                                 |
| `homepage`         | `string`   | URL della pagina principale o della documentazione della skill.                                                                                                         |
| `os`               | `string[]` | Restrizioni del sistema operativo (ad esempio `["macos"]`, `["linux"]`).                                                                                             |
| `install`          | `array`    | Specifiche di installazione delle dipendenze (vedere di seguito).                                                                                                  |
| `nix`              | `object`   | Specifica del plugin Nix (vedere il README).                                                                                                                |
| `config`           | `object`   | Specifica di configurazione di Clawdbot (vedere il README).                                                                                                           |

### Specifiche di installazione

Se la skill richiede l'installazione di dipendenze, dichiararle nell'array `install`:

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

Dichiarare le variabili d'ambiente facoltative sotto `metadata.openclaw.envVars` e impostare `required: false`. Non aggiungere voci facoltative a `requires.env`, perché `requires.env` indica che la skill non può essere eseguita senza di esse.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Token API Todoist usato per le richieste autenticate.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID facoltativo del progetto predefinito quando non ne viene specificato uno.
```

### Perché è importante

L'analisi di sicurezza di ClawHub verifica che quanto dichiarato dalla skill corrisponda a ciò che essa effettivamente esegue. Se il codice fa riferimento a `TODOIST_API_KEY` ma il frontmatter non lo dichiara sotto `requires.env`, `primaryEnv` o `envVars`, l'analisi segnalerà una mancata corrispondenza dei metadati. Dichiarazioni accurate aiutano la skill a superare la revisione e consentono agli utenti di comprendere ciò che stanno installando.

### Esempio: frontmatter completo

```yaml
---
name: todoist-cli
description: Gestisce attività, progetti ed etichette di Todoist dalla riga di comando.
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
        description: ID facoltativo del progetto predefinito.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## File consentiti

La pubblicazione accetta solo file “basati su testo”.

- L'elenco delle estensioni consentite si trova in `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- I file di script vengono comunque analizzati dopo il caricamento; i file PowerShell `.ps1`, `.psm1` e `.psd1` sono accettati come testo.
- I tipi di contenuto che iniziano con `text/` vengono trattati come testo, insieme a un piccolo elenco di tipi consentiti (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limiti (lato server):

- Dimensione totale del pacchetto: 50MB.
- Il testo per l'embedding include `SKILL.md` e fino a circa 40 file non `.md` (limite applicato per quanto possibile).

## Slug

- Per impostazione predefinita, viene derivato dal nome della cartella.
- Gli ambiti dei pacchetti devono corrispondere esattamente all'handle dell'editore ClawHub. Gli handle degli editori possono contenere lettere minuscole, numeri, trattini, punti e trattini bassi; devono iniziare e terminare con una lettera minuscola o un numero.
- Gli slug dei pacchetti devono essere in minuscolo e compatibili con npm, ad esempio `@example.tools/demo-plugin` o `demo-plugin`.

## Versionamento e tag

- Ogni pubblicazione crea una nuova versione (semver).
- I tag sono puntatori stringa a una versione; `latest` è comunemente utilizzato.

## Licenza

- Tutte le skill pubblicate su ClawHub sono concesse in licenza ai sensi di `MIT-0`.
- Chiunque può utilizzare, modificare e ridistribuire le skill pubblicate, anche a fini commerciali.
- L'attribuzione non è obbligatoria.
- Non aggiungere condizioni di licenza in conflitto in `SKILL.md`; ClawHub non supporta sostituzioni della licenza per singola skill.

## Skill a pagamento

- ClawHub non supporta skill a pagamento, prezzi per singola skill, paywall o condivisione dei ricavi.
- Non aggiungere metadati sui prezzi a `SKILL.md`; non fanno parte del formato delle skill e non rendono a pagamento una skill pubblicata.
- Se la skill si integra con un servizio di terze parti a pagamento, documentare chiaramente il costo esterno e l'account richiesto nelle istruzioni della skill e nelle dichiarazioni delle variabili d'ambiente (`requires.env` per le variabili obbligatorie oppure `envVars` con `required: false` per quelle facoltative).
