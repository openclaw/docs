---
read_when:
    - Vuoi leggere o modificare la configurazione in modo non interattivo
sidebarTitle: Config
summary: Riferimento CLI per `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Configurazione
x-i18n:
    generated_at: "2026-07-12T06:53:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a9531407b2314d1a6bc05a87eb7efb6c37a847378b150125693f4d59733a2e9
    source_path: cli/config.md
    workflow: 16
---

Helper non interattivi per `openclaw.json`: ottenere/impostare/modificare/rimuovere un valore tramite percorso, stampare lo schema, convalidare oppure stampare il percorso del file attivo. Esegui `openclaw config` senza sottocomandi per aprire la stessa procedura guidata di `openclaw configure`.

<Note>
Quando `OPENCLAW_NIX_MODE=1`, OpenClaw considera `openclaw.json` immutabile. I comandi di sola lettura (`config get`, `config file`, `config schema`, `config validate`) continuano a funzionare; i comandi che scrivono la configurazione vengono rifiutati. Modifica invece il sorgente Nix dell'installazione; per la distribuzione ufficiale nix-openclaw, usa la [guida rapida di nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) e imposta i valori in `programs.openclaw.config` o `instances.<name>.config`.
</Note>

## Opzioni principali

<ParamField path="--section <section>" type="string">
  Filtro ripetibile delle sezioni della configurazione guidata quando esegui `openclaw config` senza un sottocomando.
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

Notazione con punti o parentesi quadre. Negli esempi della shell, racchiudi tra virgolette i percorsi con parentesi quadre affinché zsh non espanda `[0]` come glob:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

Legge un valore dall'istantanea oscurata della configurazione (i segreti non vengono mai stampati). `--json` stampa il valore non elaborato come JSON; altrimenti stringhe, numeri e valori booleani vengono stampati senza formattazione, mentre oggetti e array vengono stampati come JSON formattato.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

Stampa il percorso del file di configurazione attivo, risolto da `OPENCLAW_CONFIG_PATH` o dalla posizione predefinita. Il percorso identifica un file normale, non un collegamento simbolico; consulta [Sicurezza della scrittura](#write-safety).

### `config schema`

Stampa nello standard output lo schema JSON generato per `openclaw.json`.

<AccordionGroup>
  <Accordion title="What it includes">
    - Lo schema attuale della configurazione principale, oltre a un campo stringa `$schema` principale per gli strumenti dell'editor.
    - I metadati della documentazione dei campi `title` / `description` usati dall'interfaccia di controllo.
    - I nodi degli oggetti annidati, con carattere jolly (`*`) e degli elementi degli array (`[]`) ereditano gli stessi metadati `title` / `description` quando esiste la documentazione dei campi corrispondenti.
    - Anche i rami `anyOf` / `oneOf` / `allOf` ereditano gli stessi metadati della documentazione.
    - Metadati dello schema aggiornati, per quanto possibile, per Plugin e canali quando è possibile caricare i manifest di runtime.
    - Uno schema di ripiego pulito anche quando la configurazione attuale non è valida.

  </Accordion>
  <Accordion title="Related runtime RPC">
    `config.schema.lookup` restituisce un percorso di configurazione normalizzato con un nodo dello schema superficiale (`title`, `description`, `type`, `enum`, `const`, limiti comuni), i metadati dei suggerimenti corrispondenti per l'interfaccia e i riepiloghi dei figli immediati. Usalo per l'esplorazione dettagliata basata sul percorso nell'interfaccia di controllo o nei client personalizzati.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Convalida la configurazione attuale rispetto allo schema attivo senza avviare il Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
Se la convalida non riesce già, inizia con `openclaw configure` o `openclaw doctor --fix`. `openclaw chat` non aggira il controllo che impedisce l'uso di una configurazione non valida.
</Note>

## Valori

Quando possibile, i valori vengono analizzati come JSON5; altrimenti vengono trattati come stringhe non elaborate. Usa `--strict-json` per richiedere JSON standard senza ripiego sulle stringhe; in tal caso la sintassi specifica di JSON5, come commenti, virgole finali o chiavi senza virgolette, viene rifiutata. `--json` è un alias legacy di `--strict-json` per `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` stampa il valore non elaborato come JSON anziché come testo formattato per il terminale.

<Note>
Per impostazione predefinita, l'assegnazione di un oggetto sostituisce il percorso di destinazione. I percorsi protetti che contengono comunemente voci aggiunte dall'utente rifiutano le sostituzioni che rimuoverebbero voci esistenti, a meno che non venga specificato `--replace`: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` e `auth.profiles`.
</Note>

