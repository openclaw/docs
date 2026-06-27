---
read_when:
    - Configurazione di SecretRefs per le credenziali dei provider e i riferimenti `auth-profiles.json`
    - Gestire ricaricamento, audit, configurazione e applicazione dei segreti in modo sicuro in produzione
    - Comprendere il fail-fast all'avvio, il filtraggio delle superfici inattive e il comportamento dell'ultima configurazione valida
sidebarTitle: Secrets management
summary: 'Gestione dei segreti: contratto SecretRef, comportamento dello snapshot di runtime e scrubbing sicuro unidirezionale'
title: Gestione dei segreti
x-i18n:
    generated_at: "2026-06-27T17:35:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw supporta SecretRef additivi, così le credenziali supportate non devono essere archiviate come testo in chiaro nella configurazione.

<Note>
Il testo in chiaro continua a funzionare. I SecretRef sono opt-in per ciascuna credenziale.
</Note>

<Warning>
Le credenziali in testo in chiaro rimangono leggibili dall’agente se sono archiviate in file che
l’agente può ispezionare, inclusi `openclaw.json`, `auth-profiles.json`, `.env` o
i file `agents/*/agent/models.json` generati. I SecretRef riducono quel raggio
d’impatto locale solo dopo che ogni credenziale supportata è stata migrata e
`openclaw secrets audit --check` non segnala residui di segreti in testo in chiaro.
</Warning>

## Obiettivi e modello di runtime

I segreti vengono risolti in uno snapshot di runtime in memoria.

- La risoluzione è anticipata durante l’attivazione, non pigra nei percorsi di richiesta.
- L’avvio fallisce rapidamente quando un SecretRef effettivamente attivo non può essere risolto.
- Il ricaricamento usa uno scambio atomico: successo completo, oppure mantiene l’ultimo snapshot noto come valido.
- Le violazioni della policy SecretRef (per esempio profili di autenticazione in modalità OAuth combinati con input SecretRef) fanno fallire l’attivazione prima dello scambio di runtime.
- Le richieste di runtime leggono solo dallo snapshot attivo in memoria.
- Dopo la prima attivazione/caricamento della configurazione riuscita, i percorsi di codice di runtime continuano a leggere quello snapshot attivo in memoria finché un ricaricamento riuscito non lo sostituisce.
- Anche i percorsi di recapito in uscita leggono da quello snapshot attivo (per esempio recapito di risposte/thread Discord e invii di azioni Telegram); non risolvono di nuovo i SecretRef a ogni invio.

Questo tiene le interruzioni dei provider di segreti fuori dai percorsi di richiesta caldi.

## Confine di accesso dell’agente

I SecretRef proteggono le credenziali dalla persistenza nella configurazione supportata e
nelle superfici dei modelli generate, ma non sono un confine di isolamento del processo. Se una
credenziale in testo in chiaro rimane su disco in un percorso leggibile dall’agente, l’agente può
aggirare l’oscuramento a livello API usando strumenti file o shell per ispezionare quel file.

Per i deployment di produzione in cui i file accessibili dall’agente sono nell’ambito, considera
la migrazione SecretRef completa solo quando tutte queste condizioni sono vere:

- le credenziali supportate usano SecretRef invece di valori in testo in chiaro
- i residui legacy in testo in chiaro sono stati rimossi da `openclaw.json`,
  `auth-profiles.json`, `.env` e dai file `models.json` generati
- `openclaw secrets audit --check` è pulito dopo la migrazione
- eventuali credenziali rimanenti non supportate o a rotazione sono protette dall’isolamento del
  sistema operativo, dall’isolamento del container o da un proxy di credenziali esterno

Per questo il workflow audit/configure/apply è un gate di migrazione di sicurezza, non
solo un helper di convenienza.

