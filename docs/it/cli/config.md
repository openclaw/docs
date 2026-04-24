---
read_when:
    - Vuoi leggere o modificare la configurazione in modo non interattivo
summary: Riferimento CLI per `openclaw config` (get/set/unset/file/schema/validate)
title: Configazione
x-i18n:
    generated_at: "2026-04-24T08:33:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15e2eb75cc415df52ddcd104d8e5295d8d7b84baca65b4368deb3f06259f6bcd
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Helper di configurazione per modifiche non interattive in `openclaw.json`: valori get/set/unset/file/schema/validate
per percorso e stampa del file di configurazione attivo. Esegui senza sottocomando per
aprire la procedura guidata di configurazione (uguale a `openclaw configure`).

Opzioni root:

- `--section <section>`: filtro ripetibile delle sezioni della configurazione guidata quando esegui `openclaw config` senza un sottocomando

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
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
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
- Metadati di documentazione dei campi `title` e `description` usati dalla UI di Control
- I nodi oggetto annidati, wildcard (`*`) e gli elementi di array (`[]`) ereditano gli stessi metadati `title` / `description` quando esiste documentazione del campo corrispondente
- Anche i rami `anyOf` / `oneOf` / `allOf` ereditano gli stessi metadati di documentazione quando esiste documentazione del campo corrispondente
- Metadati best-effort dello schema live di Plugin + canale quando i manifest runtime possono essere caricati
- Uno schema di fallback pulito anche quando la configurazione corrente non è valida

RPC runtime correlata:

- `config.schema.lookup` restituisce un percorso di configurazione normalizzato con un nodo
  schema superficiale (`title`, `description`, `type`, `enum`, `const`, limiti comuni),
  metadati dei suggerimenti UI corrispondenti e riepiloghi dei figli immediati. Usalo per
  il drill-down con ambito percorso nella UI di Control o in client personalizzati.

```bash
openclaw config schema
```

Reindirizzalo in un file quando vuoi ispezionarlo o validarlo con altri strumenti:

```bash
openclaw config schema > openclaw.schema.json
```

### Percorsi

I percorsi usano la notazione dot o bracket:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Usa l'indice dell'elenco agenti per puntare a un agente specifico:

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

L'assegnazione di oggetti sostituisce il percorso di destinazione per impostazione predefinita. I percorsi protetti di map/list
che comunemente contengono voci aggiunte dall'utente, come `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` e
`auth.profiles`, rifiutano sostituzioni che rimuoverebbero voci esistenti a meno
che tu non passi `--replace`.

Usa `--merge` quando aggiungi voci a queste map:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Usa `--replace` solo quando vuoi intenzionalmente che il valore fornito diventi
l'intero valore di destinazione.

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

3. Modalità builder provider (solo per il percorso `secrets.providers.<alias>`):

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

- Le assegnazioni SecretRef vengono rifiutate sulle superfici mutabili a runtime non supportate (per esempio `hooks.token`, `commands.ownerDisplaySecret`, i token Webhook per thread-binding di Discord e il JSON creds di WhatsApp). Consulta [Superficie credenziali SecretRef](/it/reference/secretref-credential-surface).

L'analisi batch usa sempre il payload batch (`--batch-json`/`--batch-file`) come fonte di verità.
`--strict-json` / `--json` non cambiano il comportamento dell'analisi batch.

La modalità JSON path/value resta supportata sia per SecretRef sia per i provider:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flag del builder provider

Le destinazioni del builder provider devono usare `secrets.providers.<alias>` come percorso.