Usa `--merge` quando aggiungi voci a queste mappe:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Usa `--replace` solo quando il valore fornito deve intenzionalmente diventare l'intero valore di destinazione.

## Modalità di `config set`

<Tabs>
  <Tab title="Value mode">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef builder mode">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider builder mode">
    Ha come destinazione esclusivamente i percorsi `secrets.providers.<alias>`:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Batch mode">
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
Le assegnazioni SecretRef vengono rifiutate sulle superfici modificabili durante l'esecuzione non supportate, ad esempio `hooks.token`, `commands.ownerDisplaySecret`, i token Webhook di associazione dei thread di Discord e il JSON delle credenziali di WhatsApp. Consulta [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface).
</Warning>

L'analisi in batch usa sempre il payload batch (`--batch-json`/`--batch-file`) come fonte attendibile; `--strict-json` / `--json` non modificano il comportamento dell'analisi in batch.

La modalità percorso/valore JSON funziona direttamente anche per SecretRef e fornitori:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Flag del generatore di fornitori

Le destinazioni del generatore di fornitori devono usare `secrets.providers.<alias>` come percorso.

<AccordionGroup>
  <Accordion title="Common flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (ripetibile)

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>` (obbligatorio)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
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

Esempio di fornitore exec con protezioni avanzate:

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

Incolla o invia tramite pipe una modifica JSON5 con la struttura della configurazione, anziché eseguire molti comandi `config set` basati sul percorso. Gli oggetti vengono uniti ricorsivamente; gli array e i valori scalari sostituiscono la destinazione; `null` elimina il percorso di destinazione.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Invia una modifica tramite lo standard input per gli script di configurazione remota:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Esempio di modifica:

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

Usa `--replace-path <path>` quando un oggetto o un array deve diventare esattamente il valore fornito, anziché essere modificato ricorsivamente:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` esegue i controlli dello schema e della risolvibilità delle SecretRef senza scrivere. Durante l'esecuzione simulata, per impostazione predefinita le SecretRef basate su exec vengono ignorate; aggiungi `--allow-exec` quando desideri intenzionalmente che l'esecuzione simulata esegua i comandi dei fornitori.

## Esecuzione simulata

`--dry-run` convalida le modifiche senza scrivere in `openclaw.json`. È disponibile per `config set`, `config patch` e `config unset`.

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
    - Modalità builder: esegue i controlli di risolvibilità dei SecretRef per i riferimenti/provider modificati.
    - Modalità JSON (`--strict-json`, `--json` o modalità batch): esegue la convalida dello schema e i controlli di risolvibilità dei SecretRef.
    - La convalida dei criteri viene eseguita sull'intera configurazione successiva alla modifica, quindi le scritture di oggetti padre (ad esempio, l'impostazione di `hooks` come oggetto) non possono aggirare la convalida delle superfici non supportate.
    - Per impostazione predefinita, i controlli dei SecretRef exec vengono ignorati per evitare effetti collaterali dei comandi; passa `--allow-exec` per abilitarli (ciò può eseguire i comandi dei provider). `--allow-exec` è utilizzabile solo in modalità simulazione e genera un errore senza `--dry-run`.

  </Accordion>
  <Accordion title="Campi di --dry-run --json">
    - `ok`: indica se la simulazione è riuscita
    - `operations`: numero di assegnazioni valutate
    - `checks`: indica se sono stati eseguiti i controlli di schema/risolvibilità
    - `checks.resolvabilityComplete`: indica se i controlli di risolvibilità sono stati completati (false quando i riferimenti exec vengono ignorati)
    - `refsChecked`: numero di riferimenti effettivamente risolti durante la simulazione
    - `skippedExecRefs`: numero di riferimenti exec ignorati perché `--allow-exec` non è stato impostato
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
    - `config schema validation failed`: la struttura della configurazione successiva alla modifica non è valida; correggi il percorso/valore o la struttura dell'oggetto provider/riferimento.
    - `Config policy validation failed: unsupported SecretRef usage`: ripristina l'immissione di quella credenziale come testo normale/stringa; usa i SecretRef solo sulle superfici supportate.
    - `SecretRef assignment(s) could not be resolved`: il provider/riferimento indicato non è attualmente risolvibile (variabile di ambiente mancante, puntatore a file non valido, errore del provider exec o mancata corrispondenza tra provider e origine).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: esegui nuovamente il comando con `--allow-exec` se devi convalidare la risolvibilità exec.
    - Per la modalità batch, correggi le voci non riuscite ed esegui nuovamente `--dry-run` prima della scrittura.

  </Accordion>
