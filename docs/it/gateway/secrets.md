---
read_when:
    - Configurazione di SecretRefs per le credenziali del provider e i riferimenti `auth-profiles.json`
    - Gestire in modo sicuro in produzione il ricaricamento, l'audit, la configurazione e l'applicazione dei segreti
    - Comprendere il fallimento immediato all'avvio, il filtraggio delle superfici inattive e il comportamento dell'ultima configurazione valida nota
sidebarTitle: Secrets management
summary: 'Gestione dei segreti: contratto SecretRef, comportamento delle istantanee in fase di esecuzione e sanitizzazione sicura unidirezionale'
title: Gestione dei segreti
x-i18n:
    generated_at: "2026-04-30T08:54:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96fddc346e21cab17d978843dc2a482c6faf8f810b3698a97aa88463133eaca5
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw supporta SecretRef additivi, quindi le credenziali supportate non devono essere archiviate come testo in chiaro nella configurazione.

<Note>
Il testo in chiaro continua a funzionare. I SecretRef sono opt-in per ogni credenziale.
</Note>

## Obiettivi e modello runtime

I segreti vengono risolti in uno snapshot runtime in memoria.

- La risoluzione è eager durante l'attivazione, non lazy sui percorsi delle richieste.
- L'avvio fallisce rapidamente quando un SecretRef effettivamente attivo non può essere risolto.
- Il reload usa uno swap atomico: successo completo, oppure mantiene l'ultimo snapshot noto valido.
- Le violazioni della policy SecretRef (per esempio profili di autenticazione in modalità OAuth combinati con input SecretRef) fanno fallire l'attivazione prima dello swap runtime.
- Le richieste runtime leggono solo dallo snapshot attivo in memoria.
- Dopo la prima attivazione/caricamento della configurazione riuscita, i percorsi di codice runtime continuano a leggere quello snapshot attivo in memoria finché un reload riuscito non lo sostituisce.
- Anche i percorsi di recapito in uscita leggono da quello snapshot attivo (per esempio recapito di risposte/thread Discord e invii di azioni Telegram); non risolvono di nuovo i SecretRef a ogni invio.

Questo mantiene le interruzioni dei provider di segreti fuori dai percorsi caldi delle richieste.

## Filtro delle superfici attive

I SecretRef vengono validati solo sulle superfici effettivamente attive.

