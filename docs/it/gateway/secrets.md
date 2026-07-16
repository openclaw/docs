---
read_when:
    - Configurazione dei SecretRef per le credenziali del provider e i riferimenti `auth-profiles.json`
    - Gestire in sicurezza in produzione il ricaricamento, l'audit, la configurazione e l'applicazione dei segreti
    - Comprendere l'interruzione immediata all'avvio, il filtraggio delle superfici inattive e il comportamento basato sull'ultima configurazione valida nota
sidebarTitle: Secrets management
summary: 'Gestione dei segreti: contratto SecretRef, comportamento degli snapshot in fase di esecuzione e rimozione sicura unidirezionale dei dati sensibili'
title: Gestione dei segreti
x-i18n:
    generated_at: "2026-07-16T14:23:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9fbcac081a7b9bd8bc298b9fb2b7437f3bea4dad85338eed7db4cb4db051cfc7
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw supporta SecretRef additive, in modo che le credenziali supportate non debbano essere memorizzate come testo in chiaro nella configurazione.

<Note>
Il testo in chiaro continua a funzionare. Le SecretRef sono facoltative per ogni credenziale.
</Note>

<Warning>
Le credenziali in testo in chiaro restano leggibili dall'agente se si trovano in file che l'agente può esaminare, inclusi `openclaw.json`, `auth-profiles.json`, `.env` o i file `agents/*/agent/models.json` generati. Le SecretRef riducono tale area di esposizione locale solo dopo che ogni credenziale supportata è stata migrata e `openclaw secrets audit --check` non segnala residui in testo in chiaro.
</Warning>

## Modello di runtime

- I segreti vengono risolti in uno snapshot del runtime in memoria, preventivamente durante l'attivazione, non in modo differito nei percorsi delle richieste.
- L'avvio termina immediatamente con un errore quando non è possibile risolvere una SecretRef effettivamente attiva.
- Il ricaricamento consiste in uno scambio atomico: riesce completamente oppure mantiene l'ultimo snapshot valido noto.
- Le violazioni dei criteri (ad esempio un profilo di autenticazione in modalità OAuth combinato con un input SecretRef) causano il fallimento dell'attivazione prima dello scambio del runtime.
- Le richieste di runtime leggono esclusivamente lo snapshot attivo in memoria. Le credenziali SecretRef dei provider di modelli attraversano l'archiviazione dell'autenticazione e le opzioni di streaming sotto forma di sentinelle locali al processo fino all'uscita. Anche i percorsi di consegna in uscita (consegna di risposte/thread Discord, invii di azioni Telegram) leggono tale snapshot e non risolvono nuovamente i riferimenti a ogni invio.

In questo modo, le indisponibilità dei provider di segreti non interessano i percorsi critici delle richieste.

## Inserimento al momento dell'uscita (sentinelle)

Per le credenziali dei provider di modelli basate su SecretRef, OpenClaw genera una sentinella opaca e locale al processo durante la risoluzione dell'autenticazione del modello. L'archiviazione dell'autenticazione, le opzioni di streaming, la configurazione dell'SDK, i log, gli oggetti di errore e la maggior parte delle introspezioni del runtime visualizzano quindi un valore come `oc-sent-v1-...`, anziché la credenziale del provider. La richiesta del modello protetta e i controlli di integrità gestiti dei provider locali sostituiscono le sentinelle note nei valori di URL e intestazioni immediatamente prima che ogni richiesta lasci il processo.

I valori sconosciuti con formato di sentinella causano un errore in modalità sicura prima di qualsiasi attività di rete. OpenClaw rifiuta di inviare la richiesta anziché inoltrare a un provider una sentinella non risolta. I valori segreti risolti vengono inoltre registrati per l'oscuramento nei log in base alla corrispondenza esatta del valore, come misura di difesa in profondità.

Gli adattatori dei provider usano il punto di inserimento più avanzato supportato dal relativo SDK:

- Gli SDK con un'opzione fetch personalizzata ricevono la funzione fetch protetta di OpenClaw, così l'SDK conserva la sentinella.
- Gli SDK senza un'opzione fetch personalizzata estraggono il valore dalla sentinella immediatamente prima della creazione del client. Gli stream dei provider di proprietà dei Plugin e gli harness degli agenti eseguono l'estrazione nell'ultimo passaggio gestito dal core, perché tali trasporti non condividono la funzione fetch protetta di OpenClaw.

