---
read_when:
    - Configurazione di SecretRef per credenziali provider e ref di `auth-profiles.json`
    - Uso sicuro in produzione di reload, audit, configure e apply dei segreti
    - Comprensione del fail-fast all'avvio, del filtraggio delle superfici inattive e del comportamento last-known-good
summary: 'Gestione dei segreti: contratto SecretRef, comportamento dell''istantanea runtime e scrubbing sicuro unidirezionale'
title: Gestione dei segreti
x-i18n:
    generated_at: "2026-04-05T13:53:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: b91778cb7801fe24f050c15c0a9dd708dda91cb1ce86096e6bae57ebb6e0d41d
    source_path: gateway/secrets.md
    workflow: 15
---

# Gestione dei segreti

OpenClaw supporta SecretRef additivi, in modo che le credenziali supportate non debbano essere archiviate come testo in chiaro nella configurazione.

Il testo in chiaro continua a funzionare. I SecretRef sono opzionali per ogni credenziale.

## Obiettivi e modello runtime

I segreti vengono risolti in un'istantanea runtime in memoria.

- La risoluzione è eager durante l'attivazione, non lazy nei percorsi di richiesta.
- L'avvio fallisce rapidamente quando un SecretRef effettivamente attivo non può essere risolto.
- Il reload usa uno scambio atomico: successo completo, oppure viene mantenuta l'ultima istantanea valida conosciuta.
- Le violazioni della policy SecretRef (ad esempio profili auth in modalità OAuth combinati con input SecretRef) fanno fallire l'attivazione prima dello scambio runtime.
- Le richieste runtime leggono solo dall'istantanea attiva in memoria.
- Dopo la prima attivazione/caricamento riusciti della config, i percorsi di codice runtime continuano a leggere da quell'istantanea attiva in memoria finché un reload riuscito non la sostituisce.
- Anche i percorsi di consegna in uscita leggono da quell'istantanea attiva (ad esempio consegna di risposte/thread Discord e invio di azioni Telegram); non risolvono di nuovo i SecretRef a ogni invio.

Questo tiene fuori i guasti dei provider di segreti dai percorsi di richiesta critici.

## Filtraggio delle superfici attive

I SecretRef vengono validati solo sulle superfici effettivamente attive.

- Superfici abilitate: i ref non risolti bloccano avvio/reload.
- Superfici inattive: i ref non risolti non bloccano avvio/reload.
- I ref inattivi emettono diagnostica non fatale con codice `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

Esempi di superfici inattive:

- Voci canale/account disabilitate.
- Credenziali di canale di primo livello che nessun account abilitato eredita.
- Superfici strumento/funzionalità disabilitate.
- Chiavi specifiche del provider di ricerca web che non sono selezionate da `tools.web.search.provider`.
  In modalità auto (provider non impostato), le chiavi vengono consultate in ordine di precedenza per l'auto-rilevamento del provider finché una non si risolve.
  Dopo la selezione, le chiavi dei provider non selezionati vengono trattate come inattive finché non vengono selezionate.
- Materiale di autenticazione SSH della sandbox (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData`, più gli override per agente) è attivo solo
  quando il backend sandbox effettivo è `ssh` per l'agente predefinito o per un agente abilitato.
- I SecretRef `gateway.remote.token` / `gateway.remote.password` sono attivi se vale una di queste condizioni:
  - `gateway.mode=remote`
  - `gateway.remote.url` è configurato
  - `gateway.tailscale.mode` è `serve` o `funnel`
  - In modalità locale senza quelle superfici remote:
    - `gateway.remote.token` è attivo quando l'autenticazione token può prevalere e nessun token env/auth è configurato.
    - `gateway.remote.password` è attivo solo quando l'autenticazione password può prevalere e nessuna password env/auth è configurata.
- Il SecretRef `gateway.auth.token` è inattivo per la risoluzione auth all'avvio quando è impostato `OPENCLAW_GATEWAY_TOKEN`, perché per quel runtime prevale l'input token dell'env.

## Diagnostica della superficie di autenticazione gateway

Quando un SecretRef è configurato su `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token` o `gateway.remote.password`, l'avvio/reload del gateway registra
esplicitamente lo stato della superficie:

- `active`: il SecretRef fa parte della superficie auth effettiva e deve essere risolto.
- `inactive`: il SecretRef viene ignorato per questo runtime perché prevale un'altra superficie auth, oppure
  perché l'autenticazione remota è disabilitata/non attiva.

