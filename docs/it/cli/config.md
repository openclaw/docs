---
read_when:
    - Si desidera leggere o modificare la configurazione in modalità non interattiva
sidebarTitle: Config
summary: Riferimento CLI per `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Configurazione
x-i18n:
    generated_at: "2026-07-16T14:11:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 63be5cbac6c7db9c6b93ad690e5decab9f4ce7904e8b10f26a3b1e39e4729450
    source_path: cli/config.md
    workflow: 16
---

Helper non interattivi per `openclaw.json`: ottenere/impostare/modificare/rimuovere un valore in base al percorso, stampare lo schema, convalidare oppure stampare il percorso del file attivo. Eseguire `openclaw config` senza sottocomandi per aprire la stessa procedura guidata di `openclaw configure`.

<Note>
Quando `OPENCLAW_NIX_MODE=1`, OpenClaw considera `openclaw.json` immutabile. I comandi di sola lettura (`config get`, `config file`, `config schema`, `config validate`) continuano a funzionare; i comandi che scrivono la configurazione rifiutano l'operazione. Modificare invece il sorgente Nix dell'installazione; per la distribuzione ufficiale nix-openclaw, usare la [Guida rapida di nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) e impostare i valori sotto `programs.openclaw.config` o `instances.<name>.config`.
</Note>

## Opzioni principali

<ParamField path="--section <section>" type="string">
  Filtro ripetibile per le sezioni della configurazione guidata quando si esegue `openclaw config` senza sottocomandi.
</ParamField>

Sezioni guidate: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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

### Percorsi

Notazione con punti o parentesi quadre. Racchiudere tra virgolette i percorsi con parentesi negli esempi della shell, affinché zsh non espanda tramite glob `[0]`:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

Legge un valore dall'istantanea oscurata della configurazione (i segreti non vengono mai stampati). `--json` stampa il valore non elaborato come JSON; altrimenti stringhe/numeri/valori booleani vengono stampati senza formattazione, mentre oggetti/array vengono stampati come JSON formattato.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

Stampa il percorso del file di configurazione attivo, risolto da `OPENCLAW_CONFIG_PATH` o dalla posizione predefinita. Il percorso identifica un file normale, non un collegamento simbolico; vedere [Sicurezza della scrittura](#write-safety).

### `config schema`

Stampa su stdout lo schema JSON generato per `openclaw.json`.

<AccordionGroup>
  <Accordion title="Contenuto">
    - Lo schema di configurazione principale corrente, più un campo stringa principale `$schema` per gli strumenti dell'editor.
    - Metadati della documentazione dei campi `title` / `description` usati dalla Control UI.
    - I nodi di oggetti annidati, caratteri jolly (`*`) ed elementi di array (`[]`) ereditano gli stessi metadati `title` / `description` quando esiste la documentazione dei campi corrispondente.
    - Anche i rami `anyOf` / `oneOf` / `allOf` ereditano gli stessi metadati della documentazione.
    - Metadati dello schema di Plugin e canali in tempo reale, secondo il criterio del massimo sforzo, quando è possibile caricare i manifest di runtime.
    - Uno schema di ripiego pulito anche quando la configurazione corrente non è valida.

  </Accordion>
  <Accordion title="RPC di runtime correlata">
    `config.schema.lookup` restituisce un percorso di configurazione normalizzato con un nodo di schema superficiale (`title`, `description`, `type`, `enum`, `const`, limiti comuni), i metadati dei suggerimenti dell'interfaccia utente corrispondenti e i riepiloghi dei nodi figli immediati. Usarlo per l'analisi dettagliata limitata al percorso nella Control UI o nei client personalizzati.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Convalida la configurazione corrente rispetto allo schema attivo senza avviare il Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
Se la convalida non riesce già, iniziare con `openclaw configure` o `openclaw doctor --fix`. `openclaw chat` non aggira il controllo di configurazione non valida.
</Note>

## Valori

Quando possibile, i valori vengono analizzati come JSON5; altrimenti vengono trattati come stringhe non elaborate. Usare `--strict-json` per richiedere JSON standard senza ripiego su stringa (la sintassi esclusiva di JSON5, come commenti, virgole finali o chiavi senza virgolette, viene quindi rifiutata). `--json` è un alias legacy di `--strict-json` su `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` stampa il valore non elaborato come JSON invece del testo formattato per il terminale.

<Note>
Per impostazione predefinita, l'assegnazione di un oggetto sostituisce il percorso di destinazione. I percorsi protetti che comunemente contengono voci aggiunte dall'utente rifiutano le sostituzioni che rimuoverebbero voci esistenti, a meno che non venga specificato `--replace`: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` e `auth.profiles`.
</Note>

