---
read_when:
    - Configurazione di SecretRef per le credenziali del provider e i riferimenti `auth-profiles.json`
    - Gestire in sicurezza in produzione ricarica, audit, configurazione e applicazione dei secret
    - Capire fail-fast all'avvio, filtro delle superfici inattive e comportamento last-known-good
summary: 'Gestione dei secret: contratto SecretRef, comportamento dello snapshot runtime e scrubbing unidirezionale sicuro'
title: Gestione dei secret
x-i18n:
    generated_at: "2026-04-24T08:42:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e21f63bbf1815b7166dfe123900575754270de94113b446311d73dfd4f2343
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw supporta SecretRef additivi, così le credenziali supportate non devono essere archiviate come testo in chiaro nella configurazione.

Il testo in chiaro continua a funzionare. I SecretRef sono opt-in per singola credenziale.

## Obiettivi e modello runtime

I secret vengono risolti in uno snapshot runtime in memoria.

- La risoluzione è eager durante l'attivazione, non lazy nei percorsi di richiesta.
- L'avvio fallisce rapidamente quando un SecretRef effettivamente attivo non può essere risolto.
- Il reload usa uno scambio atomico: successo completo, oppure mantiene l'ultimo snapshot valido noto.
- Le violazioni della policy SecretRef (ad esempio profili auth in modalità OAuth combinati con input SecretRef) fanno fallire l'attivazione prima dello scambio runtime.
- Le richieste runtime leggono solo dallo snapshot attivo in memoria.
- Dopo il primo caricamento/attivazione della configurazione riuscito, i percorsi del codice runtime continuano a leggere quello snapshot attivo in memoria fino a quando un reload riuscito non lo sostituisce.
- Anche i percorsi di consegna in uscita leggono da quello snapshot attivo (ad esempio la consegna di risposte/thread Discord e gli invii di azioni Telegram); non rieseguono la risoluzione dei SecretRef a ogni invio.

Questo tiene i guasti del provider di secret fuori dai percorsi di richiesta ad alta frequenza.

## Filtro delle superfici attive

I SecretRef vengono validati solo sulle superfici effettivamente attive.

- Superfici abilitate: i ref non risolti bloccano avvio/reload.
- Superfici inattive: i ref non risolti non bloccano avvio/reload.
- I ref inattivi emettono diagnostica non fatale con codice `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

Esempi di superfici inattive:

- Voci canale/account disabilitate.
- Credenziali canale top-level che nessun account abilitato eredita.
- Superfici strumento/funzionalità disabilitate.
- Chiavi specifiche del provider per web search che non sono selezionate da `tools.web.search.provider`.
  In modalità auto (provider non impostato), le chiavi vengono consultate per precedenza per il rilevamento automatico del provider finché una non si risolve.
  Dopo la selezione, le chiavi dei provider non selezionati vengono trattate come inattive finché non vengono selezionate.
- Materiale auth SSH della sandbox (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData`, più gli override per agente) è attivo solo
  quando il backend sandbox effettivo è `ssh` per l'agente predefinito o un agente abilitato.
- I SecretRef `gateway.remote.token` / `gateway.remote.password` sono attivi se una di queste condizioni è vera:
  - `gateway.mode=remote`
  - `gateway.remote.url` è configurato
  - `gateway.tailscale.mode` è `serve` o `funnel`
  - In modalità locale senza quelle superfici remote:
    - `gateway.remote.token` è attivo quando l'autenticazione token può prevalere e non è configurato alcun token env/auth.
    - `gateway.remote.password` è attivo solo quando l'autenticazione password può prevalere e non è configurata alcuna password env/auth.
- Il SecretRef `gateway.auth.token` è inattivo per la risoluzione auth all'avvio quando è impostato `OPENCLAW_GATEWAY_TOKEN`, perché l'input token env prevale per quel runtime.

## Diagnostica della superficie auth del Gateway

Quando un SecretRef è configurato su `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token` o `gateway.remote.password`, l'avvio/reload del gateway registra
esplicitamente lo stato della superficie:

