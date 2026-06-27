---
read_when:
    - Vuoi leggere o modificare la configurazione in modo non interattivo
sidebarTitle: Config
summary: Riferimento CLI per `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Configurazione
x-i18n:
    generated_at: "2026-06-27T17:18:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d658c0edbf900565c4645c1d24a9f3e092a3d8a4fec85f7fc7e3989550d13197
    source_path: cli/config.md
    workflow: 16
---

Helper di configurazione per modifiche non interattive in `openclaw.json`: ottieni/imposta/applica patch/rimuovi/file/schema/convalida valori per percorso e stampa il file di configurazione attivo. Esegui senza un sottocomando per aprire la procedura guidata di configurazione (uguale a `openclaw configure`).

<Note>
Quando `OPENCLAW_NIX_MODE=1`, OpenClaw tratta `openclaw.json` come immutabile. I comandi di sola lettura come `config get`, `config file`, `config schema` e `config validate` continuano a funzionare, ma i comandi che scrivono la configurazione vengono rifiutati. Gli agenti dovrebbero invece modificare il sorgente Nix dell'installazione; per la distribuzione first-party nix-openclaw, usa [Avvio rapido di nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) e imposta i valori sotto `programs.openclaw.config` o `instances.<name>.config`.
</Note>

## Opzioni root

<ParamField path="--section <section>" type="string">
  Filtro ripetibile per sezioni della configurazione guidata quando esegui `openclaw config` senza un sottocomando.
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
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Stampa lo schema JSON generato per `openclaw.json` su stdout come JSON.

<AccordionGroup>
  <Accordion title="Cosa include">
    - Lo schema di configurazione root corrente, più un campo stringa root `$schema` per gli strumenti degli editor.
    - Metadati documentali `title` e `description` dei campi usati dalla Control UI.
    - I nodi di oggetti annidati, wildcard (`*`) ed elementi di array (`[]`) ereditano gli stessi metadati `title` / `description` quando esiste documentazione del campo corrispondente.
    - Anche i rami `anyOf` / `oneOf` / `allOf` ereditano gli stessi metadati documentali quando esiste documentazione del campo corrispondente.
    - Metadati di schema di Plugin e canali live con approccio best-effort quando i manifest di runtime possono essere caricati.
    - Uno schema di fallback pulito anche quando la configurazione corrente non è valida.

  </Accordion>
  <Accordion title="RPC runtime correlata">
    `config.schema.lookup` restituisce un percorso di configurazione normalizzato con un nodo schema superficiale (`title`, `description`, `type`, `enum`, `const`, limiti comuni), metadati di suggerimento UI corrispondenti e riepiloghi dei figli immediati. Usalo per il drill-down limitato al percorso nella Control UI o in client personalizzati.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Invialo tramite pipe a un file quando vuoi ispezionarlo o convalidarlo con altri strumenti:

```bash
openclaw config schema > openclaw.schema.json
```

### Percorsi

I percorsi usano la notazione con punti o parentesi quadre. Racchiudi tra virgolette i percorsi con notazione a parentesi quadre negli esempi shell, così shell come zsh non espandono `[0]` come glob prima che OpenClaw riceva il percorso:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

Usa l'indice dell'elenco agenti per puntare a un agente specifico:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## Valori

I valori vengono analizzati come JSON5 quando possibile; altrimenti sono trattati come stringhe. Usa `--strict-json` per richiedere l'analisi JSON5. `--json` resta supportato come alias legacy.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` stampa il valore grezzo come JSON invece che come testo formattato per il terminale.

<Note>
L'assegnazione di un oggetto sostituisce per impostazione predefinita il percorso di destinazione. I percorsi di mappe/elenchi protetti che comunemente contengono voci aggiunte dagli utenti, come `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` e `auth.profiles`, rifiutano le sostituzioni che rimuoverebbero voci esistenti a meno che tu non passi `--replace`.
</Note>