Flag comuni:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Provider env (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (ripetibile)

Provider file (`--provider-source file`):

- `--provider-path <path>` (obbligatorio)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

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

Usa `--dry-run` per validare le modifiche senza scrivere `openclaw.json`.

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

Comportamento del dry-run:

- Modalità builder: esegue controlli di risolvibilità SecretRef per ref/provider modificati.
- Modalità JSON (`--strict-json`, `--json` o modalità batch): esegue la validazione dello schema più i controlli di risolvibilità SecretRef.
- La validazione dei criteri viene eseguita anche per le superfici target SecretRef note e non supportate.
- I controlli dei criteri valutano l'intera configurazione dopo la modifica, quindi le scritture di oggetti padre (per esempio impostare `hooks` come oggetto) non possono aggirare la validazione delle superfici non supportate.
- I controlli exec SecretRef vengono saltati per impostazione predefinita durante il dry-run per evitare effetti collaterali dei comandi.
- Usa `--allow-exec` con `--dry-run` per attivare i controlli exec SecretRef (questo può eseguire comandi del provider).
- `--allow-exec` è solo per dry-run e genera errore se usato senza `--dry-run`.

`--dry-run --json` stampa un report leggibile da macchina:

- `ok`: indica se il dry-run è riuscito
- `operations`: numero di assegnazioni valutate
- `checks`: indica se sono stati eseguiti i controlli di schema/risolvibilità
- `checks.resolvabilityComplete`: indica se i controlli di risolvibilità sono stati completati (false quando le ref exec vengono saltate)
- `refsChecked`: numero di ref effettivamente risolte durante il dry-run
- `skippedExecRefs`: numero di ref exec saltate perché `--allow-exec` non era impostato
- `errors`: errori strutturati di schema/risolvibilità quando `ok=false`

### Forma dell'output JSON

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
      ref?: string, // present for resolvability errors
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

Se il dry-run fallisce:

- `config schema validation failed`: la forma della configurazione dopo la modifica non è valida; correggi il percorso/valore o la forma dell'oggetto provider/ref.
- `Config policy validation failed: unsupported SecretRef usage`: riporta quella credenziale a un input plaintext/stringa e mantieni SecretRef solo sulle superfici supportate.
- `SecretRef assignment(s) could not be resolved`: il provider/ref referenziato al momento non può essere risolto (variabile env mancante, puntatore file non valido, errore del provider exec o mancata corrispondenza provider/source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: il dry-run ha saltato ref exec; riesegui con `--allow-exec` se hai bisogno della validazione di risolvibilità exec.
- Per la modalità batch, correggi le voci che falliscono e riesegui `--dry-run` prima di scrivere.

## Sicurezza in scrittura

`openclaw config set` e gli altri writer di configurazione gestiti da OpenClaw validano l'intera
configurazione dopo la modifica prima di salvarla su disco. Se il nuovo payload non supera la
validazione dello schema o sembra una sovrascrittura distruttiva, la configurazione attiva resta invariata
e il payload rifiutato viene salvato accanto a essa come `openclaw.json.rejected.*`.
Il percorso della configurazione attiva deve essere un file regolare. I layout `openclaw.json`
con symlink non sono supportati per le scritture; usa `OPENCLAW_CONFIG_PATH` per puntare direttamente
al file reale.

Preferisci le scritture via CLI per piccole modifiche:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Se una scrittura viene rifiutata, ispeziona il payload salvato e correggi l'intera forma della configurazione:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Le scritture dirette dall'editor sono ancora consentite, ma il Gateway in esecuzione le tratta come
non attendibili finché non risultano valide. Le modifiche dirette non valide possono essere ripristinate dall'ultimo backup valido noto durante l'avvio o l'hot reload. Consulta
[Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#gateway-restored-last-known-good-config).

## Sottocomandi

- `config file`: stampa il percorso del file di configurazione attivo (risolto da `OPENCLAW_CONFIG_PATH` o dalla posizione predefinita). Il percorso deve indicare un file regolare, non un symlink.

Riavvia il Gateway dopo le modifiche.

## Validate

Valida la configurazione corrente rispetto allo schema attivo senza avviare il
Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Dopo che `openclaw config validate` va a buon fine, puoi usare la TUI locale per far sì che
un agente embedded confronti la configurazione attiva con la documentazione mentre validi
ogni modifica dallo stesso terminale:

Se la validazione sta già fallendo, inizia con `openclaw configure` oppure
`openclaw doctor --fix`. `openclaw chat` non aggira la protezione
contro la configurazione non valida.

```bash
openclaw chat
```

Poi all'interno della TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Ciclo di riparazione tipico:

- Chiedi all'agente di confrontare la configurazione corrente con la pagina della documentazione pertinente e di suggerire la correzione più piccola.
- Applica modifiche mirate con `openclaw config set` o `openclaw configure`.
- Esegui di nuovo `openclaw config validate` dopo ogni modifica.
- Se la validazione passa ma il runtime è ancora non sano, esegui `openclaw doctor` o `openclaw doctor --fix` per assistenza con migrazione e riparazione.

## Correlati

- [Riferimento CLI](/it/cli)
- [Configurazione](/it/gateway/configuration)