- Superfici abilitate: i ref non risolti bloccano avvio/reload.
- Superfici inattive: i ref non risolti non bloccano avvio/reload.
- I ref inattivi emettono diagnostica non fatale con codice `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Esempi di superfici inattive">
    - Voci di canale/account disabilitate.
    - Credenziali di canale di primo livello che nessun account abilitato eredita.
    - Superfici di strumenti/funzionalità disabilitate.
    - Chiavi specifiche del provider di ricerca web che non sono selezionate da `tools.web.search.provider`. In modalità auto (provider non impostato), le chiavi vengono consultate in ordine di precedenza per il rilevamento automatico del provider finché una non viene risolta. Dopo la selezione, le chiavi dei provider non selezionati vengono trattate come inattive finché non vengono selezionate.
    - Il materiale di autenticazione SSH della sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, più override per agente) è attivo solo quando il backend sandbox effettivo è `ssh` per l'agente predefinito o per un agente abilitato.
    - I SecretRef `gateway.remote.token` / `gateway.remote.password` sono attivi se una di queste condizioni è vera:
      - `gateway.mode=remote`
      - `gateway.remote.url` è configurato
      - `gateway.tailscale.mode` è `serve` o `funnel`
      - In modalità locale senza quelle superfici remote:
        - `gateway.remote.token` è attivo quando l'autenticazione tramite token può prevalere e non è configurato alcun token env/auth.
        - `gateway.remote.password` è attivo solo quando l'autenticazione tramite password può prevalere e non è configurata alcuna password env/auth.
    - Il SecretRef `gateway.auth.token` è inattivo per la risoluzione dell'autenticazione all'avvio quando `OPENCLAW_GATEWAY_TOKEN` è impostato, perché l'input del token da env prevale per quel runtime.

  </Accordion>
</AccordionGroup>

## Diagnostica della superficie di autenticazione Gateway

Quando un SecretRef è configurato su `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` o `gateway.remote.password`, l'avvio/reload del gateway registra esplicitamente lo stato della superficie:

- `active`: il SecretRef fa parte della superficie di autenticazione effettiva e deve essere risolto.
- `inactive`: il SecretRef viene ignorato per questo runtime perché prevale un'altra superficie di autenticazione, oppure perché l'autenticazione remota è disabilitata/non attiva.

Queste voci vengono registrate con `SECRETS_GATEWAY_AUTH_SURFACE` e includono il motivo usato dalla policy delle superfici attive, così puoi vedere perché una credenziale è stata trattata come attiva o inattiva.

## Preflight dei riferimenti durante l'onboarding

Quando l'onboarding viene eseguito in modalità interattiva e scegli l'archiviazione SecretRef, OpenClaw esegue la validazione preflight prima del salvataggio:

- Ref env: valida il nome della variabile env e conferma che durante la configurazione sia visibile un valore non vuoto.
- Ref provider (`file` o `exec`): valida la selezione del provider, risolve `id` e controlla il tipo del valore risolto.
- Percorso di riuso quickstart: quando `gateway.auth.token` è già un SecretRef, l'onboarding lo risolve prima del bootstrap di probe/dashboard (per ref `env`, `file` ed `exec`) usando lo stesso gate fail-fast.

Se la validazione fallisce, l'onboarding mostra l'errore e ti consente di riprovare.

## Contratto SecretRef

Usa ovunque una singola forma di oggetto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Validazione:

    - `provider` deve corrispondere a `^[a-z][a-z0-9_-]{0,63}$`
    - `id` deve corrispondere a `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Validazione:

    - `provider` deve corrispondere a `^[a-z][a-z0-9_-]{0,63}$`
    - `id` deve essere un puntatore JSON assoluto (`/...`)
    - Escaping RFC6901 nei segmenti: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    Validazione:

    - `provider` deve corrispondere a `^[a-z][a-z0-9_-]{0,63}$`
    - `id` deve corrispondere a `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - `id` non deve contenere `.` o `..` come segmenti di percorso delimitati da slash (per esempio `a/../b` viene rifiutato)

  </Tab>
</Tabs>

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
        mode: "json", // or "singleValue"
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

<AccordionGroup>
  <Accordion title="Provider env">
    - Allowlist facoltativa tramite `allowlist`.
    - Valori env mancanti/vuoti fanno fallire la risoluzione.

  </Accordion>
  <Accordion title="Provider file">
    - Legge il file locale da `path`.
    - `mode: "json"` si aspetta un payload oggetto JSON e risolve `id` come puntatore.
    - `mode: "singleValue"` si aspetta il ref id `"value"` e restituisce i contenuti del file.
    - Il percorso deve superare i controlli di proprietà/permessi.
    - Nota fail-closed su Windows: se la verifica ACL non è disponibile per un percorso, la risoluzione fallisce. Solo per percorsi attendibili, imposta `allowInsecurePath: true` su quel provider per bypassare i controlli di sicurezza del percorso.

  </Accordion>
  <Accordion title="Provider exec">
    - Esegue il percorso assoluto del binario configurato, senza shell.
    - Per impostazione predefinita, `command` deve puntare a un file regolare (non un symlink).
    - Imposta `allowSymlinkCommand: true` per consentire percorsi di comando symlink (per esempio shim Homebrew). OpenClaw valida il percorso di destinazione risolto.
    - Abbina `allowSymlinkCommand` a `trustedDirs` per percorsi dei package manager (per esempio `["/opt/homebrew"]`).
    - Supporta timeout, timeout per assenza di output, limiti in byte dell'output, allowlist env e directory attendibili.
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

  </Accordion>
</AccordionGroup>

## Esempi di integrazione exec

<AccordionGroup>
  <Accordion title="CLI 1Password">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
  </Accordion>
  <Accordion title="CLI HashiCorp Vault">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
  </Accordion>
</AccordionGroup>

## Variabili d'ambiente del server MCP

Le variabili env del server MCP configurate tramite `plugins.entries.acpx.config.mcpServers` supportano SecretInput. Questo tiene API key e token fuori dalla configurazione in testo in chiaro:

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

I valori stringa in testo in chiaro continuano a funzionare. I ref con template env come `${MCP_SERVER_API_KEY}` e gli oggetti SecretRef vengono risolti durante l'attivazione del gateway prima che venga generato il processo del server MCP. Come per le altre superfici SecretRef, i ref non risolti bloccano l'attivazione solo quando il plugin `acpx` è effettivamente attivo.

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

- OpenClaw risolve questi riferimenti durante l'attivazione della sandbox, non in modo lazy durante ogni chiamata SSH.
- I valori risolti vengono scritti in file temporanei con permessi restrittivi e usati nella configurazione SSH generata.
- Se il backend sandbox effettivo non è `ssh`, questi riferimenti restano inattivi e non bloccano l'avvio.

## Superficie delle credenziali supportata

Le credenziali canoniche supportate e non supportate sono elencate in:

- [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface)

<Note>
Le credenziali generate a runtime o rotanti e il materiale di refresh OAuth sono intenzionalmente esclusi dalla risoluzione SecretRef di sola lettura.
</Note>

## Comportamento richiesto e precedenza

- Campo senza un riferimento: invariato.
- Campo con un riferimento: richiesto sulle superfici attive durante l'attivazione.
- Se sono presenti sia testo in chiaro sia riferimento, il riferimento ha la precedenza nei percorsi di precedenza supportati.
- Il sentinel di redazione `__OPENCLAW_REDACTED__` è riservato alla redazione/ripristino della configurazione interna e viene rifiutato come dato di configurazione inviato letterale.

Segnali di avviso e audit:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (avviso runtime)
- `REF_SHADOWED` (riscontro di audit quando le credenziali di `auth-profiles.json` hanno la precedenza sui riferimenti di `openclaw.json`)

Comportamento di compatibilità Google Chat:

- `serviceAccountRef` ha la precedenza su `serviceAccount` in chiaro.
- Il valore in chiaro viene ignorato quando è impostato il riferimento fratello.

## Trigger di attivazione

L'attivazione dei segreti viene eseguita su:

- Avvio (preflight più attivazione finale)
- Percorso hot-apply di ricaricamento della configurazione
- Percorso restart-check di ricaricamento della configurazione
- Ricaricamento manuale tramite `secrets.reload`
- Preflight RPC di scrittura della configurazione del Gateway (`config.set` / `config.apply` / `config.patch`) per la risolvibilità SecretRef della superficie attiva nel payload di configurazione inviato prima di rendere persistenti le modifiche

Contratto di attivazione:

- In caso di successo, sostituisce lo snapshot atomicamente.
- Un errore all'avvio interrompe l'avvio del gateway.
- Un errore di ricaricamento a runtime mantiene l'ultimo snapshot noto valido.
- Un errore di preflight Write-RPC rifiuta la configurazione inviata e mantiene invariati sia la configurazione su disco sia lo snapshot runtime attivo.
- Fornire un token di canale esplicito per chiamata a un helper/strumento in uscita non attiva l'attivazione SecretRef; i punti di attivazione restano avvio, ricaricamento e `secrets.reload` esplicito.

## Segnali degradati e recuperati

Quando l'attivazione in fase di ricaricamento fallisce dopo uno stato integro, OpenClaw entra nello stato di segreti degradati.

Evento di sistema una tantum e codici di log:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamento:

- Degradato: il runtime mantiene l'ultimo snapshot noto valido.
- Recuperato: emesso una volta dopo la successiva attivazione riuscita.
- Errori ripetuti mentre è già degradato registrano avvisi ma non generano spam di eventi.
- Il fail-fast all'avvio non emette eventi degradati perché il runtime non è mai diventato attivo.

## Risoluzione dei percorsi di comando

I percorsi di comando possono scegliere di usare la risoluzione SecretRef supportata tramite RPC di snapshot del gateway.

Esistono due comportamenti generali:

<Tabs>
  <Tab title="Percorsi di comando rigidi">
    Per esempio i percorsi di memoria remota di `openclaw memory` e `openclaw qr --remote` quando richiede riferimenti a segreti condivisi remoti. Leggono dallo snapshot attivo e falliscono rapidamente quando una SecretRef richiesta non è disponibile.
  </Tab>
  <Tab title="Percorsi di comando di sola lettura">
    Per esempio `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` e i flussi doctor/config repair di sola lettura. Preferiscono anch'essi lo snapshot attivo, ma degradano invece di interrompersi quando una SecretRef mirata non è disponibile in quel percorso di comando.

    Comportamento di sola lettura:

    - Quando il gateway è in esecuzione, questi comandi leggono prima dallo snapshot attivo.
    - Se la risoluzione del gateway è incompleta o il gateway non è disponibile, tentano un fallback locale mirato per la specifica superficie del comando.
    - Se una SecretRef mirata è ancora non disponibile, il comando continua con output degradato di sola lettura e diagnostica esplicita come "configured but unavailable in this command path".
    - Questo comportamento degradato è solo locale al comando. Non indebolisce i percorsi di avvio, ricaricamento, invio o autenticazione del runtime.

  </Tab>
</Tabs>

Altre note:

- L'aggiornamento dello snapshot dopo la rotazione di un segreto del backend viene gestito da `openclaw secrets reload`.
- Metodo RPC del Gateway usato da questi percorsi di comando: `secrets.resolve`.

## Flusso di lavoro di audit e configurazione

Flusso operatore predefinito:

<Steps>
  <Step title="Esegui l'audit dello stato corrente">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Configura SecretRefs">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="Esegui nuovamente l'audit">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    I riscontri includono:

    - valori in chiaro a riposo (`openclaw.json`, `auth-profiles.json`, `.env` e `agents/*/agent/models.json` generati)
    - residui di header sensibili dei provider in chiaro nelle voci `models.json` generate
    - riferimenti non risolti
    - oscuramento della precedenza (`auth-profiles.json` che ha priorità sui riferimenti di `openclaw.json`)
    - residui legacy (`auth.json`, promemoria OAuth)

    Nota exec:

    - Per impostazione predefinita, l'audit salta i controlli di risolvibilità exec SecretRef per evitare effetti collaterali dei comandi.
    - Usa `openclaw secrets audit --allow-exec` per eseguire i provider exec durante l'audit.

    Nota sui residui degli header:

    - Il rilevamento degli header sensibili dei provider è basato su euristiche del nome (nomi e frammenti comuni di header di autenticazione/credenziali come `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Helper interattivo che:

    - configura prima `secrets.providers` (`env`/`file`/`exec`, aggiunta/modifica/rimozione)
    - consente di selezionare i campi supportati che contengono segreti in `openclaw.json` più `auth-profiles.json` per un ambito agente
    - può creare una nuova mappatura `auth-profiles.json` direttamente nel selettore di destinazione
    - acquisisce i dettagli SecretRef (`source`, `provider`, `id`)
    - esegue la risoluzione preflight
    - può applicare immediatamente

    Nota exec:

    - Il preflight salta i controlli exec SecretRef salvo che `--allow-exec` sia impostato.
    - Se applichi direttamente da `configure --apply` e il piano include riferimenti/provider exec, mantieni `--allow-exec` impostato anche per il passaggio di applicazione.

    Modalità utili:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Valori predefiniti di applicazione di `configure`:

    - rimuove le credenziali statiche corrispondenti da `auth-profiles.json` per i provider mirati
    - rimuove le voci legacy statiche `api_key` da `auth.json`
    - rimuove le righe di segreti noti corrispondenti da `<config-dir>/.env`

  </Accordion>
  <Accordion title="secrets apply">
    Applica un piano salvato:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Nota exec:

    - dry-run salta i controlli exec salvo che `--allow-exec` sia impostato.
    - la modalità di scrittura rifiuta i piani contenenti SecretRef/provider exec salvo che `--allow-exec` sia impostato.

    Per dettagli sul contratto rigoroso target/percorso e sulle regole esatte di rifiuto, vedi [Contratto del piano di applicazione dei segreti](/it/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Criterio di sicurezza unidirezionale

<Warning>
OpenClaw intenzionalmente non scrive backup di rollback contenenti valori storici dei segreti in chiaro.
</Warning>

Modello di sicurezza:

- il preflight deve riuscire prima della modalità di scrittura
- l'attivazione runtime viene convalidata prima del commit
- l'applicazione aggiorna i file usando sostituzione atomica dei file e ripristino best-effort in caso di errore

## Note di compatibilità dell'autenticazione legacy

Per le credenziali statiche, il runtime non dipende più dall'archiviazione legacy dell'autenticazione in chiaro.

- L'origine delle credenziali runtime è lo snapshot risolto in memoria.
- Le voci legacy statiche `api_key` vengono rimosse quando rilevate.
- Il comportamento di compatibilità relativo a OAuth resta separato.

## Nota Web UI

Alcune unioni SecretInput sono più facili da configurare in modalità editor raw che in modalità form.

## Correlati

- [Autenticazione](/it/gateway/authentication) — configurazione dell'autenticazione
- [CLI: secrets](/it/cli/secrets) — comandi CLI
- [Variabili d'ambiente](/it/help/environment) — precedenza dell'ambiente
- [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface) — superficie delle credenziali
- [Contratto del piano di applicazione dei segreti](/it/gateway/secrets-plan-contract) — dettagli del contratto del piano
- [Sicurezza](/it/gateway/security) — postura di sicurezza