<Warning>
I SecretRef non rendono sicuri file arbitrari leggibili. Backup, configurazioni copiate,
vecchi cataloghi di modelli generati e classi di credenziali non supportate devono essere trattati
come segreti di produzione finché non vengono eliminati, spostati fuori dal confine di fiducia
dell’agente o protetti da un livello di isolamento separato.
</Warning>

## Filtraggio delle superfici attive

I SecretRef vengono convalidati solo sulle superfici effettivamente attive.

- Superfici abilitate: i riferimenti non risolti bloccano avvio/ricaricamento.
- Superfici inattive: i riferimenti non risolti non bloccano avvio/ricaricamento.
- I riferimenti inattivi emettono diagnostica non fatale con codice `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Esempi di superfici inattive">
    - Voci di canale/account disabilitate.
    - Credenziali di canale di primo livello che nessun account abilitato eredita.
    - Superfici di tool/funzionalità disabilitate.
    - Chiavi specifiche del provider di ricerca web che non sono selezionate da `tools.web.search.provider`. In modalità auto (provider non impostato), le chiavi vengono consultate per precedenza per il rilevamento automatico del provider finché una non si risolve. Dopo la selezione, le chiavi dei provider non selezionati sono trattate come inattive finché non vengono selezionate.
    - Il materiale di autenticazione SSH della sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, più override per agente) è attivo solo quando il backend sandbox effettivo è `ssh` per l’agente predefinito o per un agente abilitato.
    - I SecretRef `gateway.remote.token` / `gateway.remote.password` sono attivi se una di queste condizioni è vera:
      - `gateway.mode=remote`
      - `gateway.remote.url` è configurato
      - `gateway.tailscale.mode` è `serve` o `funnel`
      - In modalità locale senza quelle superfici remote:
        - `gateway.remote.token` è attivo quando l’autenticazione tramite token può prevalere e non è configurato alcun token env/auth.
        - `gateway.remote.password` è attivo solo quando l’autenticazione tramite password può prevalere e non è configurata alcuna password env/auth.
    - Il SecretRef `gateway.auth.token` è inattivo per la risoluzione dell’autenticazione all’avvio quando `OPENCLAW_GATEWAY_TOKEN` è impostato, perché l’input del token env prevale per quel runtime.

  </Accordion>
</AccordionGroup>

## Diagnostica della superficie di autenticazione Gateway

Quando un SecretRef è configurato su `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` o `gateway.remote.password`, l’avvio/ricaricamento del Gateway registra esplicitamente lo stato della superficie:

- `active`: il SecretRef fa parte della superficie di autenticazione effettiva e deve essere risolto.
- `inactive`: il SecretRef viene ignorato per questo runtime perché un’altra superficie di autenticazione prevale, oppure perché l’autenticazione remota è disabilitata/non attiva.

Queste voci vengono registrate con `SECRETS_GATEWAY_AUTH_SURFACE` e includono il motivo usato dalla policy delle superfici attive, così puoi vedere perché una credenziale è stata trattata come attiva o inattiva.

## Preflight dei riferimenti di onboarding

Quando l’onboarding viene eseguito in modalità interattiva e scegli l’archiviazione SecretRef, OpenClaw esegue la convalida preflight prima del salvataggio:

- Riferimenti env: convalida il nome della variabile env e conferma che un valore non vuoto sia visibile durante la configurazione.
- Riferimenti provider (`file` o `exec`): convalida la selezione del provider, risolve `id` e controlla il tipo del valore risolto.
- Percorso di riuso quickstart: quando `gateway.auth.token` è già un SecretRef, l’onboarding lo risolve prima del bootstrap di probe/dashboard (per riferimenti `env`, `file` ed `exec`) usando lo stesso gate fail-fast.

Se la convalida fallisce, l’onboarding mostra l’errore e ti consente di riprovare.

## Contratto SecretRef

Usa ovunque una sola forma di oggetto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    I campi SecretInput supportati accettano anche abbreviazioni stringa esatte:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    Convalida:

    - `provider` deve corrispondere a `^[a-z][a-z0-9_-]{0,63}$`
    - `id` deve corrispondere a `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Convalida:

    - `provider` deve corrispondere a `^[a-z][a-z0-9_-]{0,63}$`
    - `id` deve essere un puntatore JSON assoluto (`/...`)
    - Escaping RFC6901 nei segmenti: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Convalida:

    - `provider` deve corrispondere a `^[a-z][a-z0-9_-]{0,63}$`
    - `id` deve corrispondere a `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (supporta selettori come `secret#json_key`)
    - `id` non deve contenere `.` o `..` come segmenti di percorso delimitati da slash (per esempio `a/../b` viene rifiutato)

  </Tab>