Usare `--merge` quando si aggiungono voci a tali mappe:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Usare `--replace` solo quando il valore fornito deve intenzionalmente diventare il valore completo della destinazione.

## Modalità di `config set`

<Tabs>
  <Tab title="Modalità valore">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="Modalità generatore SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Modalità generatore di provider">
    Destinata esclusivamente ai percorsi `secrets.providers.<alias>`:

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
Le assegnazioni SecretRef vengono rifiutate sulle superfici mutabili a runtime non supportate (ad esempio `hooks.token`, `commands.ownerDisplaySecret`, i token Webhook di associazione dei thread Discord e il JSON delle credenziali WhatsApp). Vedere [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface).
</Warning>

L'analisi batch usa sempre il payload batch (`--batch-json`/`--batch-file`) come fonte attendibile; `--strict-json` / `--json` non modificano il comportamento dell'analisi batch.

La modalità percorso/valore JSON funziona direttamente anche per SecretRef e provider:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Flag del generatore di provider

Le destinazioni del generatore di provider devono usare `secrets.providers.<alias>` come percorso.

<AccordionGroup>
  <Accordion title="Flag comuni">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Provider di ambiente (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (ripetibile)

  </Accordion>
  <Accordion title="Provider di file (--provider-source file)">
    - `--provider-path <path>` (obbligatorio)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Provider di esecuzione (--provider-source exec)">
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

Esempio di provider di esecuzione con protezione avanzata:

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

## `config patch`

Incollare o inviare tramite pipe una patch JSON5 con la stessa struttura della configurazione, invece di eseguire molti comandi `config set` basati sui percorsi. Gli oggetti vengono uniti ricorsivamente; gli array e i valori scalari sostituiscono la destinazione; `null` elimina il percorso di destinazione.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Inviare una patch tramite stdin per gli script di configurazione remota:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

Usare `--replace-path <path>` quando un oggetto o un array deve diventare esattamente il valore fornito anziché essere modificato ricorsivamente:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` esegue i controlli dello schema e della risolvibilità dei SecretRef senza scrivere. Per impostazione predefinita, durante la simulazione i SecretRef basati sull'esecuzione vengono ignorati; aggiungere `--allow-exec` quando si desidera intenzionalmente che la simulazione esegua i comandi del provider.

## Simulazione

`--dry-run` convalida le modifiche senza scrivere `openclaw.json`. Disponibile su `config set`, `config patch` e `config unset`.

```bash
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
  <Accordion title="Comportamento della simulazione">
    - Modalità builder: esegue i controlli di risolvibilità di SecretRef per i riferimenti/provider modificati.
    - Modalità JSON (`--strict-json`, `--json` o modalità batch): esegue la convalida dello schema e i controlli di risolvibilità di SecretRef.
    - La convalida dei criteri viene eseguita sull'intera configurazione risultante dalla modifica, quindi le scritture dell'oggetto padre (ad esempio, impostando `hooks` come oggetto) non possono aggirare la convalida delle superfici non supportate.
    - Per impostazione predefinita, i controlli delle SecretRef exec vengono ignorati per evitare effetti collaterali dei comandi; passare `--allow-exec` per abilitarli (ciò potrebbe eseguire i comandi del provider). `--allow-exec` è disponibile solo in modalità simulazione e genera un errore senza `--dry-run`.

  </Accordion>
  <Accordion title="Campi di --dry-run --json">
    - `ok`: indica se la simulazione è riuscita
    - `operations`: numero di assegnazioni valutate
    - `checks`: indica se sono stati eseguiti i controlli dello schema/della risolvibilità
    - `checks.resolvabilityComplete`: indica se i controlli di risolvibilità sono stati completati (false quando i riferimenti exec vengono ignorati)
    - `refsChecked`: numero di riferimenti effettivamente risolti durante la simulazione
    - `skippedExecRefs`: numero di riferimenti exec ignorati perché `--allow-exec` non era impostato
    - `errors`: errori strutturati relativi a percorsi mancanti, schema o risolvibilità quando `ok=false`

  </Accordion>
</AccordionGroup>

### Struttura dell'output JSON

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
      ref?: string, // presente per gli errori di risolvibilità
    },
  ],
}
```

<Tabs>
  <Tab title="Esempio di esito positivo">
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
          "message": "Errore: la variabile di ambiente \"MISSING_TEST_SECRET\" non è impostata.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Se la simulazione non riesce">
    - `config schema validation failed`: la struttura della configurazione risultante dalla modifica non è valida; correggere il percorso/valore o la struttura dell'oggetto provider/riferimento.
    - `Config policy validation failed: unsupported SecretRef usage`: riportare la credenziale all'input in testo normale/stringa; mantenere le SecretRef solo sulle superfici supportate.
    - `SecretRef assignment(s) could not be resolved`: al momento non è possibile risolvere il provider/riferimento specificato (variabile di ambiente mancante, puntatore al file non valido, errore del provider exec o mancata corrispondenza tra provider e origine).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: eseguire nuovamente con `--allow-exec` se è necessaria la convalida della risolvibilità exec.
    - Per la modalità batch, correggere le voci non riuscite ed eseguire nuovamente `--dry-run` prima della scrittura.

  </Accordion>
</AccordionGroup>

## Applicazione delle modifiche

Dopo ogni esecuzione riuscita di `config set` / `config patch` / `config unset`, la CLI mostra uno dei tre suggerimenti seguenti per indicare se il Gateway richiede un riavvio:

| Suggerimento                                        | Significato                                             |
| --------------------------------------------------- | ------------------------------------------------------- |
| `Restart the gateway to apply.`                     | Il percorso modificato richiede un riavvio completo.    |
| `Change will apply without restarting the gateway.` | Il ricaricamento a caldo lo rileva automaticamente.      |
| `No gateway restart needed.`                        | Non è cambiato nulla di rilevante per il runtime.        |

Le scritture in `plugins.entries` (o in qualsiasi relativo percorso secondario) richiedono sempre un riavvio, poiché la CLI non può verificare che siano caricati i metadati di ricaricamento di ogni plugin.

## Sicurezza della scrittura

`openclaw config set` e gli altri strumenti di scrittura della configurazione gestiti da OpenClaw convalidano l'intera configurazione risultante dalla modifica prima di salvarla su disco. Se il nuovo payload non supera la convalida dello schema o sembra una sovrascrittura distruttiva, la configurazione attiva rimane invariata e il payload rifiutato viene salvato accanto a essa come `openclaw.json.rejected.*`.

Le scritture gestite da OpenClaw serializzano nuovamente JSON5 come JSON standard. Quando l'origine contiene commenti, lo strumento di scrittura mostra un avviso immediatamente prima di rimuoverli; utilizzare direttamente un editor quando è importante conservarli.

<Warning>
Il percorso della configurazione attiva deve essere un file normale. Le strutture `openclaw.json` con collegamenti simbolici non sono supportate per le scritture; utilizzare invece `OPENCLAW_CONFIG_PATH` affinché punti direttamente al file effettivo.
</Warning>

Per le piccole modifiche, preferire le scritture tramite CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Se una scrittura viene rifiutata, esaminare il payload salvato e correggere l'intera struttura della configurazione:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Le scritture dirette tramite editor sono comunque consentite, ma il Gateway in esecuzione le considera non attendibili finché non vengono convalidate. Le modifiche dirette non valide impediscono l'avvio o vengono ignorate dal ricaricamento a caldo; il Gateway non riscrive `openclaw.json`. Eseguire `openclaw doctor --fix` per riparare una configurazione con prefisso o sovrascritta oppure per ripristinare l'ultima copia valida nota. Consultare [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#gateway-rejected-invalid-config).

Il ripristino dell'intero file è riservato alla riparazione tramite doctor. Le modifiche allo schema dei plugin o la mancata corrispondenza di `minHostVersion` continuano a generare errori espliciti anziché ripristinare impostazioni utente non correlate, come modelli, provider, profili di autenticazione, canali, esposizione del gateway, strumenti, memoria, browser o configurazione cron.

## Ciclo di riparazione

Dopo il completamento di `openclaw config validate`, utilizzare la TUI locale per consentire a un agente incorporato di confrontare la configurazione attiva con la documentazione mentre ogni modifica viene convalidata dallo stesso terminale:

```bash
openclaw chat
```

All'interno della TUI, un `!` iniziale esegue un comando shell locale letterale (dopo una richiesta di conferma una tantum per sessione):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="Confrontare con la documentazione">
    Chiedere all'agente di confrontare la configurazione corrente con la pagina pertinente della documentazione e di suggerire la correzione minima.
  </Step>
  <Step title="Applicare modifiche mirate">
    Applicare modifiche mirate con `openclaw config set` o `openclaw configure`.
  </Step>
  <Step title="Convalidare nuovamente">
    Eseguire nuovamente `openclaw config validate` dopo ogni modifica.
  </Step>
  <Step title="Usare doctor per i problemi di runtime">
    Se la convalida riesce ma il runtime presenta ancora problemi, eseguire `openclaw doctor` o `openclaw doctor --fix` per ottenere assistenza con la migrazione e la riparazione.
  </Step>
</Steps>

## Argomenti correlati

- [Riferimento della CLI](/it/cli)
- [Configurazione](/it/gateway/configuration)
