---
read_when:
    - Vuoi leggere o modificare la configurazione in modo non interattivo
summary: Riferimento CLI per `openclaw config` (get/set/unset/file/schema/validate)
title: config
x-i18n:
    generated_at: "2026-04-23T08:26:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b496b6c02eeb144bfe800b801ea48a178b02bc7a87197dbf189b27d6fcf41c9
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Helper di configurazione per modifiche non interattive in `openclaw.json`: ottieni/imposta/rimuovi/file/schema/validate
valori per percorso e stampa il file di configurazione attivo. Esegui senza sottocomando per
aprire la procedura guidata di configurazione (come `openclaw configure`).

Opzioni root:

- `--section <section>`: filtro ripetibile per sezione della configurazione guidata quando esegui `openclaw config` senza un sottocomando

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
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Stampa su stdout lo schema JSON generato per `openclaw.json` come JSON.

Cosa include:

- Lo schema di configurazione root corrente, più un campo stringa root `$schema` per gli strumenti dell'editor
- I metadati di documentazione `title` e `description` dei campi usati dalla UI di Control
- Gli oggetti annidati, i nodi wildcard (`*`) e gli elementi di array (`[]`) ereditano gli stessi metadati `title` / `description` quando esiste documentazione corrispondente per il campo
- Anche i rami `anyOf` / `oneOf` / `allOf` ereditano gli stessi metadati di documentazione quando esiste documentazione corrispondente per il campo
- Metadati best-effort dello schema live di Plugin + canale quando è possibile caricare i manifest runtime
- Uno schema di fallback pulito anche quando la configurazione corrente non è valida

RPC runtime correlata:

- `config.schema.lookup` restituisce un percorso di configurazione normalizzato con un
  nodo schema superficiale (`title`, `description`, `type`, `enum`, `const`, limiti comuni),
  metadati di hint UI corrispondenti e riepiloghi dei figli immediati. Usalo per
  il drill-down con ambito sul percorso nella UI di Control o in client personalizzati.

```bash
openclaw config schema
```

Reindirizzalo a un file quando vuoi ispezionarlo o validarlo con altri strumenti:

```bash
openclaw config schema > openclaw.schema.json
```

### Percorsi

I percorsi usano la notazione con punti o parentesi quadre:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Usa l'indice della lista agenti per puntare a un agente specifico:

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

`config get <path> --json` stampa il valore grezzo come JSON invece che come testo formattato per terminale.

L'assegnazione di oggetti sostituisce per impostazione predefinita il percorso di destinazione. I percorsi protetti di mappe/liste
che spesso contengono voci aggiunte dagli utenti, come `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` e
`auth.profiles`, rifiutano sostituzioni che rimuoverebbero voci esistenti a meno
che tu non passi `--replace`.

Usa `--merge` quando aggiungi voci a queste mappe:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Usa `--replace` solo quando vuoi intenzionalmente che il valore fornito diventi
il valore completo della destinazione.

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

3. Modalità builder provider (solo per percorsi `secrets.providers.<alias>`):

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

- Le assegnazioni SecretRef vengono rifiutate sulle superfici mutabili a runtime non supportate (ad esempio `hooks.token`, `commands.ownerDisplaySecret`, token Webhook di binding dei thread Discord e JSON delle credenziali WhatsApp). Vedi [Superficie credenziali SecretRef](/it/reference/secretref-credential-surface).

L'analisi batch usa sempre il payload batch (`--batch-json`/`--batch-file`) come fonte di verità.
`--strict-json` / `--json` non modificano il comportamento di analisi batch.

La modalità JSON percorso/valore resta supportata sia per SecretRef sia per provider:

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
- Modalità JSON (`--strict-json`, `--json` o modalità batch): esegue validazione dello schema più controlli di risolvibilità SecretRef.
- Viene eseguita anche la validazione dei criteri per superfici di destinazione SecretRef note e non supportate.
- I controlli dei criteri valutano l'intera configurazione dopo la modifica, quindi scritture su oggetti parent (ad esempio impostare `hooks` come oggetto) non possono aggirare la validazione delle superfici non supportate.
- I controlli SecretRef exec vengono saltati per impostazione predefinita durante il dry-run per evitare effetti collaterali dei comandi.
- Usa `--allow-exec` con `--dry-run` per abilitare i controlli SecretRef exec (questo può eseguire i comandi del provider).
- `--allow-exec` è solo per dry-run e genera errore se usato senza `--dry-run`.

`--dry-run --json` stampa un report leggibile da macchina:

- `ok`: se il dry-run è riuscito
- `operations`: numero di assegnazioni valutate
- `checks`: se sono stati eseguiti controlli di schema/risolvibilità
- `checks.resolvabilityComplete`: se i controlli di risolvibilità sono stati completati (false quando i ref exec vengono saltati)
- `refsChecked`: numero di ref effettivamente risolti durante il dry-run
- `skippedExecRefs`: numero di ref exec saltati perché `--allow-exec` non era impostato
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
      ref?: string, // presente per gli errori di risolvibilità
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

- `config schema validation failed`: la forma della configurazione dopo la modifica non è valida; correggi percorso/valore o la forma dell'oggetto provider/ref.
- `Config policy validation failed: unsupported SecretRef usage`: riporta quella credenziale a un input plaintext/stringa e mantieni i SecretRef solo sulle superfici supportate.
- `SecretRef assignment(s) could not be resolved`: il provider/ref referenziato attualmente non può essere risolto (variabile env mancante, puntatore file non valido, errore del provider exec o mismatch provider/source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: il dry-run ha saltato i ref exec; riesegui con `--allow-exec` se hai bisogno della validazione di risolvibilità exec.
- Per la modalità batch, correggi le voci in errore e riesegui `--dry-run` prima di scrivere.

## Sicurezza di scrittura

`openclaw config set` e gli altri writer di configurazione gestiti da OpenClaw validano l'intera
configurazione dopo la modifica prima di salvarla su disco. Se il nuovo payload non supera la validazione
dello schema o sembra una sovrascrittura distruttiva, la configurazione attiva resta invariata
e il payload rifiutato viene salvato accanto ad essa come `openclaw.json.rejected.*`.
Il percorso della configurazione attiva deve essere un file regolare. Layout con `openclaw.json`
collegato tramite symlink non sono supportati per le scritture; usa `OPENCLAW_CONFIG_PATH` per puntare direttamente
al file reale.

Preferisci le scritture CLI per piccole modifiche:

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

Le scritture dirette dell'editor sono ancora consentite, ma il Gateway in esecuzione le tratta come
non attendibili finché non vengono validate. Le modifiche dirette non valide possono essere ripristinate dall'ultimo backup valido noto durante l'avvio o il ricaricamento a caldo. Vedi
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

Dopo che `openclaw config validate` va a buon fine, puoi usare la TUI locale per far sì
che un agente incorporato confronti la configurazione attiva con la documentazione mentre validi
ogni modifica dallo stesso terminale:

Se la validazione sta già fallendo, inizia con `openclaw configure` oppure
`openclaw doctor --fix`. `openclaw chat` non aggira la protezione contro la
configurazione non valida.

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

Ciclo tipico di riparazione:

- Chiedi all'agente di confrontare la tua configurazione corrente con la pagina della documentazione pertinente e suggerire la correzione più piccola.
- Applica modifiche mirate con `openclaw config set` o `openclaw configure`.
- Riesegui `openclaw config validate` dopo ogni modifica.
- Se la validazione passa ma il runtime continua a non essere sano, esegui `openclaw doctor` oppure `openclaw doctor --fix` per assistenza con migrazione e riparazione.
