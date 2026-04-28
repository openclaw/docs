---
read_when:
    - Configurazione di SecretRef per credenziali del provider e ref di `auth-profiles.json`
    - Gestione sicura in produzione di reload, audit, configure e apply dei segreti
    - Comprendere fail-fast all’avvio, filtro delle superfici inattive e comportamento last-known-good
sidebarTitle: Secrets management
summary: 'Gestione dei segreti: contratto SecretRef, comportamento dello snapshot runtime e scrub unidirezionale sicuro'
title: Gestione dei segreti
x-i18n:
    generated_at: "2026-04-26T11:30:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8697a8eb15cf6ef9b105e3f12cfdad6205284d4c45f1314cd7aec2e2c81fed1
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw supporta SecretRef additive, così le credenziali supportate non devono essere memorizzate come plaintext nella configurazione.

<Note>
Il plaintext continua a funzionare. SecretRef è opt-in per singola credenziale.
</Note>

## Obiettivi e modello runtime

I segreti vengono risolti in uno snapshot runtime in memoria.

- La risoluzione è eager durante l’attivazione, non lazy nei percorsi di richiesta.
- L’avvio fallisce rapidamente quando un SecretRef effettivamente attivo non può essere risolto.
- Il reload usa uno scambio atomico: successo completo oppure mantenimento dello snapshot last-known-good.
- Le violazioni della policy SecretRef (ad esempio profili auth in modalità OAuth combinati con input SecretRef) fanno fallire l’attivazione prima dello scambio runtime.
- Le richieste runtime leggono solo dallo snapshot attivo in memoria.
- Dopo il primo caricamento/attivazione della config riuscito, i percorsi di codice runtime continuano a leggere quello snapshot attivo in memoria finché un reload riuscito non lo sostituisce.
- Anche i percorsi di recapito in uscita leggono da quello snapshot attivo (ad esempio il recapito di risposte/thread Discord e gli invii di azioni Telegram); non risolvono di nuovo i SecretRef a ogni invio.

Questo tiene le interruzioni dei provider di segreti fuori dai percorsi di richiesta caldi.

## Filtro delle superfici attive

I SecretRef vengono validati solo sulle superfici effettivamente attive.

- Superfici abilitate: i ref non risolti bloccano avvio/reload.
- Superfici inattive: i ref non risolti non bloccano avvio/reload.
- I ref inattivi emettono diagnostica non fatale con codice `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

<AccordionGroup>
  <Accordion title="Esempi di superfici inattive">
    - Voci di canale/account disabilitate.
    - Credenziali di canale di livello superiore che nessun account abilitato eredita.
    - Superfici di strumenti/funzionalità disabilitate.
    - Chiavi specifiche del provider di ricerca web che non sono selezionate da `tools.web.search.provider`. In modalità auto (provider non impostato), le chiavi vengono consultate per precedenza per il rilevamento automatico del provider finché una non viene risolta. Dopo la selezione, le chiavi dei provider non selezionati vengono trattate come inattive finché non vengono selezionate.
    - Il materiale auth SSH della sandbox (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, più gli override per agente) è attivo solo quando il backend sandbox effettivo è `ssh` per l’agente predefinito o per un agente abilitato.
    - I SecretRef `gateway.remote.token` / `gateway.remote.password` sono attivi se vale una di queste condizioni:
      - `gateway.mode=remote`
      - `gateway.remote.url` è configurato
      - `gateway.tailscale.mode` è `serve` o `funnel`
      - In modalità locale senza quelle superfici remote:
        - `gateway.remote.token` è attivo quando l’auth token può prevalere e non è configurato alcun token env/auth.
        - `gateway.remote.password` è attivo solo quando l’auth password può prevalere e non è configurata alcuna password env/auth.
    - Il SecretRef `gateway.auth.token` è inattivo per la risoluzione auth all’avvio quando è impostato `OPENCLAW_GATEWAY_TOKEN`, perché per quel runtime prevale l’input del token env.

  </Accordion>
</AccordionGroup>

## Diagnostica della superficie auth del Gateway

Quando un SecretRef è configurato su `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` o `gateway.remote.password`, l’avvio/reload del gateway registra esplicitamente lo stato della superficie:

- `active`: il SecretRef fa parte della superficie auth effettiva e deve essere risolto.
- `inactive`: il SecretRef viene ignorato per questo runtime perché prevale un’altra superficie auth oppure perché l’auth remota è disabilitata/non attiva.

Queste voci vengono registrate con `SECRETS_GATEWAY_AUTH_SURFACE` e includono il motivo usato dalla policy della superficie attiva, così puoi vedere perché una credenziale è stata trattata come attiva o inattiva.

## Preflight del riferimento durante l’onboarding

Quando l’onboarding viene eseguito in modalità interattiva e scegli l’archiviazione SecretRef, OpenClaw esegue una validazione preflight prima di salvare:

- Ref env: valida il nome della variabile d’ambiente e conferma che durante il setup sia visibile un valore non vuoto.
- Ref provider (`file` o `exec`): valida la selezione del provider, risolve `id` e controlla il tipo del valore risolto.
- Percorso di riuso quickstart: quando `gateway.auth.token` è già un SecretRef, l’onboarding lo risolve prima del bootstrap di probe/dashboard (per ref `env`, `file` ed `exec`) usando lo stesso controllo fail-fast.

Se la validazione fallisce, l’onboarding mostra l’errore e ti permette di riprovare.

## Contratto SecretRef

Usa sempre la stessa forma oggetto:

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
    - `id` deve essere un JSON pointer assoluto (`/...`)
    - Escape RFC6901 nei segmenti: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    Validazione:

    - `provider` deve corrispondere a `^[a-z][a-z0-9_-]{0,63}$`
    - `id` deve corrispondere a `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - `id` non deve contenere `.` o `..` come segmenti di percorso delimitati da slash (ad esempio `a/../b` viene rifiutato)

  </Tab>