- `active`: il SecretRef fa parte della superficie auth effettiva e deve risolversi.
- `inactive`: il SecretRef viene ignorato per questo runtime perché prevale un'altra superficie auth, oppure
  perché l'autenticazione remota è disabilitata/non attiva.

Queste voci vengono registrate con `SECRETS_GATEWAY_AUTH_SURFACE` e includono il motivo usato dalla
policy della superficie attiva, così puoi vedere perché una credenziale è stata trattata come attiva o inattiva.

## Preflight dei riferimenti durante l'onboarding

Quando l'onboarding viene eseguito in modalità interattiva e scegli l'archiviazione SecretRef, OpenClaw esegue la validazione preflight prima di salvare:

- Ref env: valida il nome della variabile env e conferma che durante la configurazione sia visibile un valore non vuoto.
- Ref provider (`file` o `exec`): valida la selezione del provider, risolve `id` e controlla il tipo del valore risolto.
- Percorso di riutilizzo quickstart: quando `gateway.auth.token` è già un SecretRef, l'onboarding lo risolve prima del bootstrap probe/dashboard (per ref `env`, `file` ed `exec`) usando lo stesso controllo fail-fast.

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
- `mode: "singleValue"` si aspetta l'id ref `"value"` e restituisce il contenuto del file.
- Il percorso deve superare i controlli di proprietà/permessi.
- Nota fail-closed su Windows: se la verifica ACL non è disponibile per un percorso, la risoluzione fallisce. Solo per percorsi attendibili, imposta `allowInsecurePath: true` su quel provider per bypassare i controlli di sicurezza del percorso.

### Provider exec

- Esegue il percorso binario assoluto configurato, senza shell.
- Per impostazione predefinita, `command` deve puntare a un file regolare (non a un symlink).
- Imposta `allowSymlinkCommand: true` per consentire percorsi comando symlinkati (ad esempio shim Homebrew). OpenClaw valida il percorso della destinazione risolta.
- Abbina `allowSymlinkCommand` a `trustedDirs` per percorsi di package manager (ad esempio `["/opt/homebrew"]`).
- Supporta timeout, timeout senza output, limiti di byte in output, allowlist env e directory attendibili.
- Nota fail-closed su Windows: se la verifica ACL non è disponibile per il percorso del comando, la risoluzione fallisce. Solo per percorsi attendibili, imposta `allowInsecurePath: true` su quel provider per bypassare i controlli di sicurezza del percorso.