Le sentinelle riducono l'esposizione del testo in chiaro nella catena di chiamata del modello, ma non forniscono isolamento del processo. Il valore reale continua a esistere nella memoria dello stesso processo e compare al limite dell'adattatore finale. Le credenziali dell'ambiente in testo in chiaro non configurate tramite SecretRef restano in testo in chiaro e non rientrano in questo meccanismo.

Impostare `OPENCLAW_SECRET_SENTINELS=off` (accetta anche `0` o `false`, senza distinzione tra maiuscole e minuscole) per disabilitare la generazione delle sentinelle durante la risposta agli incidenti o la risoluzione di problemi di compatibilità. L'interruttore di emergenza non disabilita la registrazione dell'oscuramento in base alla corrispondenza esatta del valore.

## Limite di accesso dell'agente

Le SecretRef impediscono la persistenza delle credenziali nella configurazione e nei file dei modelli generati, ma non costituiscono un limite di isolamento del processo. Una credenziale in testo in chiaro lasciata sul disco in un percorso leggibile dall'agente resta accessibile tramite strumenti per file o shell, aggirando l'oscuramento a livello di API.

Per le distribuzioni di produzione in cui rientrano nell'ambito i file accessibili all'agente, considerare completa la migrazione solo quando sono soddisfatte tutte le condizioni seguenti:

- Le credenziali supportate usano SecretRef anziché valori in testo in chiaro.
- I residui legacy in testo in chiaro vengono rimossi da `openclaw.json`, `auth-profiles.json`, `.env` e dai file `models.json` generati.
- `openclaw secrets audit --check` non segnala problemi dopo la migrazione.
- Tutte le credenziali rimanenti non supportate o soggette a rotazione sono protette mediante isolamento del sistema operativo, isolamento del container o un proxy esterno per le credenziali.

Per questo motivo, il flusso di controllo/configurazione/applicazione è un punto di controllo della migrazione di sicurezza, non un semplice strumento di praticità.

<Warning>
Le SecretRef non rendono sicuri i file arbitrari leggibili. I backup, le configurazioni copiate, i vecchi cataloghi di modelli generati e le classi di credenziali non supportate restano segreti di produzione finché non vengono eliminati, spostati fuori dal limite di attendibilità dell'agente o isolati separatamente.
</Warning>

## Filtro delle superfici attive

Le SecretRef vengono convalidate solo sulle superfici effettivamente attive:

- **Superfici abilitate**: i riferimenti non risolti bloccano l'avvio o il ricaricamento.
- **Superfici inattive**: i riferimenti non risolti non bloccano l'avvio o il ricaricamento; generano una diagnostica `SECRETS_REF_IGNORED_INACTIVE_SURFACE` non fatale.

<Accordion title="Esempi di superfici inattive">
- Voci di canali/account disabilitate.
- Credenziali dei canali di primo livello non ereditate da alcun account abilitato.
- Superfici di strumenti/funzionalità disabilitate.
- Chiavi specifiche dei provider di ricerca Web non selezionate da `tools.web.search.provider`. In modalità automatica (provider non impostato), le chiavi vengono consultate in ordine di precedenza per il rilevamento automatico finché non ne viene risolta una; dopo la selezione, le chiavi dei provider non selezionati sono inattive.
- Il materiale di autenticazione SSH della sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, oltre alle sostituzioni specifiche per agente) è attivo solo quando il backend effettivo della sandbox è `ssh` e la modalità sandbox non è `off`, per l'agente predefinito o un agente abilitato.
- Le SecretRef `gateway.remote.token` / `gateway.remote.password` sono attive se è soddisfatta una delle condizioni seguenti:
  - `gateway.mode=remote`
  - `gateway.remote.url` è configurato
  - `gateway.tailscale.mode` è `serve` o `funnel`
  - In modalità locale senza tali superfici remote: `gateway.remote.token` è attivo quando l'autenticazione tramite token può prevalere e non è configurato alcun token di ambiente/autenticazione; `gateway.remote.password` è attivo solo quando l'autenticazione tramite password può prevalere e non è configurata alcuna password di ambiente/autenticazione.