</Tabs>

## Configurazione provider

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
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
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
    - `mode: "singleValue"` si aspetta l’id riferimento `"value"` e restituisce il contenuto del file.
    - Il percorso deve superare i controlli di proprietà/permessi.
    - Nota fail-closed per Windows: se la verifica ACL non è disponibile per un percorso, la risoluzione fallisce. Solo per percorsi fidati, imposta `allowInsecurePath: true` su quel provider per bypassare i controlli di sicurezza del percorso.

  </Accordion>
  <Accordion title="Provider exec">
    - Esegue il percorso assoluto del binario configurato, senza shell.
    - Per impostazione predefinita, `command` deve puntare a un file regolare (non un symlink).
    - Imposta `allowSymlinkCommand: true` per consentire percorsi di comando symlink (per esempio shim Homebrew). OpenClaw convalida il percorso di destinazione risolto.
    - Abbina `allowSymlinkCommand` a `trustedDirs` per percorsi del package manager (per esempio `["/opt/homebrew"]`).
    - Supporta timeout, timeout senza output, limiti in byte dell’output, allowlist env e directory fidate.
    - Nota fail-closed per Windows: se la verifica ACL non è disponibile per il percorso del comando, la risoluzione fallisce. Solo per percorsi fidati, imposta `allowInsecurePath: true` su quel provider per bypassare i controlli di sicurezza del percorso.
    - I provider exec gestiti da Plugin possono usare `pluginIntegration` invece di
      `command`/`args` copiati. OpenClaw risolve i dettagli del comando correnti
      dal manifest del Plugin installato durante avvio/ricaricamento. Se il Plugin è
      disabilitato, rimosso, non fidato o non dichiara più l’integrazione,
      i SecretRef attivi che usano quel provider falliscono in modo chiuso.

    Payload richiesta (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Payload risposta (stdout):

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

## Chiavi API basate su file

Non inserire stringhe `file:...` nel blocco `env` della configurazione. Il blocco `env` è
letterale e non sovrascrivente, quindi `file:...` non viene risolto.

Usa invece un SecretRef file su un campo credenziale supportato:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

Per `mode: "singleValue"`, l’`id` SecretRef è `"value"`. Per
`mode: "json"`, usa un puntatore JSON assoluto come
`"/providers/xai/apiKey"`.

Consulta [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface) per
i campi di configurazione che accettano SecretRef.

## Esempi di integrazione exec

<AccordionGroup>
  <Accordion title="1Password CLI">
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
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    Usa un wrapper di risoluzione quando vuoi che gli id SecretRef mappino alle chiavi degli elementi di Bitwarden
    Secrets Manager. Il repository include
    `scripts/secrets/openclaw-bws-resolver.mjs`; installalo o copialo in un percorso assoluto
    attendibile sull'host che esegue il Gateway.

    Requisiti:

    - CLI Bitwarden Secrets Manager (`bws`) installata sull'host Gateway.
    - `BWS_ACCESS_TOKEN` disponibile per il servizio Gateway.
    - `PATH` passato al resolver, oppure `BWS_BIN` impostato sul percorso assoluto del binario
      `bws`.
    - `BWS_SERVER_URL` deve essere impostato nell'ambiente quando si usa un'istanza Bitwarden
      self-hosted.

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    Il resolver raggruppa gli id richiesti, esegue `bws secret list` e restituisce
    i valori per i campi `key` dei segreti corrispondenti. Usa chiavi che soddisfano il contratto degli id SecretRef
    exec, come `openclaw/providers/openai/apiKey`; le chiavi in stile variabile d'ambiente
    con trattini bassi vengono rifiutate prima dell'esecuzione del resolver. Se più
    di un segreto Bitwarden visibile ha la stessa chiave richiesta, il resolver
    fa fallire quell'id come ambiguo invece di sceglierne uno. Dopo aver aggiornato la configurazione,
    verifica il percorso del resolver:

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
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
  <Accordion title="password-store (`pass`)">
    Usa un piccolo wrapper di risoluzione quando vuoi che gli id SecretRef mappino direttamente alle
    voci `pass`. Salvalo come eseguibile in un percorso assoluto che supera
    i controlli di percorso del tuo provider exec, per esempio
    `/usr/local/bin/openclaw-pass-resolver`. Lo shebang `#!/usr/bin/env node`
    risolve `node` dal `PATH` del processo resolver, quindi includi `PATH` in
    `passEnv`. Se `pass` non è in quel `PATH`, imposta `PASS_BIN` nell'ambiente
    padre e includilo anche in `passEnv`:

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    Poi configura il provider exec e fai puntare `apiKey` al percorso della voce `pass`:

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    Mantieni il segreto nella prima riga della voce `pass`, oppure personalizza il
    wrapper se invece vuoi restituire l'intero output di `pass show`. Dopo
    aver aggiornato la configurazione, verifica sia l'audit statico sia il percorso del resolver exec:

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
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

Le variabili d'ambiente del server MCP configurate tramite `plugins.entries.acpx.config.mcpServers` supportano SecretInput. Questo mantiene chiavi API e token fuori dalla configurazione in testo normale:

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

I valori stringa in testo normale continuano a funzionare. I riferimenti modello env come `${MCP_SERVER_API_KEY}` e gli oggetti SecretRef vengono risolti durante l'attivazione del gateway prima dell'avvio del processo del server MCP. Come per le altre superfici SecretRef, i riferimenti non risolti bloccano l'attivazione solo quando il plugin `acpx` è effettivamente attivo.

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

Comportamento di runtime:

- OpenClaw risolve questi riferimenti durante l'attivazione della sandbox, non in modo lazy durante ogni chiamata SSH.
- I valori risolti vengono scritti in file temporanei con permessi restrittivi e usati nella configurazione SSH generata.
- Se il backend sandbox effettivo non è `ssh`, questi riferimenti restano inattivi e non bloccano l'avvio.

## Superficie delle credenziali supportata

Le credenziali canoniche supportate e non supportate sono elencate in:

- [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface)

<Note>
Le credenziali generate dal runtime o a rotazione e il materiale di refresh OAuth sono intenzionalmente esclusi dalla risoluzione SecretRef in sola lettura.
</Note>

## Comportamento richiesto e precedenza

- Campo senza riferimento: invariato.
- Campo con riferimento: richiesto sulle superfici attive durante l'attivazione.
- Se sono presenti sia testo normale sia riferimento, il riferimento ha la precedenza sui percorsi di precedenza supportati.
- Il sentinella di redazione `__OPENCLAW_REDACTED__` è riservato alla redazione/ripristino interno della configurazione e viene rifiutato come dato di configurazione letterale inviato.

Segnali di avviso e audit:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (avviso di runtime)
- `REF_SHADOWED` (risultato di audit quando le credenziali di `auth-profiles.json` hanno la precedenza sui riferimenti di `openclaw.json`)

Comportamento di compatibilità Google Chat:

- `serviceAccountRef` ha la precedenza su `serviceAccount` in testo normale.
- Il valore in testo normale viene ignorato quando è impostato il riferimento fratello.

## Trigger di attivazione

L'attivazione dei segreti viene eseguita su:

- Avvio (preflight più attivazione finale)
- Percorso hot-apply di ricaricamento della configurazione
- Percorso di controllo riavvio del ricaricamento della configurazione
- Ricaricamento manuale tramite `secrets.reload`
- Preflight RPC di scrittura della configurazione Gateway (`config.set` / `config.apply` / `config.patch`) per la risolvibilità dei SecretRef della superficie attiva nel payload di configurazione inviato prima di persistere le modifiche

Contratto di attivazione:

- Il successo sostituisce lo snapshot atomicamente.
- Un errore all'avvio interrompe l'avvio del gateway.
- Un errore di ricaricamento a runtime mantiene l'ultimo snapshot valido noto.
- Un errore di preflight write-RPC rifiuta la configurazione inviata e mantiene invariati sia la configurazione su disco sia lo snapshot di runtime attivo.
- Fornire un token di canale esplicito per chiamata a un helper/tool call in uscita non attiva SecretRef; i punti di attivazione restano avvio, ricaricamento e `secrets.reload` esplicito.

## Segnali degradati e ripristinati

Quando l'attivazione in fase di ricaricamento fallisce dopo uno stato sano, OpenClaw entra nello stato di segreti degradati.

Evento di sistema una tantum e codici di log:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamento:

- Degradato: il runtime mantiene l'ultimo snapshot valido noto.
- Ripristinato: emesso una volta dopo la successiva attivazione riuscita.
- Errori ripetuti mentre lo stato è già degradato registrano avvisi ma non generano eventi ripetuti.
- Il fail-fast all'avvio non emette eventi degradati perché il runtime non è mai diventato attivo.

## Risoluzione del percorso dei comandi

I percorsi dei comandi possono aderire alla risoluzione SecretRef supportata tramite RPC dello snapshot Gateway.

Esistono due comportamenti generali:

<Tabs>
  <Tab title="Percorsi dei comandi rigorosi">
    Ad esempio i percorsi di memoria remota di `openclaw memory` e `openclaw qr --remote` quando richiede riferimenti a segreti condivisi remoti. Leggono dallo snapshot attivo e falliscono rapidamente quando una SecretRef richiesta non è disponibile.
  </Tab>
  <Tab title="Percorsi dei comandi in sola lettura">
    Ad esempio `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` e i flussi doctor/config di riparazione in sola lettura. Preferiscono anche lo snapshot attivo, ma degradano invece di interrompersi quando una SecretRef mirata non è disponibile in quel percorso di comando.

    Comportamento in sola lettura:

    - Quando il Gateway è in esecuzione, questi comandi leggono prima dallo snapshot attivo.
    - Se la risoluzione del Gateway è incompleta o il Gateway non è disponibile, tentano un fallback locale mirato per la superficie specifica del comando.
    - Se una SecretRef mirata è ancora non disponibile, il comando prosegue con output degradato in sola lettura e diagnostica esplicita come "configurato ma non disponibile in questo percorso di comando".
    - Questo comportamento degradato è solo locale al comando. Non indebolisce i percorsi di avvio, ricaricamento o invio/autenticazione del runtime.

  </Tab>
</Tabs>

Altre note:

- L'aggiornamento dello snapshot dopo la rotazione dei segreti del backend è gestito da `openclaw secrets reload`.
- Metodo RPC del Gateway usato da questi percorsi di comando: `secrets.resolve`.

## Flusso di lavoro di audit e configurazione

Flusso predefinito dell'operatore:

<Steps>
  <Step title="Esegui l'audit dello stato corrente">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Configura e applica le SecretRef">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="Esegui di nuovo l'audit">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

Non considerare la migrazione completa finché il nuovo audit non è pulito. Se l'audit
segnala ancora valori in testo normale a riposo, il rischio di accesso dell'agente è ancora presente
anche quando le API runtime restituiscono valori redatti.

Se salvi un piano invece di applicarlo durante `configure`, applica quel piano salvato
con `openclaw secrets apply --from <plan-path>` prima del nuovo audit.

<AccordionGroup>
  <Accordion title="secrets audit">
    I risultati includono:

    - valori in testo normale a riposo (`openclaw.json`, `auth-profiles.json`, `.env` e `agents/*/agent/models.json` generati)
    - residui di header sensibili del provider in testo normale nelle voci `models.json` generate
    - riferimenti non risolti
    - shadowing della precedenza (`auth-profiles.json` che ha priorità sui riferimenti di `openclaw.json`)
    - residui legacy (`auth.json`, promemoria OAuth)

    Nota exec:

    - Per impostazione predefinita, l'audit salta i controlli di risolvibilità delle SecretRef exec per evitare effetti collaterali dei comandi.
    - Usa `openclaw secrets audit --allow-exec` per eseguire i provider exec durante l'audit.

    Nota sui residui degli header:

    - Il rilevamento degli header sensibili del provider è basato su euristiche dei nomi (nomi e frammenti comuni di header di autenticazione/credenziali come `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Helper interattivo che:

    - configura prima `secrets.providers` (`env`/`file`/`exec`, aggiungi/modifica/rimuovi)
    - consente di selezionare campi supportati contenenti segreti in `openclaw.json` più `auth-profiles.json` per un ambito agente
    - può creare una nuova mappatura `auth-profiles.json` direttamente nel selettore del target
    - acquisisce i dettagli della SecretRef (`source`, `provider`, `id`)
    - esegue la risoluzione preflight
    - può applicare immediatamente

    Nota exec:

    - Il preflight salta i controlli delle SecretRef exec a meno che `--allow-exec` non sia impostato.
    - Se applichi direttamente da `configure --apply` e il piano include riferimenti/provider exec, mantieni `--allow-exec` impostato anche per il passaggio di applicazione.

    Modalità utili:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Valori predefiniti di applicazione di `configure`:

    - rimuove le credenziali statiche corrispondenti da `auth-profiles.json` per i provider mirati
    - rimuove le voci `api_key` statiche legacy da `auth.json`
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

    - dry-run salta i controlli exec a meno che `--allow-exec` non sia impostato.
    - la modalità di scrittura rifiuta i piani contenenti SecretRef/provider exec a meno che `--allow-exec` non sia impostato.

    Per i dettagli del contratto target/percorso rigoroso e le regole esatte di rifiuto, vedi [Contratto del piano di Secrets Apply](/it/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Policy di sicurezza unidirezionale

<Warning>
OpenClaw intenzionalmente non scrive backup di rollback contenenti valori storici dei segreti in testo normale.
</Warning>

Modello di sicurezza:

- il preflight deve riuscire prima della modalità di scrittura
- l'attivazione runtime viene convalidata prima del commit
- apply aggiorna i file usando la sostituzione atomica dei file e il ripristino best-effort in caso di errore

## Note sulla compatibilità dell'autenticazione legacy

Per le credenziali statiche, il runtime non dipende più dall'archiviazione legacy dell'autenticazione in testo normale.

- L'origine delle credenziali runtime è lo snapshot in memoria risolto.
- Le voci `api_key` statiche legacy vengono rimosse quando vengono rilevate.
- Il comportamento di compatibilità relativo a OAuth rimane separato.

## Nota sull'interfaccia Web

Alcune unioni SecretInput sono più facili da configurare in modalità editor grezzo che in modalità modulo.

## Correlati

- [Autenticazione](/it/gateway/authentication) — configurazione dell'autenticazione
- [CLI: secrets](/it/cli/secrets) — comandi CLI
- [Variabili di ambiente](/it/help/environment) — precedenza dell'ambiente
- [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface) — superficie delle credenziali
- [Contratto del piano di Secrets Apply](/it/gateway/secrets-plan-contract) — dettagli del contratto del piano
- [Sicurezza](/it/gateway/security) — postura di sicurezza