Queste voci vengono registrate con `SECRETS_GATEWAY_AUTH_SURFACE` e includono il motivo usato dalla
policy delle superfici attive, così puoi vedere perché una credenziale è stata trattata come attiva o inattiva.

## Preflight dei ref nell'onboarding

Quando l'onboarding viene eseguito in modalità interattiva e scegli l'archiviazione SecretRef, OpenClaw esegue una validazione preflight prima del salvataggio:

- Ref env: valida il nome della variabile env e conferma che durante il setup sia visibile un valore non vuoto.
- Ref provider (`file` o `exec`): valida la selezione del provider, risolve `id` e controlla il tipo del valore risolto.
- Percorso di riuso quickstart: quando `gateway.auth.token` è già un SecretRef, l'onboarding lo risolve prima del bootstrap probe/dashboard (per ref `env`, `file` ed `exec`) usando lo stesso gate fail-fast.

Se la validazione fallisce, l'onboarding mostra l'errore e ti permette di riprovare.

## Contratto SecretRef

Usa ovunque una sola forma oggetto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

Validazione:

- `provider` deve corrispondere a `^[a-z][a-z0-9_-]{0,63}$`
- `id` deve corrispondere a `^[A-Z][A-Z0-9_]{0,127}$`

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

Validazione:

- `provider` deve corrispondere a `^[a-z][a-z0-9_-]{0,63}$`
- `id` deve essere un puntatore JSON assoluto (`/...`)
- Escape RFC6901 nei segmenti: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

Validazione:

- `provider` deve corrispondere a `^[a-z][a-z0-9_-]{0,63}$`
- `id` deve corrispondere a `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` non deve contenere `.` o `..` come segmenti di percorso delimitati da slash (ad esempio `a/../b` viene rifiutato)

## Configurazione del provider