- La SecretRef `gateway.auth.token` è inattiva per la risoluzione dell'autenticazione all'avvio quando è impostato `OPENCLAW_GATEWAY_TOKEN`, perché l'input del token di ambiente prevale per tale runtime.

</Accordion>

## Diagnostica delle superfici di autenticazione del Gateway

Quando viene impostata una SecretRef su `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` o `gateway.remote.password`, l'avvio o il ricaricamento del Gateway registra lo stato della superficie con il codice `SECRETS_GATEWAY_AUTH_SURFACE`:

- `active`: la SecretRef fa parte della superficie di autenticazione effettiva e deve essere risolta.
- `inactive`: prevale un'altra superficie di autenticazione oppure l'autenticazione remota è disabilitata/non attiva.

La voce di log include il motivo applicato dai criteri delle superfici attive.

## Controllo preliminare dei riferimenti durante l'onboarding

Nell'onboarding interattivo, la scelta dell'archiviazione SecretRef esegue una convalida preliminare prima del salvataggio:

- Riferimenti all'ambiente: convalida il nome della variabile di ambiente e verifica che durante la configurazione sia visibile un valore non vuoto.
- Riferimenti ai provider (`file` o `exec`): convalida la selezione del provider, risolve `id` e controlla il tipo del valore risolto.
- Flusso di avvio rapido: quando `gateway.auth.token` è già una SecretRef, l'onboarding la risolve prima del probe e dell'inizializzazione della dashboard (per i riferimenti `env`, `file` e `exec`) usando lo stesso punto di controllo con terminazione immediata in caso di errore.

In caso di errore di convalida, viene mostrato l'errore ed è possibile riprovare.

## Contratto SecretRef

Un'unica struttura dell'oggetto ovunque:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Nei campi SecretInput sono accettate anche stringhe abbreviate:

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
    - `id` deve essere un puntatore JSON assoluto (`/...`) oppure il valore letterale `value` per i provider `singleValue`
    - Escape RFC 6901 nei segmenti: `~` diventa `~0`, `/` diventa `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Convalida:

    - `provider` deve corrispondere a `^[a-z][a-z0-9_-]{0,63}$`
    - `id` deve corrispondere a `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (supporta selettori come `secret#json_key`)
    - `id` non deve contenere `.` o `..` come segmenti di percorso delimitati da barre (ad esempio, `a/../b` viene rifiutato)

  </Tab>
</Tabs>

## Configurazione dei provider

Definire i provider in `secrets.providers`:

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

<Accordion title="Provider di ambiente">
- Elenco consentito facoltativo di nomi esatti tramite `allowlist`.
- I valori di ambiente mancanti o vuoti causano il fallimento della risoluzione.

</Accordion>

<Accordion title="Provider di file">
- Legge il file locale in `path`.
- `mode: "json"` (valore predefinito) prevede un payload costituito da un oggetto JSON e risolve `id` come puntatore JSON.
- `mode: "singleValue"` prevede l'ID riferimento `"value"` e restituisce il contenuto non elaborato del file (rimuovendo il carattere di nuova riga finale).
- Il percorso deve superare i controlli di proprietà/autorizzazioni; `timeoutMs` (valore predefinito 5000) e `maxBytes` (valore predefinito 1 MiB) limitano la lettura.
- Comportamento sicuro in caso di errore su Windows: se la verifica ACL non è disponibile per il percorso, la risoluzione non riesce. Solo per i percorsi attendibili, impostare `allowInsecurePath: true` sul relativo provider per ignorare il controllo.

</Accordion>