Usa `--merge` quando aggiungi voci a quelle mappe:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Usa `--replace` solo quando vuoi intenzionalmente che il valore fornito diventi il valore di destinazione completo.

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
    La modalità builder provider punta solo a percorsi `secrets.providers.<alias>`:

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
Le assegnazioni SecretRef vengono rifiutate su superfici modificabili a runtime non supportate (per esempio `hooks.token`, `commands.ownerDisplaySecret`, token Webhook di binding dei thread Discord e JSON delle credenziali WhatsApp). Vedi [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface).
</Warning>

L'analisi batch usa sempre il payload batch (`--batch-json`/`--batch-file`) come fonte di verità. `--strict-json` / `--json` non modificano il comportamento dell'analisi batch.

## `config patch`

Usa `config patch` quando vuoi incollare o passare tramite pipe una patch con forma di configurazione invece di eseguire molti comandi `config set` basati su percorso. L'input è un oggetto JSON5. Gli oggetti vengono uniti ricorsivamente, array e valori scalari sostituiscono il valore di destinazione e `null` elimina il percorso di destinazione.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Puoi anche passare una patch tramite pipe su stdin, utile per script di configurazione remota:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Esempio di patch:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

Usa `--replace-path <path>` quando un oggetto o un array deve diventare esattamente il valore fornito invece di essere sottoposto a patch ricorsiva:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` esegue controlli di schema e di risolvibilità SecretRef senza scrivere. Le SecretRef basate su exec vengono saltate per impostazione predefinita durante il dry-run; aggiungi `--allow-exec` quando vuoi intenzionalmente che il dry-run esegua comandi provider.

La modalità percorso/valore JSON resta supportata sia per SecretRef sia per provider:

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

<AccordionGroup>
  <Accordion title="Comportamento del dry-run">
    - Modalità builder: esegue controlli di risolvibilità SecretRef per ref/provider modificati.
    - Modalità JSON (`--strict-json`, `--json` o modalità batch): esegue la convalida dello schema più controlli di risolvibilità SecretRef.
    - La convalida delle policy viene eseguita anche per superfici di destinazione SecretRef note e non supportate.
    - I controlli di policy valutano l'intera configurazione post-modifica, quindi le scritture di oggetti padre (per esempio impostare `hooks` come oggetto) non possono aggirare la convalida delle superfici non supportate.
    - I controlli SecretRef exec vengono saltati per impostazione predefinita durante il dry-run per evitare effetti collaterali dei comandi.
    - Usa `--allow-exec` con `--dry-run` per aderire esplicitamente ai controlli SecretRef exec (questo può eseguire comandi provider).
    - `--allow-exec` vale solo per il dry-run e genera un errore se usato senza `--dry-run`.

  </Accordion>
  <Accordion title="Campi di --dry-run --json">
    `--dry-run --json` stampa un report leggibile da macchina:

    - `ok`: se l'esecuzione di prova è riuscita
    - `operations`: numero di assegnazioni valutate
    - `checks`: se i controlli di schema/risolvibilità sono stati eseguiti
    - `checks.resolvabilityComplete`: se i controlli di risolvibilità sono stati eseguiti fino al completamento (false quando i riferimenti exec vengono saltati)
    - `refsChecked`: numero di riferimenti effettivamente risolti durante l'esecuzione di prova
    - `skippedExecRefs`: numero di riferimenti exec saltati perché `--allow-exec` non era impostato
    - `errors`: errori strutturati di percorso mancante, schema o risolvibilità quando `ok=false`

  </Accordion>
</AccordionGroup>

### Forma dell'output JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder" | "unset", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "missing-path" | "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

<Tabs>
  <Tab title="Success example">
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
  <Tab title="Failure example">
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
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="If dry-run fails">
    - `config schema validation failed`: la forma della configurazione dopo la modifica non è valida; correggi il percorso/valore o la forma dell'oggetto provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: sposta di nuovo quella credenziale nell'input in testo semplice/stringa e mantieni i SecretRef solo sulle superfici supportate.
    - `SecretRef assignment(s) could not be resolved`: il provider/ref referenziato al momento non può essere risolto (variabile di ambiente mancante, puntatore file non valido, errore del provider exec o mancata corrispondenza provider/sorgente).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: l'esecuzione di prova ha saltato i riferimenti exec; riesegui con `--allow-exec` se ti serve la validazione della risolvibilità exec.
    - Per la modalità batch, correggi le voci non riuscite e riesegui `--dry-run` prima di scrivere.

  </Accordion>
</AccordionGroup>

## Sicurezza di scrittura

`openclaw config set` e gli altri writer di configurazione di proprietà di OpenClaw validano l'intera configurazione dopo la modifica prima di salvarla su disco. Se il nuovo payload non supera la validazione dello schema o sembra una sovrascrittura distruttiva, la configurazione attiva viene lasciata invariata e il payload rifiutato viene salvato accanto a essa come `openclaw.json.rejected.*`.

<Warning>
Il percorso della configurazione attiva deve essere un file normale. I layout `openclaw.json` con symlink non sono supportati per le scritture; usa invece `OPENCLAW_CONFIG_PATH` per puntare direttamente al file reale.
</Warning>

Preferisci le scritture tramite CLI per modifiche piccole:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Se una scrittura viene rifiutata, ispeziona il payload salvato e correggi la forma completa della configurazione:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Le scritture dirette dall'editor sono ancora consentite, ma il Gateway in esecuzione le considera non attendibili finché non vengono validate. Le modifiche dirette non valide causano il fallimento dell'avvio o vengono saltate dal ricaricamento a caldo; il Gateway non riscrive `openclaw.json`. Esegui `openclaw doctor --fix` per riparare configurazioni con prefisso/sovrascritte o ripristinare l'ultima copia nota valida. Vedi [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#gateway-rejected-invalid-config).

Il ripristino dell'intero file è riservato alla riparazione tramite doctor. Le modifiche allo schema del Plugin o uno scostamento di `minHostVersion` restano espliciti invece di ripristinare impostazioni utente non correlate come modelli, provider, profili di autenticazione, canali, esposizione del Gateway, strumenti, memoria, browser o configurazione cron.

## Sottocomandi

- `config file`: stampa il percorso del file di configurazione attivo (risolto da `OPENCLAW_CONFIG_PATH` o dalla posizione predefinita). Il percorso deve indicare un file normale, non un symlink.

Riavvia il gateway dopo le modifiche.

## Validare

Valida la configurazione corrente rispetto allo schema attivo senza avviare il gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Dopo che `openclaw config validate` passa, puoi usare la TUI locale per far confrontare a un agente incorporato la configurazione attiva con la documentazione mentre validi ogni modifica dallo stesso terminale:

<Note>
Se la validazione sta già fallendo, inizia con `openclaw configure` o `openclaw doctor --fix`. `openclaw chat` non aggira la protezione contro configurazioni non valide.
</Note>

```bash
openclaw chat
```

Poi dentro la TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Ciclo di riparazione tipico:

<Steps>
  <Step title="Compare with docs">
    Chiedi all'agente di confrontare la tua configurazione corrente con la pagina della documentazione pertinente e di suggerire la correzione più piccola.
  </Step>
  <Step title="Apply targeted edits">
    Applica modifiche mirate con `openclaw config set` o `openclaw configure`.
  </Step>
  <Step title="Re-validate">
    Riesegui `openclaw config validate` dopo ogni modifica.
  </Step>
  <Step title="Doctor for runtime issues">
    Se la validazione passa ma il runtime è ancora non sano, esegui `openclaw doctor` o `openclaw doctor --fix` per assistenza con migrazione e riparazione.
  </Step>
</Steps>

## Correlati

- [Riferimento CLI](/it/cli)
- [Configurazione](/it/gateway/configuration)
