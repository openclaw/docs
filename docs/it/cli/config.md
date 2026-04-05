---
read_when:
    - Vuoi leggere o modificare la configurazione in modo non interattivo
summary: Riferimento CLI per `openclaw config` (get/set/unset/file/schema/validate)
title: config
x-i18n:
    generated_at: "2026-04-05T13:47:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4de30f41e15297019151ad1a5b306cb331fd5c2beefd5ce5b98fcc51e95f0de
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Helper di configurazione per modifiche non interattive in `openclaw.json`: valori
get/set/unset/file/schema/validate per percorso e stampa del file di configurazione attivo. Esegui senza sottocomando per
aprire la procedura guidata di configurazione (uguale a `openclaw configure`).

Opzioni root:

- `--section <section>`: filtro ripetibile delle sezioni di configurazione guidata quando esegui `openclaw config` senza un sottocomando

Sezioni guidate supportate:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## Esempi

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Stampa su stdout come JSON lo schema JSON generato per `openclaw.json`.

Cosa include:

- Lo schema di configurazione root corrente, più un campo stringa root `$schema` per gli strumenti dell'editor
- I metadati di documentazione dei campi `title` e `description` usati dalla Control UI
- I nodi di oggetti nidificati, wildcard (`*`) e elementi di array (`[]`) ereditano gli stessi metadati `title` / `description` quando esiste documentazione dei campi corrispondente
- Anche i rami `anyOf` / `oneOf` / `allOf` ereditano gli stessi metadati di documentazione quando esiste documentazione dei campi corrispondente
- Metadati best-effort dello schema di plugin + canali live quando i manifest di runtime possono essere caricati
- Uno schema di fallback pulito anche quando la configurazione corrente non è valida

RPC di runtime correlata:

- `config.schema.lookup` restituisce un percorso di configurazione normalizzato con un nodo
  di schema superficiale (`title`, `description`, `type`, `enum`, `const`, limiti comuni),
  metadati di suggerimento UI corrispondenti e riepiloghi immediati dei figli. Usalo per
  l'analisi dettagliata con ambito di percorso nella Control UI o in client personalizzati.

```bash
openclaw config schema
```

Reindirizzalo in un file quando vuoi ispezionarlo o convalidarlo con altri strumenti:

```bash
openclaw config schema > openclaw.schema.json
```

### Percorsi

I percorsi usano la notazione con punto o con parentesi:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Usa l'indice della lista degli agenti per indirizzare un agente specifico:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Valori

I valori vengono analizzati come JSON5 quando possibile; altrimenti vengono trattati come stringhe.
Usa `--strict-json` per richiedere l'analisi JSON5. `--json` resta supportato come alias legacy.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` stampa il valore grezzo come JSON invece che come testo formattato per il terminale.

## Modalità di `config set`

`openclaw config set` supporta quattro stili di assegnazione:

1. Modalità valore: `openclaw config set <path> <value>`
2. Modalità builder SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Modalità builder provider (solo percorso `secrets.providers.<alias>`):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Modalità batch (`--batch-json` o `--batch-file`):

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

Nota sui criteri:

- Le assegnazioni SecretRef vengono rifiutate sulle superfici mutabili a runtime non supportate (ad esempio `hooks.token`, `commands.ownerDisplaySecret`, i token webhook di binding dei thread Discord e JSON creds di WhatsApp). Vedi [SecretRef Credential Surface](/reference/secretref-credential-surface).

L'analisi batch usa sempre il payload batch (`--batch-json`/`--batch-file`) come fonte di verità.
`--strict-json` / `--json` non modificano il comportamento di analisi batch.

La modalità JSON path/value resta supportata sia per SecretRef sia per i provider:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flag del Provider Builder

Le destinazioni del provider builder devono usare `secrets.providers.<alias>` come percorso.

Flag comuni:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Provider env (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (ripetibile)

Provider file (`--provider-source file`):

- `--provider-path <path>` (obbligatorio)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Provider exec (`--provider-source exec`):

- `--provider-command <path>` (obbligatorio)
- `--provider-arg <arg>` (ripetibile)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (ripetibile)
- `--provider-pass-env <ENV_VAR>` (ripetibile)
- `--provider-trusted-dir <path>` (ripetibile)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

Esempio di provider exec rafforzato:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Dry run

Usa `--dry-run` per convalidare le modifiche senza scrivere `openclaw.json`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

Comportamento del dry run:

- Modalità builder: esegue i controlli di risolvibilità SecretRef per i ref/provider modificati.
- Modalità JSON (`--strict-json`, `--json` o modalità batch): esegue la convalida dello schema più i controlli di risolvibilità SecretRef.
- Viene eseguita anche la convalida dei criteri per le superfici di destinazione SecretRef note ma non supportate.
- I controlli dei criteri valutano l'intera configurazione dopo la modifica, quindi le scritture di oggetti padre (ad esempio impostare `hooks` come oggetto) non possono aggirare la convalida delle superfici non supportate.
- I controlli exec SecretRef vengono saltati per impostazione predefinita durante il dry run per evitare effetti collaterali dei comandi.
- Usa `--allow-exec` con `--dry-run` per attivare i controlli exec SecretRef (questo può eseguire comandi del provider).
- `--allow-exec` è solo per il dry run e genera errore se usato senza `--dry-run`.

`--dry-run --json` stampa un report leggibile dalla macchina:

- `ok`: se il dry run è passato
- `operations`: numero di assegnazioni valutate
- `checks`: se sono stati eseguiti i controlli di schema/risolvibilità
- `checks.resolvabilityComplete`: se i controlli di risolvibilità sono stati completati (false quando i ref exec vengono saltati)
- `refsChecked`: numero di ref effettivamente risolti durante il dry run
- `skippedExecRefs`: numero di ref exec saltati perché `--allow-exec` non era impostato
- `errors`: errori strutturati di schema/risolvibilità quando `ok=false`

### Struttura dell'output JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // presente per errori di risolvibilità
    },
  ],
}
```

Esempio di successo:

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

Esempio di errore:

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

Se il dry run fallisce:

- `config schema validation failed`: la forma della tua configurazione dopo la modifica non è valida; correggi percorso/valore o la forma dell'oggetto provider/ref.
- `Config policy validation failed: unsupported SecretRef usage`: riporta quella credenziale a un input in chiaro/stringa e mantieni SecretRef solo sulle superfici supportate.
- `SecretRef assignment(s) could not be resolved`: il provider/ref referenziato al momento non può essere risolto (variabile env mancante, puntatore file non valido, errore del provider exec o mancata corrispondenza provider/source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: il dry run ha saltato i ref exec; riesegui con `--allow-exec` se ti serve la convalida della risolvibilità exec.
- Per la modalità batch, correggi le voci in errore e riesegui `--dry-run` prima di scrivere.

## Sottocomandi

- `config file`: stampa il percorso del file di configurazione attivo (risolto da `OPENCLAW_CONFIG_PATH` o dalla posizione predefinita).

Riavvia il gateway dopo le modifiche.

## Convalida

Convalida la configurazione corrente rispetto allo schema attivo senza avviare il
gateway.

```bash
openclaw config validate
openclaw config validate --json
```