</AccordionGroup>

## Applicazione delle modifiche

Dopo ogni operazione `config set` / `config patch` / `config unset` riuscita, la CLI stampa uno dei tre suggerimenti seguenti per indicare se è necessario riavviare il Gateway:

| Suggerimento                                        | Significato                                                   |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `Restart the gateway to apply.`                     | Il percorso modificato richiede un riavvio completo.          |
| `Change will apply without restarting the gateway.` | Il ricaricamento a caldo lo rileva automaticamente.            |
| `No gateway restart needed.`                        | Non è cambiato nulla di rilevante per il runtime.              |

Le scritture in `plugins.entries` (o in qualsiasi relativo sottopercorso) richiedono sempre un riavvio, poiché la CLI non può verificare che siano caricati i metadati di ricaricamento di ogni Plugin.

## Sicurezza della scrittura

`openclaw config set` e gli altri strumenti di scrittura della configurazione gestiti da OpenClaw convalidano l'intera configurazione successiva alla modifica prima di salvarla su disco. Se il nuovo payload non supera la convalida dello schema o sembra una sovrascrittura distruttiva, la configurazione attiva rimane invariata e il payload rifiutato viene salvato accanto a essa con il nome `openclaw.json.rejected.*`.

<Warning>
Il percorso della configurazione attiva deve essere un file normale. I layout di `openclaw.json` basati su collegamenti simbolici non sono supportati per le scritture; usa invece `OPENCLAW_CONFIG_PATH` affinché punti direttamente al file reale.
</Warning>

Per le modifiche di piccola entità, preferisci le scritture tramite CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Se una scrittura viene rifiutata, esamina il payload salvato e correggi l'intera struttura della configurazione:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Le scritture dirette tramite editor sono comunque consentite, ma il Gateway in esecuzione le considera non attendibili finché non vengono convalidate. Le modifiche dirette non valide impediscono l'avvio o vengono ignorate dal ricaricamento a caldo; il Gateway non riscrive `openclaw.json`. Esegui `openclaw doctor --fix` per riparare una configurazione con prefissi o sovrascritta oppure per ripristinare l'ultima copia valida nota. Consulta [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#gateway-rejected-invalid-config).

Il ripristino dell'intero file è riservato alla riparazione tramite doctor. Le modifiche allo schema dei Plugin o un disallineamento di `minHostVersion` continuano a produrre errori espliciti anziché ripristinare impostazioni utente non correlate, come modelli, provider, profili di autenticazione, canali, esposizione del Gateway, strumenti, memoria, browser o configurazione Cron.

## Ciclo di riparazione

Dopo che `openclaw config validate` è stato completato correttamente, usa la TUI locale per fare in modo che un agente integrato confronti la configurazione attiva con la documentazione mentre convalidi ogni modifica dallo stesso terminale:

```bash
openclaw chat
```

All'interno della TUI, un `!` iniziale esegue un comando letterale della shell locale (dopo una richiesta di conferma una tantum per sessione):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="Confronta con la documentazione">
    Chiedi all'agente di confrontare la configurazione corrente con la pagina della documentazione pertinente e di suggerire la correzione più piccola.
  </Step>
  <Step title="Applica modifiche mirate">
    Applica modifiche mirate con `openclaw config set` o `openclaw configure`.
  </Step>
  <Step title="Convalida nuovamente">
    Esegui nuovamente `openclaw config validate` dopo ogni modifica.
  </Step>
  <Step title="Usa doctor per i problemi di runtime">
    Se la convalida riesce ma il runtime presenta ancora problemi, esegui `openclaw doctor` o `openclaw doctor --fix` per ricevere assistenza con la migrazione e la riparazione.
  </Step>
</Steps>

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Configurazione](/it/gateway/configuration)