Payload della richiesta (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Payload della risposta (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Errori facoltativi per id:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Esempi di integrazione exec

### CLI 1Password

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // richiesto per binari symlinkati da Homebrew
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

### CLI HashiCorp Vault

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // richiesto per binari symlinkati da Homebrew
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
        allowSymlinkCommand: true, // richiesto per binari symlinkati da Homebrew
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

## Variabili d'ambiente del server MCP

Le env var del server MCP configurate tramite `plugins.entries.acpx.config.mcpServers` supportano SecretInput. Questo mantiene API key e token fuori dalla configurazione in chiaro:

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

I valori stringa in chiaro continuano a funzionare. I ref template-env come `${MCP_SERVER_API_KEY}` e gli oggetti SecretRef vengono risolti durante l'attivazione del gateway prima che il processo del server MCP venga generato. Come per le altre superfici SecretRef, i ref non risolti bloccano l'attivazione solo quando il Plugin `acpx` è effettivamente attivo.

## Materiale auth SSH della sandbox

Anche il backend sandbox core `ssh` supporta SecretRef per il materiale auth SSH:

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
- I valori risolti vengono scritti in file temporanei con permessi restrittivi e usati nella configurazione SSH generata.
- Se il backend sandbox effettivo non è `ssh`, questi ref restano inattivi e non bloccano l'avvio.

## Superficie delle credenziali supportata

Le credenziali canoniche supportate e non supportate sono elencate in:

- [SecretRef Credential Surface](/it/reference/secretref-credential-surface)

Le credenziali generate a runtime o rotanti e il materiale di refresh OAuth sono intenzionalmente esclusi dalla risoluzione SecretRef di sola lettura.

## Comportamento richiesto e precedenza

- Campo senza ref: invariato.
- Campo con ref: richiesto sulle superfici attive durante l'attivazione.
- Se sono presenti sia testo in chiaro sia ref, il ref ha la precedenza nei percorsi di precedenza supportati.
- Il sentinel di redazione `__OPENCLAW_REDACTED__` è riservato alla redazione/ripristino interno della configurazione e viene rifiutato come dato di configurazione inviato in forma letterale.

Segnali di avviso e audit:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (avviso runtime)
- `REF_SHADOWED` (rilevazione di audit quando le credenziali in `auth-profiles.json` hanno precedenza sui ref in `openclaw.json`)

Comportamento di compatibilità Google Chat:

- `serviceAccountRef` ha precedenza sul valore in chiaro `serviceAccount`.
- Il valore in chiaro viene ignorato quando è impostato il ref sibling.

## Trigger di attivazione

L'attivazione dei secret viene eseguita su:

- Avvio (preflight più attivazione finale)
- Percorso di hot-apply del reload della configurazione
- Percorso restart-check del reload della configurazione
- Reload manuale tramite `secrets.reload`
- Preflight della Gateway RPC di scrittura della configurazione (`config.set` / `config.apply` / `config.patch`) per la risolvibilità dei SecretRef della superficie attiva all'interno del payload di configurazione inviato prima di mantenere le modifiche

Contratto di attivazione:

- Il successo sostituisce atomicamente lo snapshot.
- Il fallimento all'avvio interrompe l'avvio del gateway.
- Il fallimento del reload runtime mantiene l'ultimo snapshot valido noto.
- Il fallimento del preflight della write-RPC rifiuta la configurazione inviata e mantiene invariati sia la configurazione su disco sia lo snapshot runtime attivo.
- Fornire un token di canale esplicito per chiamata a una helper/tool call in uscita non attiva l'attivazione dei SecretRef; i punti di attivazione restano avvio, reload ed `secrets.reload` esplicito.

## Segnali di stato degradato e ripristinato

Quando l'attivazione al reload fallisce dopo uno stato integro, OpenClaw entra in stato secret degradato.

Codici di log e di evento di sistema one-shot:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamento:

- Degradato: il runtime mantiene l'ultimo snapshot valido noto.
- Ripristinato: emesso una volta dopo l'attivazione successiva riuscita.
- Fallimenti ripetuti mentre è già degradato registrano avvisi ma non generano spam di eventi.
- Il fail-fast all'avvio non emette eventi di stato degradato perché il runtime non è mai diventato attivo.

## Risoluzione nel percorso di comando

I percorsi di comando possono aderire alla risoluzione SecretRef supportata tramite Gateway snapshot RPC.

Esistono due comportamenti generali:

- I percorsi di comando strict (ad esempio i percorsi remote-memory di `openclaw memory` e `openclaw qr --remote` quando ha bisogno di ref remote shared-secret) leggono dallo snapshot attivo e falliscono rapidamente quando un SecretRef richiesto non è disponibile.
- I percorsi di comando read-only (ad esempio `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` e i flussi read-only di riparazione doctor/config) preferiscono anch'essi lo snapshot attivo, ma degradano invece di interrompersi quando un SecretRef mirato non è disponibile in quel percorso di comando.

Comportamento read-only:

- Quando il gateway è in esecuzione, questi comandi leggono prima dallo snapshot attivo.
- Se la risoluzione del gateway è incompleta o il gateway non è disponibile, tentano un fallback locale mirato per la superficie di comando specifica.
- Se un SecretRef mirato è ancora non disponibile, il comando continua con output read-only degradato e diagnostica esplicita come “configured but unavailable in this command path”.
- Questo comportamento degradato è solo locale al comando. Non indebolisce i percorsi runtime di avvio, reload o invio/autenticazione.

Altre note:

- L'aggiornamento dello snapshot dopo la rotazione di un backend secret viene gestito da `openclaw secrets reload`.
- Metodo Gateway RPC usato da questi percorsi di comando: `secrets.resolve`.

## Flusso di lavoro di audit e configurazione

Flusso operatore predefinito:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

Le rilevazioni includono:

- valori in chiaro a riposo (`openclaw.json`, `auth-profiles.json`, `.env` e `agents/*/agent/models.json` generati)
- residui di header sensibili del provider in chiaro nelle voci `models.json` generate
- ref non risolti
- shadowing di precedenza (`auth-profiles.json` ha priorità sui ref in `openclaw.json`)
- residui legacy (`auth.json`, promemoria OAuth)

Nota exec:

- Per impostazione predefinita, audit salta i controlli di risolvibilità dei SecretRef exec per evitare effetti collaterali dei comandi.
- Usa `openclaw secrets audit --allow-exec` per eseguire i provider exec durante l'audit.

Nota sui residui di header:

- Il rilevamento degli header sensibili del provider è basato su euristiche di nome (nomi comuni di header auth/credential e frammenti come `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

### `secrets configure`

Helper interattivo che:

- configura prima `secrets.providers` (`env`/`file`/`exec`, aggiungi/modifica/rimuovi)
- ti permette di selezionare i campi supportati che contengono secret in `openclaw.json` più `auth-profiles.json` per un singolo ambito agente
- può creare direttamente nel selettore di destinazione una nuova mappatura `auth-profiles.json`
- acquisisce i dettagli del SecretRef (`source`, `provider`, `id`)
- esegue la risoluzione preflight
- può applicare immediatamente

Nota exec:

- Il preflight salta i controlli dei SecretRef exec a meno che non sia impostato `--allow-exec`.
- Se applichi direttamente da `configure --apply` e il piano include ref/provider exec, mantieni `--allow-exec` impostato anche per il passaggio di apply.

Modalità utili:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

Valori predefiniti di apply in `configure`:

- esegue lo scrub delle credenziali statiche corrispondenti da `auth-profiles.json` per i provider mirati
- esegue lo scrub delle voci statiche legacy `api_key` da `auth.json`
- esegue lo scrub delle righe di secret note corrispondenti da `<config-dir>/.env`

### `secrets apply`

Applica un piano salvato:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Nota exec:

- dry-run salta i controlli exec a meno che non sia impostato `--allow-exec`.
- La modalità write rifiuta i piani che contengono SecretRef/provider exec a meno che non sia impostato `--allow-exec`.

Per i dettagli del contratto strict di destinazione/percorso e le regole esatte di rifiuto, vedi:

- [Secrets Apply Plan Contract](/it/gateway/secrets-plan-contract)

## Policy di sicurezza unidirezionale

OpenClaw intenzionalmente non scrive backup di rollback contenenti valori storici di secret in chiaro.

Modello di sicurezza:

- il preflight deve avere successo prima della modalità write
- l'attivazione runtime viene validata prima del commit
- apply aggiorna i file usando sostituzione atomica dei file e best-effort restore in caso di errore

## Note di compatibilità auth legacy

Per le credenziali statiche, il runtime non dipende più dall'archiviazione auth legacy in chiaro.

- La sorgente delle credenziali runtime è lo snapshot risolto in memoria.
- Le voci statiche legacy `api_key` vengono sottoposte a scrub quando vengono rilevate.
- Il comportamento di compatibilità relativo a OAuth rimane separato.

## Nota sulla Web UI

Alcune union SecretInput sono più facili da configurare in modalità editor raw che in modalità form.

## Documenti correlati

- Comandi CLI: [secrets](/it/cli/secrets)
- Dettagli del contratto del piano: [Secrets Apply Plan Contract](/it/gateway/secrets-plan-contract)
- Superficie delle credenziali: [SecretRef Credential Surface](/it/reference/secretref-credential-surface)
- Configurazione auth: [Authentication](/it/gateway/authentication)
- Stato di sicurezza: [Security](/it/gateway/security)
- Precedenza dell'ambiente: [Environment Variables](/it/help/environment)
