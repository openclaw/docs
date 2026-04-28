---
read_when:
    - Vuoi leggere o modificare la config in modo non interattivo
sidebarTitle: Config
summary: Riferimento CLI per `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: Config
x-i18n:
    generated_at: "2026-04-26T11:25:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7871ee03a1da6ab5d0881ace7579ce101a89e9f9d05d1a720ff34fd31fa12a9d
    source_path: cli/config.md
    workflow: 15
---

Helper Config per modifiche non interattive in `openclaw.json`: ottieni/imposta/rimuovi/file/schema/validate valori per percorso e stampa il file config attivo. Esegui senza un sottocomando per aprire la procedura guidata di configurazione (come `openclaw configure`).

## Opzioni root

<ParamField path="--section <section>" type="string">
  Filtro ripetibile delle sezioni della configurazione guidata quando esegui `openclaw config` senza un sottocomando.
</ParamField>

Sezioni guidate supportate: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

## Esempi

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
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

Stampa lo schema JSON generato per `openclaw.json` su stdout come JSON.

<AccordionGroup>
  <Accordion title="Cosa include">
    - Lo schema root corrente della config, più un campo stringa root `$schema` per gli strumenti dell’editor.
    - I metadati di documentazione dei campi `title` e `description` usati dalla Control UI.
    - Gli oggetti annidati, i nodi wildcard (`*`) e quelli degli elementi array (`[]`) ereditano gli stessi metadati `title` / `description` quando esiste documentazione corrispondente per il campo.
    - Anche i rami `anyOf` / `oneOf` / `allOf` ereditano gli stessi metadati di documentazione quando esiste documentazione corrispondente per il campo.
    - Metadati best-effort dello schema live di Plugin + canale quando i manifest runtime possono essere caricati.
    - Uno schema di fallback pulito anche quando la config corrente non è valida.

  </Accordion>
  <Accordion title="RPC runtime correlata">
    `config.schema.lookup` restituisce un percorso config normalizzato con un nodo schema superficiale (`title`, `description`, `type`, `enum`, `const`, limiti comuni), metadati dei suggerimenti UI corrispondenti e riepiloghi dei figli immediati. Usalo per il drill-down con ambito di percorso nella Control UI o in client personalizzati.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Reindirizzalo in un file quando vuoi ispezionarlo o validarlo con altri strumenti:

```bash
openclaw config schema > openclaw.schema.json
```

### Percorsi

I percorsi usano la notazione con punto o con parentesi quadre:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Usa l’indice della lista degli agenti per puntare a un agente specifico:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Valori

I valori vengono analizzati come JSON5 quando possibile; altrimenti vengono trattati come stringhe. Usa `--strict-json` per richiedere l’analisi JSON5. `--json` resta supportato come alias legacy.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` stampa il valore grezzo come JSON invece che come testo formattato per il terminale.

<Note>
L’assegnazione di oggetti sostituisce per impostazione predefinita il percorso di destinazione. I percorsi protetti di map/list che spesso contengono voci aggiunte dall’utente, come `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` e `auth.profiles`, rifiutano sostituzioni che rimuoverebbero voci esistenti a meno che non passi `--replace`.
</Note>

Usa `--merge` quando aggiungi voci a queste mappe:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Usa `--replace` solo quando vuoi intenzionalmente che il valore fornito diventi il valore completo della destinazione.

## Modalità di `config set`

`openclaw config set` supporta quattro stili di assegnazione:

<Tabs>
  <Tab title="Modalità valore">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="Modalità builder SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Modalità builder provider">
    La modalità builder provider punta solo ai percorsi `secrets.providers.<alias>`:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Modalità batch">
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

  </Tab>
</Tabs>

<Warning>
Le assegnazioni SecretRef vengono rifiutate sulle superfici supportate dal runtime non mutabili (ad esempio `hooks.token`, `commands.ownerDisplaySecret`, i token Webhook di binding thread di Discord e il JSON delle credenziali di WhatsApp). Consulta [Superficie credenziali SecretRef](/it/reference/secretref-credential-surface).
</Warning>

L’analisi batch usa sempre il payload batch (`--batch-json`/`--batch-file`) come fonte di verità. `--strict-json` / `--json` non cambiano il comportamento di analisi batch.

La modalità JSON percorso/valore resta supportata sia per SecretRef sia per i provider:

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

<AccordionGroup>
  <Accordion title="Flag comuni">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Provider env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (ripetibile)

  </Accordion>
  <Accordion title="Provider file (--provider-source file)">
    - `--provider-path <path>` (obbligatorio)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Provider exec (--provider-source exec)">
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

  </Accordion>
</AccordionGroup>

Esempio di provider exec con hardening:

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