</Tabs>

## Config provider

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

<AccordionGroup>
  <Accordion title="Provider env">
    - Allowlist facoltativa tramite `allowlist`.
    - I valori env mancanti/vuoti fanno fallire la risoluzione.

  </Accordion>
  <Accordion title="Provider file">
    - Legge il file locale da `path`.
    - `mode: "json"` si aspetta un payload oggetto JSON e risolve `id` come pointer.
    - `mode: "singleValue"` si aspetta il ref id `"value"` e restituisce il contenuto del file.
    - Il percorso deve superare i controlli di proprietà/permessi.
    - Nota fail-closed Windows: se la verifica ACL non è disponibile per un percorso, la risoluzione fallisce. Solo per percorsi attendibili, imposta `allowInsecurePath: true` su quel provider per bypassare i controlli di sicurezza del percorso.

  </Accordion>
  <Accordion title="Provider exec">
    - Esegue il percorso binario assoluto configurato, senza shell.
    - Per impostazione predefinita, `command` deve puntare a un file regolare (non a un symlink).
    - Imposta `allowSymlinkCommand: true` per consentire percorsi di comando symlink (ad esempio shim di Homebrew). OpenClaw valida il percorso di destinazione risolto.
    - Abbina `allowSymlinkCommand` a `trustedDirs` per i percorsi del package manager (ad esempio `["/opt/homebrew"]`).
    - Supporta timeout, timeout in assenza di output, limiti di byte in output, allowlist env e directory attendibili.
    - Nota fail-closed Windows: se la verifica ACL non è disponibile per il percorso del comando, la risoluzione fallisce. Solo per percorsi attendibili, imposta `allowInsecurePath: true` su quel provider per bypassare i controlli di sicurezza del percorso.

    Payload della richiesta (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Payload della risposta (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    Errori facoltativi per singolo id:

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
  <Accordion title="1Password CLI">
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
  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
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
  </Accordion>
  <Accordion title="sops">
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
  </Accordion>
</AccordionGroup>

## Variabili d’ambiente del server MCP

Le variabili env del server MCP configurate tramite `plugins.entries.acpx.config.mcpServers` supportano SecretInput. Questo mantiene chiavi API e token fuori dalla config in plaintext:

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

I valori stringa plaintext continuano a funzionare. I ref dei template env come `${MCP_SERVER_API_KEY}` e gli oggetti SecretRef vengono risolti durante l’attivazione del gateway prima che venga avviato il processo del server MCP. Come per le altre superfici SecretRef, i ref non risolti bloccano l’attivazione solo quando il Plugin `acpx` è effettivamente attivo.

## Materiale auth SSH della sandbox

Anche il backend sandbox `ssh` del core supporta SecretRef per il materiale auth SSH:

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

- OpenClaw risolve questi ref durante l’attivazione della sandbox, non in modo lazy durante ogni chiamata SSH.
- I valori risolti vengono scritti in file temporanei con permessi restrittivi e usati nella config SSH generata.
- Se il backend sandbox effettivo non è `ssh`, questi ref restano inattivi e non bloccano l’avvio.

## Superficie delle credenziali supportata

Le credenziali canoniche supportate e non supportate sono elencate in:

- [SecretRef Credential Surface](/it/reference/secretref-credential-surface)

<Note>
Le credenziali generate a runtime o rotanti e il materiale di refresh OAuth sono intenzionalmente esclusi dalla risoluzione SecretRef in sola lettura.
</Note>

## Comportamento richiesto e precedenza

- Campo senza ref: invariato.
- Campo con un ref: obbligatorio sulle superfici attive durante l’attivazione.
- Se sono presenti sia plaintext sia ref, il ref ha la precedenza sui percorsi di precedenza supportati.
- Il sentinel di redazione `__OPENCLAW_REDACTED__` è riservato alla redazione/ripristino interno della config e viene rifiutato come dato letterale inviato nella config.

Segnali di warning e audit:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (warning runtime)
- `REF_SHADOWED` (risultato di audit quando le credenziali di `auth-profiles.json` hanno la precedenza sui ref di `openclaw.json`)

Comportamento di compatibilità Google Chat:

- `serviceAccountRef` ha la precedenza su `serviceAccount` in plaintext.
- Il valore plaintext viene ignorato quando è impostato un ref sibling.

## Trigger di attivazione

L’attivazione dei segreti viene eseguita su:

- Avvio (preflight più attivazione finale)
- Percorso hot-apply del reload della config
- Percorso restart-check del reload della config
- Reload manuale tramite `secrets.reload`
- Preflight della RPC di scrittura config del Gateway (`config.set` / `config.apply` / `config.patch`) per la risolvibilità dei SecretRef sulle superfici attive dentro il payload di config inviato prima di persistere le modifiche

Contratto di attivazione:

- Il successo sostituisce lo snapshot in modo atomico.
- Il fallimento all’avvio interrompe l’avvio del gateway.
- Il fallimento del reload runtime mantiene lo snapshot last-known-good.
- Il fallimento del preflight di scrittura RPC rifiuta la config inviata e mantiene invariati sia la config su disco sia lo snapshot runtime attivo.
- Fornire un token di canale esplicito per singola chiamata a una helper/tool call in uscita non attiva l’attivazione SecretRef; i punti di attivazione restano avvio, reload e `secrets.reload` esplicito.

## Segnali di stato degradato e recuperato

Quando l’attivazione al momento del reload fallisce dopo uno stato sano, OpenClaw entra in stato segreti degradato.

Codici di log ed eventi di sistema one-shot:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportamento:

- Degradato: il runtime mantiene lo snapshot last-known-good.
- Recuperato: emesso una sola volta dopo la successiva attivazione riuscita.
- I fallimenti ripetuti quando è già degradato registrano warning ma non producono spam di eventi.
- Il fail-fast all’avvio non emette eventi degradati perché il runtime non è mai diventato attivo.

## Risoluzione nei percorsi di comando

I percorsi di comando possono eseguire l’opt-in alla risoluzione SecretRef supportata tramite RPC snapshot del gateway.

Ci sono due comportamenti generali:

<Tabs>
  <Tab title="Percorsi di comando strict">
    Ad esempio i percorsi di memoria remota di `openclaw memory` e `openclaw qr --remote` quando ha bisogno di ref di segreto condiviso remoto. Leggono dallo snapshot attivo e falliscono rapidamente quando un SecretRef richiesto non è disponibile.
  </Tab>
  <Tab title="Percorsi di comando in sola lettura">
    Ad esempio `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` e i flussi di repair doctor/config in sola lettura. Anche questi preferiscono lo snapshot attivo, ma degradano invece di interrompersi quando un SecretRef mirato non è disponibile in quel percorso di comando.

    Comportamento in sola lettura:

    - Quando il gateway è in esecuzione, questi comandi leggono prima dallo snapshot attivo.
    - Se la risoluzione del gateway è incompleta o il gateway non è disponibile, tentano un fallback locale mirato per la specifica superficie del comando.
    - Se un SecretRef mirato continua a non essere disponibile, il comando prosegue con output degradato in sola lettura e diagnostica esplicita come "configured but unavailable in this command path".
    - Questo comportamento degradato è solo locale al comando. Non indebolisce avvio runtime, reload o i percorsi di invio/auth.

  </Tab>
</Tabs>

Altre note:

- L’aggiornamento dello snapshot dopo la rotazione di un segreto backend viene gestito da `openclaw secrets reload`.
- Metodo RPC del Gateway usato da questi percorsi di comando: `secrets.resolve`.

## Flusso di audit e configurazione

Flusso operatore predefinito:

<Steps>
  <Step title="Controlla lo stato corrente">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="Configura SecretRef">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="Ricontrolla">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    I risultati includono:

    - valori plaintext a riposo (`openclaw.json`, `auth-profiles.json`, `.env` e `agents/*/agent/models.json` generati)
    - residui plaintext di header sensibili del provider nelle voci generate di `models.json`
    - ref non risolti
    - shadowing di precedenza (`auth-profiles.json` che ha priorità sui ref di `openclaw.json`)
    - residui legacy (`auth.json`, promemoria OAuth)

    Nota exec:

    - Per impostazione predefinita, l’audit salta i controlli di risolvibilità dei SecretRef exec per evitare effetti collaterali dei comandi.
    - Usa `openclaw secrets audit --allow-exec` per eseguire i provider exec durante l’audit.

    Nota sui residui di header:

    - Il rilevamento di header sensibili del provider è basato su euristiche di nome (nomi e frammenti comuni di header auth/credenziali come `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

  </Accordion>
  <Accordion title="secrets configure">
    Helper interattivo che:

    - configura prima `secrets.providers` (`env`/`file`/`exec`, aggiungi/modifica/rimuovi)
    - ti permette di selezionare campi supportati che portano segreti in `openclaw.json` più `auth-profiles.json` per uno scope agente
    - può creare direttamente un nuovo mapping `auth-profiles.json` nel selettore di destinazione
    - acquisisce i dettagli del SecretRef (`source`, `provider`, `id`)
    - esegue la risoluzione preflight
    - può applicare immediatamente

    Nota exec:

    - Il preflight salta i controlli SecretRef exec a meno che non sia impostato `--allow-exec`.
    - Se applichi direttamente da `configure --apply` e il piano include ref/provider exec, mantieni impostato `--allow-exec` anche per il passaggio di apply.

    Modalità utili:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    Valori predefiniti di apply per `configure`:

    - scrub delle credenziali statiche corrispondenti da `auth-profiles.json` per i provider mirati
    - scrub delle voci statiche legacy `api_key` da `auth.json`
    - scrub delle righe di segreti noti corrispondenti da `<config-dir>/.env`

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

    - il dry-run salta i controlli exec a meno che non sia impostato `--allow-exec`.
    - la modalità di scrittura rifiuta i piani contenenti SecretRef/provider exec a meno che non sia impostato `--allow-exec`.

    Per i dettagli sul contratto strict target/path e sulle regole esatte di rifiuto, consulta [Secrets Apply Plan Contract](/it/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Policy di sicurezza unidirezionale

<Warning>
OpenClaw intenzionalmente non scrive backup di rollback che contengano valori storici di segreti in plaintext.
</Warning>

Modello di sicurezza:

- il preflight deve riuscire prima della modalità di scrittura
- l’attivazione runtime viene validata prima del commit
- apply aggiorna i file usando sostituzione atomica dei file e ripristino best-effort in caso di fallimento

## Note di compatibilità con l’auth legacy

Per le credenziali statiche, il runtime non dipende più dall’archiviazione auth legacy in plaintext.

- La sorgente delle credenziali runtime è lo snapshot risolto in memoria.
- Le voci statiche legacy `api_key` vengono sottoposte a scrub quando rilevate.
- Il comportamento di compatibilità correlato a OAuth resta separato.

## Nota sulla Web UI

Alcune union SecretInput sono più facili da configurare in modalità editor grezzo che in modalità form.

## Correlati

- [Authentication](/it/gateway/authentication) — configurazione auth
- [CLI: secrets](/it/cli/secrets) — comandi CLI
- [Environment Variables](/it/help/environment) — precedenza delle variabili d’ambiente
- [SecretRef Credential Surface](/it/reference/secretref-credential-surface) — superficie delle credenziali
- [Secrets Apply Plan Contract](/it/gateway/secrets-plan-contract) — dettagli del contratto del piano
- [Security](/it/gateway/security) — postura di sicurezza
