---
read_when:
    - Pubblicazione delle Skills
    - Debug degli errori di pubblicazione
summary: Formato della cartella delle Skills, file obbligatori, tipi di file consentiti, limiti.
x-i18n:
    generated_at: "2026-07-12T06:52:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Formato delle Skill

## Su disco

Una skill è una cartella.

Obbligatorio:

- `SKILL.md` (o `skill.md`; è accettato anche il precedente `skills.md`)

Facoltativo:

- qualsiasi file di supporto _basato su testo_ (vedi “File consentiti”)
- `.clawhubignore` (modelli da ignorare per la pubblicazione, in precedenza `.clawdhubignore`)
- `.gitignore` (anch'esso rispettato)

## Importazione da GitHub

L'importatore GitHub sul web è più restrittivo della pubblicazione/sincronizzazione locale. Individua solo i file `SKILL.md` o i precedenti `skills.md` nei repository pubblici, non fork e di proprietà dell'account GitHub che ha effettuato l'accesso. Non importa repository privati, fork, repository archiviati/disabilitati o repository pubblici di terze parti.

Metadati dell'installazione locale (scritti dalla CLI):

- `<skill>/.clawhub/origin.json` (in precedenza `.clawdhub`)

Stato dell'installazione nella directory di lavoro (scritto dalla CLI):

- `<workdir>/.clawhub/lock.json` (in precedenza `.clawdhub`)

## `SKILL.md`

- Markdown con frontmatter YAML facoltativo.
- Durante la pubblicazione, il server estrae i metadati dal frontmatter.
- `description` viene usato come riepilogo della skill nell'interfaccia utente e nella ricerca.

Per Skills degli agenti portabili, `name` deve corrispondere alla directory principale e utilizzare da 1 a 64 lettere minuscole, numeri o trattini. ClawHub mantiene separati lo slug instradabile e il nome visualizzato nel catalogo, quindi i nomi esistenti provenienti da altri client restano pubblicabili e non vengono riscritti automaticamente. Gli elenchi del catalogo possono abbreviare visivamente i nomi lunghi senza modificare il nome memorizzato.

## Metadati del frontmatter

I metadati della skill sono dichiarati nel frontmatter YAML all'inizio del file `SKILL.md`. Questo indica al registro (e all'analisi di sicurezza) ciò di cui la skill ha bisogno per essere eseguita.

### Frontmatter di base

```yaml
---
name: my-skill
description: Breve riepilogo di ciò che fa questa skill.
version: 1.0.0
---
```

### Metadati di runtime (`metadata.openclaw`)