<AccordionGroup>
  <Accordion title="Comportamento di dry-run">
    - Modalità builder: esegue controlli di risolvibilità SecretRef per ref/provider modificati.
    - Modalità JSON (`--strict-json`, `--json` o modalità batch): esegue la validazione dello schema più i controlli di risolvibilità SecretRef.
    - La validazione delle policy viene eseguita anche per superfici target SecretRef supportate non mutabili conosciute.
    - I controlli delle policy valutano l’intera config dopo la modifica, quindi le scritture su oggetti padre (ad esempio impostare `hooks` come oggetto) non possono aggirare la validazione delle superfici non supportate.
    - I controlli SecretRef exec vengono saltati per impostazione predefinita durante il dry-run per evitare effetti collaterali dei comandi.
    - Usa `--allow-exec` con `--dry-run` per abilitare i controlli SecretRef exec (questo può eseguire comandi provider).
    - `--allow-exec` vale solo per il dry-run e genera un errore se usato senza `--dry-run`.

  </Accordion>
  <Accordion title="Campi di --dry-run --json">
    `--dry-run --json` stampa un report leggibile da macchina:

    - `ok`: se il dry-run è riuscito
    - `operations`: numero di assegnazioni valutate
    - `checks`: se sono stati eseguiti i controlli di schema/risolvibilità
    - `checks.resolvabilityComplete`: se i controlli di risolvibilità sono stati completati (false quando i ref exec vengono saltati)
    - `refsChecked`: numero di ref effettivamente risolti durante il dry-run
    - `skippedExecRefs`: numero di ref exec saltati perché `--allow-exec` non era impostato
    - `errors`: errori strutturati di schema/risolvibilità quando `ok=false`

  </Accordion>
</AccordionGroup>

### Forma dell’output JSON

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

<Tabs>
  <Tab title="Esempio di successo">
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
  </Tab>
  <Tab title="Esempio di errore">
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
          "message": "Error: La variabile d'ambiente \"MISSING_TEST_SECRET\" non è impostata.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Se il dry-run non riesce">
    - `config schema validation failed`: la forma della config dopo la modifica non è valida; correggi percorso/valore o la forma dell’oggetto provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: riporta quella credenziale a un input plaintext/stringa e mantieni SecretRef solo sulle superfici supportate.
    - `SecretRef assignment(s) could not be resolved`: il provider/ref referenziato attualmente non può essere risolto (variabile d’ambiente mancante, puntatore file non valido, errore del provider exec o mancata corrispondenza provider/source).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: il dry-run ha saltato i ref exec; riesegui con `--allow-exec` se hai bisogno della validazione di risolvibilità exec.
    - Per la modalità batch, correggi le voci che falliscono e riesegui `--dry-run` prima di scrivere.

  </Accordion>
</AccordionGroup>

## Sicurezza in scrittura

`openclaw config set` e gli altri writer di config gestiti da OpenClaw validano l’intera config dopo la modifica prima di eseguire il commit su disco. Se il nuovo payload fallisce la validazione dello schema o sembra una sovrascrittura distruttiva, la config attiva resta invariata e il payload rifiutato viene salvato accanto ad essa come `openclaw.json.rejected.*`.

<Warning>
Il percorso della config attiva deve essere un file regolare. I layout `openclaw.json` con symlink non sono supportati per la scrittura; usa invece `OPENCLAW_CONFIG_PATH` per puntare direttamente al file reale.
</Warning>

Preferisci le scritture tramite CLI per modifiche piccole:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Se una scrittura viene rifiutata, ispeziona il payload salvato e correggi la forma completa della config:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Le scritture dirette dall’editor sono ancora consentite, ma il Gateway in esecuzione le considera non attendibili finché non risultano valide. Le modifiche dirette non valide possono essere ripristinate dall’ultimo backup valido noto durante l’avvio o l’hot reload. Consulta [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#gateway-restored-last-known-good-config).

Il ripristino dell’intero file è riservato a config globalmente danneggiate, come errori di parsing, errori di schema a livello root, errori di migrazione legacy o errori misti tra Plugin e root. Se la validazione fallisce solo sotto `plugins.entries.<id>...`, OpenClaw mantiene in posizione il file `openclaw.json` attivo e segnala invece il problema locale del Plugin, anziché ripristinare `.last-good`. Questo evita che modifiche dello schema del Plugin o disallineamenti di `minHostVersion` riportino indietro impostazioni utente non correlate, come modelli, provider, profili auth, canali, esposizione del gateway, strumenti, memoria, browser o config Cron.

## Sottocomandi

- `config file`: stampa il percorso del file config attivo (risolto da `OPENCLAW_CONFIG_PATH` o dalla posizione predefinita). Il percorso deve indicare un file regolare, non un symlink.

Riavvia il Gateway dopo le modifiche.

## Validate

Valida la config corrente rispetto allo schema attivo senza avviare il Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Dopo che `openclaw config validate` va a buon fine, puoi usare la TUI locale per fare in modo che un agente incorporato confronti la config attiva con la documentazione mentre validi ogni modifica dallo stesso terminale:

<Note>
Se la validazione sta già fallendo, inizia con `openclaw configure` o `openclaw doctor --fix`. `openclaw chat` non aggira il controllo della config non valida.
</Note>

```bash
openclaw chat
```

Poi, dentro la TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Ciclo tipico di riparazione:

<Steps>
  <Step title="Confronta con la documentazione">
    Chiedi all’agente di confrontare la tua config corrente con la pagina della documentazione pertinente e di suggerire la correzione più piccola possibile.
  </Step>
  <Step title="Applica modifiche mirate">
    Applica modifiche mirate con `openclaw config set` o `openclaw configure`.
  </Step>
  <Step title="Convalida di nuovo">
    Riesegui `openclaw config validate` dopo ogni modifica.
  </Step>
  <Step title="Doctor per problemi runtime">
    Se la validazione passa ma il runtime è ancora non sano, esegui `openclaw doctor` o `openclaw doctor --fix` per ricevere aiuto su migrazione e riparazione.
  </Step>
</Steps>

## Correlati

- [Riferimento CLI](/it/cli)
- [Configuration](/it/gateway/configuration)