<Accordion title="Provider exec">
- Esegue direttamente il percorso assoluto del file binario configurato, senza shell.
- Per impostazione predefinita, `command` deve essere un file regolare, non un collegamento simbolico. Impostare `allowSymlinkCommand: true` per consentire percorsi di comando con collegamenti simbolici (ad esempio gli shim di Homebrew) e abbinarlo a `trustedDirs` (ad esempio `["/opt/homebrew"]`), affinché siano idonei solo i percorsi del gestore di pacchetti.
- Supporta `timeoutMs` (valore predefinito 5000), `noOutputTimeoutMs` (valore predefinito uguale a `timeoutMs`), `maxOutputBytes` (valore predefinito 1 MiB), la lista consentita `env`/`passEnv` e `trustedDirs`.
- Il valore predefinito di `jsonOnly` è `true`. Con `jsonOnly: false` e un singolo id richiesto, lo stdout semplice non JSON viene accettato come valore di tale id.
- Comportamento fail-closed su Windows: se la verifica ACL non è disponibile per il percorso del comando, la risoluzione non riesce. Solo per i percorsi attendibili, impostare `allowInsecurePath: true` su tale provider per ignorare il controllo.
- I provider exec gestiti dai Plugin possono usare `pluginIntegration` invece di una copia di `command`/`args`. OpenClaw risolve i dettagli correnti del comando dal manifesto del Plugin installato durante l'avvio o il ricaricamento; se il Plugin è disabilitato, rimosso, non attendibile o non dichiara più l'integrazione, i SecretRef attivi su tale provider adottano un comportamento fail-closed.

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
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` è una diagnostica facoltativa leggibile dalla macchina. OpenClaw visualizza i codici riconosciuti
`NOT_FOUND` e `AMBIGUOUS_DUPLICATE_KEY` insieme al provider e all'id del riferimento. Altri
codici e campi in formato libero come `message` sono accettati per la compatibilità con il protocollo v1,
ma non vengono visualizzati perché l'output del resolver può contenere materiale relativo alle credenziali.

</Accordion>

## Chiavi API basate su file

Non inserire stringhe `file:...` nel blocco `env` della configurazione. Tale blocco è letterale e non sovrascrivibile, pertanto `file:...` non viene mai risolto al suo interno.

Usare invece un SecretRef basato su file in un campo delle credenziali supportato:

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

Per `mode: "singleValue"`, il valore `id` del SecretRef è `"value"`. Per `mode: "json"`, usare un puntatore JSON assoluto come `"/providers/xai/apiKey"`.

Consultare [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface) per i campi che accettano SecretRef.

## Esempi di integrazione exec

Per una guida dedicata a 1Password che tratta gli account di servizio, la skill dell'agente inclusa e la risoluzione dei problemi, consultare [1Password](/gateway/1password).

<AccordionGroup>
  <Accordion title="CLI di 1Password">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // obbligatorio per i file binari di Homebrew collegati simbolicamente
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
    Usare un wrapper del resolver per associare gli id SecretRef alle chiavi degli elementi di Bitwarden Secrets Manager. Il repository include `scripts/secrets/openclaw-bws-resolver.mjs`; installarlo o copiarlo in un percorso assoluto attendibile sull'host che esegue il Gateway.

    Requisiti:

    - CLI di Bitwarden Secrets Manager (`bws`) installata sull'host del Gateway.
    - `BWS_ACCESS_TOKEN` disponibile per il servizio Gateway.
    - `PATH` passato al resolver oppure `BWS_BIN` impostato sul percorso assoluto del file binario `bws`.
    - `BWS_SERVER_URL` impostato nell'ambiente quando si usa un'istanza Bitwarden in hosting autonomo.

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

    Il resolver raggruppa gli id richiesti, esegue `bws secret list` e restituisce i valori per i campi `key` dei segreti corrispondenti. Usare chiavi che soddisfino il contratto degli id SecretRef exec, come `openclaw/providers/openai/apiKey`; le chiavi in stile variabile d'ambiente con trattini bassi vengono rifiutate prima dell'esecuzione del resolver. Se più di un segreto Bitwarden visibile condivide la chiave richiesta, il resolver segnala tale id come ambiguo invece di formulare un'ipotesi. Dopo aver aggiornato la configurazione, verificare il percorso del resolver:

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="CLI di HashiCorp Vault">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // obbligatorio per i file binari di Homebrew collegati simbolicamente
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
    Usare un piccolo wrapper del resolver per associare direttamente gli id SecretRef alle voci `pass`. Salvarlo come eseguibile in un percorso assoluto che superi i controlli sui percorsi del provider exec, ad esempio `/usr/local/bin/openclaw-pass-resolver`. Lo shebang `#!/usr/bin/env node` risolve `node` dal valore `PATH` del processo del resolver, quindi includere `PATH` in `passEnv`. Se `pass` non si trova in tale `PATH`, impostare `PASS_BIN` nell'ambiente padre e includerlo anche in `passEnv`:

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
        process.stderr.write(`Impossibile analizzare la richiesta: ${err.message}\n`);
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
          errors[id] = { message: (result.stderr || `pass è terminato con stato ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    Configurare quindi il provider exec e indirizzare `apiKey` al percorso della voce `pass`:

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

    Mantenere il segreto sulla prima riga della voce `pass` oppure personalizzare il wrapper affinché restituisca l'output completo di `pass show`. Dopo aver aggiornato la configurazione, verificare sia l'audit statico sia il percorso del resolver exec:

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
            allowSymlinkCommand: true, // obbligatorio per i file binari di Homebrew collegati simbolicamente
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

## Variabili d'ambiente dei server MCP

Le variabili d'ambiente dei server MCP configurate tramite `plugins.entries.acpx.config.mcpServers` accettano SecretInput, mantenendo le chiavi API e i token fuori dalla configurazione in testo normale:

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

I valori stringa in testo normale continuano a funzionare. I riferimenti ai modelli di ambiente come `${MCP_SERVER_API_KEY}` e gli oggetti SecretRef vengono risolti durante l'attivazione del Gateway, prima dell'avvio del processo del server MCP. Come per le altre superfici SecretRef, i riferimenti non risolti bloccano l'attivazione solo quando il Plugin `acpx` è effettivamente attivo.

## Materiale di autenticazione SSH della sandbox

Il backend sandbox principale `ssh` supporta inoltre SecretRef per il materiale di autenticazione SSH:

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

Comportamento in fase di esecuzione:

- OpenClaw risolve questi riferimenti durante l'attivazione della sandbox, non in modo differito a ogni chiamata SSH.
- I valori risolti vengono scritti in una directory temporanea con autorizzazioni restrittive per i file (`0o600`) e utilizzati nella configurazione SSH generata.
- Se il backend effettivo della sandbox non è `ssh` (o la modalità sandbox è `off`), questi riferimenti restano inattivi e non bloccano l'avvio.

## Superficie delle credenziali supportata

Le credenziali canonicamente supportate e non supportate sono elencate in [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface).

<Note>
Le credenziali generate in fase di esecuzione o soggette a rotazione e il materiale di aggiornamento OAuth sono intenzionalmente esclusi dalla risoluzione SecretRef di sola lettura.
</Note>

## Comportamento richiesto e precedenza

- Campo senza riferimento: invariato.
- Campo con un riferimento: obbligatorio sulle superfici attive durante l'attivazione.
- Se sono presenti sia il testo in chiaro sia il riferimento, quest'ultimo ha la precedenza nei percorsi di precedenza supportati.
- Il valore sentinella di oscuramento `__OPENCLAW_REDACTED__` è riservato all'oscuramento/ripristino interno della configurazione e viene rifiutato come dato di configurazione letterale inviato.

Segnali di avviso e controllo:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (avviso in fase di esecuzione)
- `REF_SHADOWED` (rilievo del controllo quando le credenziali `auth-profiles.json` hanno la precedenza sui riferimenti `openclaw.json`)

Compatibilità con Google Chat: `serviceAccountRef` ha la precedenza sul valore in testo in chiaro `serviceAccount`; il valore in testo in chiaro viene ignorato una volta impostato il riferimento associato.

## Trigger di attivazione

L'attivazione dei segreti viene eseguita in occasione di:

- Avvio (controllo preliminare e attivazione finale)
- Percorso di applicazione a caldo del ricaricamento della configurazione
- Percorso di verifica del riavvio del ricaricamento della configurazione
- Ricaricamento manuale tramite `secrets.reload`
- Controllo preliminare dell'RPC di scrittura della configurazione del Gateway (`config.set` / `config.apply` / `config.patch`), che verifica la risolvibilità dei SecretRef delle superfici attive nel payload di configurazione inviato prima di rendere persistenti le modifiche

Contratto di attivazione:

- In caso di esito positivo, lo snapshot viene sostituito atomicamente.
- Un errore all'avvio interrompe l'avvio del Gateway.
- In caso di errore durante il ricaricamento in fase di esecuzione, viene mantenuto l'ultimo snapshot valido noto.
- Un errore nel controllo preliminare dell'RPC di scrittura rifiuta la configurazione inviata; sia la configurazione su disco sia lo snapshot attivo in fase di esecuzione restano invariati.
- Fornire un token di canale esplicito per singola chiamata a una chiamata di strumento/helper in uscita non attiva SecretRef; i punti di attivazione restano l'avvio, il ricaricamento e `secrets.reload` esplicito.

## Segnali di stato degradato e ripristinato

Quando l'attivazione durante il ricaricamento non riesce dopo uno stato integro, OpenClaw entra nello stato degradato dei segreti, emettendo eventi di sistema una tantum e codici di log:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamento:

- Stato degradato: l'ambiente di esecuzione mantiene l'ultimo snapshot valido noto.
- Stato ripristinato: viene emesso una sola volta dopo la successiva attivazione riuscita.
- Gli errori ripetuti quando lo stato è già degradato registrano avvisi, ma non emettono nuovamente l'evento.
- L'interruzione immediata all'avvio non emette mai un evento di stato degradato, perché l'ambiente di esecuzione non è mai diventato attivo.

## Risoluzione dei percorsi dei comandi

I percorsi dei comandi possono abilitare la risoluzione SecretRef supportata tramite un'RPC dello snapshot del Gateway. Si applicano due comportamenti generali:

<Tabs>
  <Tab title="Percorsi dei comandi rigorosi">
    Ad esempio, i percorsi di memoria remota `openclaw memory` e `openclaw qr --remote` quando richiede riferimenti remoti a segreti condivisi. Leggono dallo snapshot attivo e interrompono immediatamente l'operazione quando un SecretRef obbligatorio non è disponibile.
  </Tab>
  <Tab title="Percorsi dei comandi di sola lettura">
    Ad esempio `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` e i flussi di riparazione doctor/configurazione di sola lettura. Preferiscono anch'essi lo snapshot attivo, ma passano a uno stato degradato anziché interrompersi quando un SecretRef specifico non è disponibile.

    Comportamento di sola lettura:

    - Quando il Gateway è in esecuzione, questi comandi leggono innanzitutto dallo snapshot attivo.
    - Se la risoluzione del Gateway è incompleta o il Gateway non è disponibile, tentano un fallback locale mirato per la superficie del comando interessata.
    - Se un SecretRef specifico continua a non essere disponibile, il comando prosegue con un output degradato di sola lettura e una diagnostica esplicita che indica che il riferimento è configurato ma non disponibile nel percorso del comando.
    - Questo comportamento degradato è limitato al comando; non indebolisce i percorsi di avvio, ricaricamento o invio/autenticazione in fase di esecuzione.

  </Tab>
</Tabs>

Altre note:

- L'aggiornamento dello snapshot dopo la rotazione dei segreti del backend viene gestito da `openclaw secrets reload`.
- Metodo RPC del Gateway utilizzato da questi percorsi dei comandi: `secrets.resolve`.

## Flusso di controllo e configurazione

Flusso predefinito per l'operatore:

<Steps>
  <Step title="Controllare lo stato attuale">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Configurare e applicare i SecretRef">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="Ripetere il controllo">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

Non considerare completata la migrazione finché il nuovo controllo non risulta privo di rilievi. Se il controllo segnala ancora valori in testo in chiaro nei dati archiviati, il rischio di accesso da parte dell'agente permane anche quando le API in fase di esecuzione restituiscono valori oscurati.

Se si salva un piano anziché applicarlo durante `configure`, applicare il piano salvato con `openclaw secrets apply --from <plan-path>` prima di ripetere il controllo.

<AccordionGroup>
  <Accordion title="secrets audit">
    I rilievi includono:

    - Valori in testo in chiaro nei dati archiviati (`openclaw.json`, `auth-profiles.json`, `.env` e `agents/*/agent/models.json` generato).
    - Residui in testo in chiaro di intestazioni sensibili dei provider nelle voci `models.json` generate.
    - Riferimenti non risolti.
    - Occultamento dovuto alla precedenza (`auth-profiles.json` ha la priorità sui riferimenti `openclaw.json`).
    - Residui legacy (`auth.json`, promemoria OAuth).

    Nota sull'esecuzione: per impostazione predefinita, il controllo ignora le verifiche di risolvibilità dei SecretRef exec per evitare effetti collaterali dei comandi. Utilizzare `openclaw secrets audit --allow-exec` per eseguire i provider exec durante il controllo.

    Nota sui residui delle intestazioni: il rilevamento delle intestazioni sensibili dei provider è basato su euristiche relative ai nomi (nomi e frammenti comuni di intestazioni di autenticazione/credenziali, come `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Helper interattivo che:

    - Configura prima `secrets.providers` (`env`/`file`/`exec`, aggiunta/modifica/rimozione).
    - Consente di selezionare i campi supportati contenenti segreti in `openclaw.json`, oltre a `auth-profiles.json`, per l'ambito di un agente.
    - Può creare una nuova mappatura `auth-profiles.json` direttamente nel selettore della destinazione.
    - Acquisisce i dettagli SecretRef (`source`, `provider`, `id`).
    - Esegue la risoluzione preliminare e può applicare immediatamente le modifiche.

    Nota sull'esecuzione: il controllo preliminare ignora le verifiche SecretRef exec, a meno che non sia impostato `--allow-exec`. Se si applica direttamente da `configure --apply` e il piano include riferimenti/provider exec, mantenere impostato `--allow-exec` anche per il passaggio di applicazione.

    Modalità utili:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Impostazioni predefinite di applicazione di `configure`:

    - Rimuove le credenziali statiche corrispondenti da `auth-profiles.json` per i provider interessati.
    - Rimuove le voci statiche legacy `api_key` da `auth.json`.
    - Rimuove le righe di segreti noti corrispondenti da `<config-dir>/.env`.

  </Accordion>
  <Accordion title="secrets apply">
    Applicare un piano salvato:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Nota sull'esecuzione: la simulazione ignora i controlli exec, a meno che non sia impostato `--allow-exec`; la modalità di scrittura rifiuta i piani contenenti SecretRef/provider exec, a meno che non sia impostato `--allow-exec`.

    Per i dettagli rigorosi del contratto destinazione/percorso e le regole esatte di rifiuto, consultare [Contratto del piano di applicazione dei segreti](/it/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Criterio di sicurezza unidirezionale

<Warning>
OpenClaw non scrive intenzionalmente backup di rollback contenenti valori segreti storici in testo in chiaro.
</Warning>

Modello di sicurezza:

- Il controllo preliminare deve riuscire prima della modalità di scrittura.
- L'attivazione in fase di esecuzione viene convalidata prima del commit.
- L'applicazione aggiorna i file mediante sostituzione atomica e tenta il ripristino in caso di errore.

## Note sulla compatibilità dell'autenticazione legacy

Per le credenziali statiche, l'ambiente di esecuzione non dipende più dall'archiviazione dell'autenticazione legacy in testo in chiaro.

- La fonte delle credenziali in fase di esecuzione è lo snapshot risolto in memoria.
- Le voci statiche legacy `api_key` vengono rimosse quando rilevate.
- Il comportamento di compatibilità relativo a OAuth resta separato.

## Nota sull'interfaccia web

Alcune unioni SecretInput sono più facili da configurare nella modalità editor non elaborato che nella modalità modulo.

## Risorse correlate

- [Autenticazione](/it/gateway/authentication) - configurazione dell'autenticazione
- [CLI: segreti](/it/cli/secrets) - comandi CLI
- [SecretRef di Vault](/it/plugins/vault) - configurazione del provider HashiCorp Vault
- [Variabili di ambiente](/it/help/environment) - precedenza delle variabili di ambiente
- [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface) - superficie delle credenziali
- [Contratto del piano di applicazione dei segreti](/it/gateway/secrets-plan-contract) - dettagli del contratto del piano
- [Sicurezza](/it/gateway/security) - strategia di sicurezza