Definisci i provider sotto `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // oppure "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Provider env

- Allowlist facoltativa tramite `allowlist`.
- Valori env mancanti/vuoti fanno fallire la risoluzione.

### Provider file

- Legge il file locale da `path`.
- `mode: "json"` si aspetta un payload oggetto JSON e risolve `id` come puntatore.
- `mode: "singleValue"` si aspetta l'ID ref `"value"` e restituisce il contenuto del file.
- Il percorso deve superare i controlli di proprietà/permessi.
- Nota fail-closed su Windows: se la verifica ACL non è disponibile per un percorso, la risoluzione fallisce. Solo per percorsi fidati, imposta `allowInsecurePath: true` su quel provider per bypassare i controlli di sicurezza sul percorso.

### Provider exec

- Esegue il percorso assoluto del binario configurato, senza shell.
- Per impostazione predefinita, `command` deve puntare a un file regolare (non a un symlink).
- Imposta `allowSymlinkCommand: true` per consentire percorsi comando symlink (ad esempio shim Homebrew). OpenClaw valida il percorso di destinazione risolto.
- Abbina `allowSymlinkCommand` a `trustedDirs` per i percorsi del gestore pacchetti (ad esempio `["/opt/homebrew"]`).
- Supporta timeout, timeout senza output, limiti di byte in output, allowlist env e directory fidate.
- Nota fail-closed su Windows: se la verifica ACL non è disponibile per il percorso del comando, la risoluzione fallisce. Solo per percorsi fidati, imposta `allowInsecurePath: true` su quel provider per bypassare i controlli di sicurezza sul percorso.

Payload della richiesta (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Payload della risposta (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Errori facoltativi per ID:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Esempi di integrazione exec

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // richiesto per i binari symlink di Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### HashiCorp Vault CLI

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // richiesto per i binari symlink di Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // richiesto per i binari symlink di Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## Variabili di ambiente del server MCP

Le variabili env del server MCP configurate tramite `plugins.entries.acpx.config.mcpServers` supportano SecretInput. Questo mantiene chiavi API e token fuori dalla config in chiaro:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

I valori stringa in chiaro continuano a funzionare. I ref con template env come `${MCP_SERVER_API_KEY}` e gli oggetti SecretRef vengono risolti durante l'attivazione del gateway prima che venga avviato il processo del server MCP. Come per le altre superfici SecretRef, i ref non risolti bloccano l'attivazione solo quando il plugin `acpx` è effettivamente attivo.

## Materiale di autenticazione SSH della sandbox

Anche il backend sandbox core `ssh` supporta SecretRef per il materiale di autenticazione SSH:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Comportamento runtime:

- OpenClaw risolve questi ref durante l'attivazione della sandbox, non in modo lazy durante ogni chiamata SSH.
- I valori risolti vengono scritti in file temporanei con permessi restrittivi e usati nella config SSH generata.
- Se il backend sandbox effettivo non è `ssh`, questi ref restano inattivi e non bloccano l'avvio.

## Superficie delle credenziali supportata

Le credenziali canoniche supportate e non supportate sono elencate in:

- [Superficie delle credenziali SecretRef](/reference/secretref-credential-surface)

Le credenziali generate a runtime o a rotazione e il materiale di refresh OAuth sono intenzionalmente esclusi dalla risoluzione SecretRef di sola lettura.

## Comportamento richiesto e precedenza

- Campo senza ref: invariato.
- Campo con ref: richiesto sulle superfici attive durante l'attivazione.
- Se sono presenti sia testo in chiaro sia ref, il ref ha precedenza nei percorsi di precedenza supportati.
- Il sentinel di redazione `__OPENCLAW_REDACTED__` è riservato alla redazione/ripristino interno della config ed è rifiutato come dato letterale inviato nella config.

Segnali di avviso e audit:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (avviso runtime)
- `REF_SHADOWED` (rilevazione audit quando le credenziali di `auth-profiles.json` hanno precedenza sui ref di `openclaw.json`)

Comportamento di compatibilità Google Chat:

- `serviceAccountRef` ha precedenza su `serviceAccount` in chiaro.
- Il valore in chiaro viene ignorato quando il ref sibling è impostato.

## Trigger di attivazione

L'attivazione dei segreti viene eseguita su:

- Avvio (preflight più attivazione finale)
- Percorso hot-apply del reload config
- Percorso restart-check del reload config
- Reload manuale tramite `secrets.reload`
- Preflight degli RPC di scrittura config del Gateway (`config.set` / `config.apply` / `config.patch`) per la risolvibilità dei SecretRef di superfici attive all'interno del payload config inviato prima di persistere le modifiche

Contratto di attivazione:

- Il successo sostituisce l'istantanea in modo atomico.
- Il fallimento all'avvio interrompe l'avvio del gateway.
- Il fallimento del reload runtime mantiene l'ultima istantanea valida conosciuta.
- Il fallimento del preflight di Write-RPC rifiuta la config inviata e mantiene invariati sia la config su disco sia l'istantanea runtime attiva.
- Fornire un token di canale esplicito per chiamata a una helper/tool call in uscita non attiva l'attivazione SecretRef; i punti di attivazione restano avvio, reload e `secrets.reload` esplicito.

## Segnali di stato degradato e ripristinato

Quando l'attivazione in fase di reload fallisce dopo uno stato sano, OpenClaw entra in stato degradato dei segreti.

Codici di log ed evento di sistema one-shot:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamento:

- Degradato: il runtime mantiene l'ultima istantanea valida conosciuta.
- Ripristinato: emesso una sola volta dopo l'attivazione riuscita successiva.
- Fallimenti ripetuti mentre si è già in stato degradato registrano avvisi ma non saturano gli eventi.
- Il fail-fast all'avvio non emette eventi di stato degradato perché il runtime non è mai diventato attivo.

## Risoluzione nel percorso dei comandi

I percorsi dei comandi possono aderire alla risoluzione SecretRef supportata tramite RPC dell'istantanea gateway.

Esistono due comportamenti generali:

- I percorsi di comando rigorosi (ad esempio i percorsi di memoria remota di `openclaw memory` e `openclaw qr --remote` quando necessita di ref di segreto condiviso remoto) leggono dall'istantanea attiva e falliscono rapidamente quando un SecretRef richiesto non è disponibile.
- I percorsi di comando di sola lettura (ad esempio `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` e i flussi di sola lettura doctor/config repair) preferiscono anch'essi l'istantanea attiva, ma degradano invece di interrompersi quando un SecretRef mirato non è disponibile in quel percorso di comando.

Comportamento di sola lettura:

- Quando il gateway è in esecuzione, questi comandi leggono prima dall'istantanea attiva.
- Se la risoluzione del gateway è incompleta o il gateway non è disponibile, tentano un fallback locale mirato per la specifica superficie del comando.
- Se un SecretRef mirato resta comunque non disponibile, il comando continua con un output di sola lettura degradato e diagnostica esplicita come “configured but unavailable in this command path”.
- Questo comportamento degradato vale solo localmente per il comando. Non indebolisce avvio runtime, reload o percorsi send/auth.

Altre note:

- L'aggiornamento dell'istantanea dopo la rotazione dei segreti nel backend viene gestito da `openclaw secrets reload`.
- Metodo RPC Gateway usato da questi percorsi di comando: `secrets.resolve`.

## Flusso di lavoro audit e configure

Flusso operativo predefinito:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

Le rilevazioni includono:

- valori in chiaro a riposo (`openclaw.json`, `auth-profiles.json`, `.env` e `agents/*/agent/models.json` generati)
- residui in chiaro di header sensibili dei provider nelle voci generate di `models.json`
- ref non risolti
- shadowing di precedenza (`auth-profiles.json` che ha priorità sui ref di `openclaw.json`)
- residui legacy (`auth.json`, promemoria OAuth)

Nota exec:

- Per impostazione predefinita, audit salta i controlli di risolvibilità dei SecretRef exec per evitare effetti collaterali del comando.
- Usa `openclaw secrets audit --allow-exec` per eseguire i provider exec durante l'audit.

Nota sui residui di header:

- Il rilevamento degli header sensibili dei provider è basato su euristiche di nome (nomi e frammenti comuni di header auth/credenziali come `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

### `secrets configure`

Helper interattivo che:

- configura prima `secrets.providers` (`env`/`file`/`exec`, aggiunta/modifica/rimozione)
- ti consente di selezionare i campi supportati che contengono segreti in `openclaw.json` più `auth-profiles.json` per un ambito di agente
- può creare direttamente una nuova mappatura `auth-profiles.json` nel selettore della destinazione
- acquisisce i dettagli SecretRef (`source`, `provider`, `id`)
- esegue la risoluzione preflight
- può applicare immediatamente

Nota exec:

- Il preflight salta i controlli exec SecretRef a meno che non sia impostato `--allow-exec`.
- Se applichi direttamente da `configure --apply` e il piano include ref/provider exec, mantieni `--allow-exec` attivo anche per il passaggio di apply.

Modalità utili:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

Valori predefiniti di apply in `configure`:

- rimuove le credenziali statiche corrispondenti da `auth-profiles.json` per i provider di destinazione
- rimuove le voci statiche legacy `api_key` da `auth.json`
- rimuove le righe di segreti note corrispondenti da `<config-dir>/.env`

### `secrets apply`

Applica un piano salvato:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Nota exec:

- Il dry-run salta i controlli exec a meno che non sia impostato `--allow-exec`.
- La modalità di scrittura rifiuta i piani che contengono SecretRef/provider exec a meno che non sia impostato `--allow-exec`.

Per i dettagli sul contratto rigoroso destinazione/percorso e sulle regole esatte di rifiuto, vedi:

- [Contratto del piano Secrets Apply](/gateway/secrets-plan-contract)

## Policy di sicurezza unidirezionale

OpenClaw intenzionalmente non scrive backup di rollback che contengano valori storici di segreti in chiaro.

Modello di sicurezza:

- il preflight deve riuscire prima della modalità di scrittura
- l'attivazione runtime viene validata prima del commit
- apply aggiorna i file usando sostituzione atomica del file e ripristino best effort in caso di errore

## Note di compatibilità auth legacy

Per le credenziali statiche, il runtime non dipende più dall'archiviazione auth legacy in chiaro.

- La sorgente delle credenziali runtime è l'istantanea risolta in memoria.
- Le voci statiche legacy `api_key` vengono rimosse quando rilevate.
- Il comportamento di compatibilità relativo a OAuth resta separato.

## Nota sulla Web UI

Alcune union SecretInput sono più facili da configurare in modalità editor grezzo che in modalità form.

## Documentazione correlata

- Comandi CLI: [secrets](/cli/secrets)
- Dettagli del contratto del piano: [Contratto del piano Secrets Apply](/gateway/secrets-plan-contract)
- Superficie delle credenziali: [Superficie delle credenziali SecretRef](/reference/secretref-credential-surface)
- Configurazione auth: [Autenticazione](/gateway/authentication)
- Postura di sicurezza: [Sicurezza](/gateway/security)
- Precedenza environment: [Variabili di ambiente](/help/environment)