Dichiara i requisiti di runtime della skill in `metadata.openclaw` (alias: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Gestisce le attività tramite l'API di Todoist.
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

Usa `requires.env` per le variabili di ambiente che devono essere presenti prima che la skill possa essere eseguita. Usa `envVars` quando servono metadati per ogni variabile, incluse le variabili facoltative con `required: false`.

### Riferimento completo dei campi

| Campo              | Tipo       | Descrizione                                                                                                                                                                 |
| ------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Variabili di ambiente obbligatorie previste dalla skill.                                                                                                                     |
| `requires.bins`    | `string[]` | Binari CLI che devono essere tutti installati.                                                                                                                               |
| `requires.anyBins` | `string[]` | Binari CLI dei quali deve esserne presente almeno uno.                                                                                                                       |
| `requires.config`  | `string[]` | Percorsi dei file di configurazione letti dalla skill.                                                                                                                       |
| `primaryEnv`       | `string`   | Variabile di ambiente principale contenente le credenziali per la skill.                                                                                                     |
| `envVars`          | `array`    | Dichiarazioni delle variabili di ambiente con `name`, `required` facoltativo e `description` facoltativa. Imposta `required: false` per le variabili di ambiente facoltative. |
| `always`           | `boolean`  | Se `true`, la skill è sempre attiva (non è necessaria un'installazione esplicita).                                                                                           |
| `skillKey`         | `string`   | Sostituisce la chiave di invocazione della skill.                                                                                                                            |
| `emoji`            | `string`   | Emoji visualizzata per la skill.                                                                                                                                             |
| `homepage`         | `string`   | URL della pagina principale o della documentazione della skill.                                                                                                              |
| `os`               | `string[]` | Limitazioni relative al sistema operativo (ad esempio `["macos"]`, `["linux"]`).                                                                                             |
| `install`          | `array`    | Specifiche di installazione delle dipendenze (vedi sotto).                                                                                                                   |
| `nix`              | `object`   | Specifica del plugin Nix (vedi README).                                                                                                                                       |
| `config`           | `object`   | Specifica di configurazione di Clawdbot (vedi README).                                                                                                                       |

### Specifiche di installazione

Se la skill richiede l'installazione di dipendenze, dichiarale nell'array `install`:

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

### Variabili di ambiente facoltative

Dichiara le variabili di ambiente facoltative in `metadata.openclaw.envVars` e imposta `required: false`. Non aggiungere voci facoltative a `requires.env`, perché `requires.env` indica che la skill non può essere eseguita senza di esse.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Token API di Todoist usato per le richieste autenticate.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID facoltativo del progetto predefinito quando l'utente non ne specifica uno.
```

### Perché è importante

L'analisi di sicurezza di ClawHub verifica che ciò che la skill dichiara corrisponda a ciò che effettivamente fa. Se il codice fa riferimento a `TODOIST_API_KEY` ma il frontmatter non la dichiara in `requires.env`, `primaryEnv` o `envVars`, l'analisi segnalerà una mancata corrispondenza dei metadati. Mantenere accurate le dichiarazioni aiuta la skill a superare la revisione e gli utenti a comprendere ciò che stanno installando.

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
        description: Token API di Todoist.
      - name: TODOIST_PROJECT_ID
        required: false
        description: ID facoltativo del progetto predefinito.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## File consentiti

Durante la pubblicazione sono accettati solo file “basati su testo”.

- L'elenco delle estensioni consentite si trova in `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- I file di script vengono comunque analizzati dopo il caricamento; i file PowerShell `.ps1`, `.psm1` e `.psd1` sono accettati come testo.
- I tipi di contenuto che iniziano con `text/` sono considerati testo, insieme a un breve elenco di tipi consentiti (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limiti (lato server):

- Dimensione totale del pacchetto: 50 MB.
- Il testo per l'incorporamento include `SKILL.md` e fino a circa 40 file diversi da `.md` (limite applicato secondo disponibilità).

## Slug

- Per impostazione predefinita vengono derivati dal nome della cartella.
- Gli ambiti dei pacchetti devono corrispondere esattamente all'identificativo dell'editore su ClawHub. Gli identificativi degli editori possono usare lettere minuscole, numeri, trattini, punti e trattini bassi; devono iniziare e terminare con una lettera minuscola o un numero.
- Gli slug dei pacchetti devono essere in minuscolo e compatibili con npm, ad esempio `@example.tools/demo-plugin` o `demo-plugin`.

## Controllo delle versioni e tag

- Ogni pubblicazione crea una nuova versione (semver).
- I tag sono puntatori in formato stringa a una versione; viene comunemente usato `latest`.

## Licenza

- Tutte le skill pubblicate su ClawHub sono concesse in licenza secondo `MIT-0`.
- Chiunque può usare, modificare e ridistribuire le skill pubblicate, anche a fini commerciali.
- L'attribuzione non è obbligatoria.
- Non aggiungere termini di licenza in conflitto in `SKILL.md`; ClawHub non supporta sostituzioni della licenza per singola skill.

## Skill a pagamento

- ClawHub non supporta skill a pagamento, prezzi per singola skill, paywall o condivisione dei ricavi.
- Non aggiungere metadati sui prezzi a `SKILL.md`; non fanno parte del formato della skill e non renderanno a pagamento una skill pubblicata.
- Se la skill si integra con un servizio di terze parti a pagamento, documenta chiaramente il costo esterno e l'account richiesto nelle istruzioni della skill e nelle dichiarazioni delle variabili di ambiente (`requires.env` per le variabili obbligatorie oppure `envVars` con `required: false` per quelle facoltative).
