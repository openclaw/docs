---
read_when:
    - Devi sapere quali variabili d'ambiente vengono caricate e in quale ordine
    - Stai eseguendo il debug di API key mancanti nel Gateway
    - Stai documentando l'autenticazione del provider o gli ambienti di distribuzione
summary: Da dove OpenClaw carica le variabili d'ambiente e l'ordine di precedenza
title: Variabili d'ambiente
x-i18n:
    generated_at: "2026-04-24T08:43:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0538e07cc2f785224b5f061bdaee982c4c849838e9d637defcc86a5121710df
    source_path: help/environment.md
    workflow: 15
---

OpenClaw recupera le variabili d'ambiente da più sorgenti. La regola è **non sovrascrivere mai i valori esistenti**.

## Precedenza (massima → minima)

1. **Ambiente del processo** (ciò che il processo Gateway ha già dalla shell/dal demone padre).
2. **`.env` nella directory di lavoro corrente** (predefinito dotenv; non sovrascrive).
3. **`.env` globale** in `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`; non sovrascrive).
4. **Blocco `env` nella configurazione** in `~/.openclaw/openclaw.json` (applicato solo se mancante).
5. **Import facoltativo dalla login shell** (`env.shellEnv.enabled` o `OPENCLAW_LOAD_SHELL_ENV=1`), applicato solo alle chiavi attese mancanti.

Sulle installazioni Ubuntu pulite che usano la directory di stato predefinita, OpenClaw tratta anche `~/.config/openclaw/gateway.env` come fallback di compatibilità dopo il `.env` globale. Se entrambi i file esistono e non coincidono, OpenClaw mantiene `~/.openclaw/.env` e stampa un avviso.

Se il file di configurazione manca del tutto, il passaggio 4 viene saltato; l'import dalla shell continua comunque se abilitato.

## Blocco `env` nella configurazione

Due modi equivalenti per impostare variabili env inline (entrambi non sovrascrivono):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## Import dell'env della shell

`env.shellEnv` esegue la tua login shell e importa solo le chiavi attese **mancanti**:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Equivalenti tramite variabili d'ambiente:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Variabili env iniettate a runtime

OpenClaw inietta anche marcatori di contesto nei processi figli generati:

- `OPENCLAW_SHELL=exec`: impostata per i comandi eseguiti tramite lo strumento `exec`.
- `OPENCLAW_SHELL=acp`: impostata per i processi generati dal backend runtime ACP (ad esempio `acpx`).
- `OPENCLAW_SHELL=acp-client`: impostata per `openclaw acp client` quando genera il processo bridge ACP.
- `OPENCLAW_SHELL=tui-local`: impostata per i comandi shell `!` della TUI locale.

Questi sono marcatori runtime (non configurazione utente obbligatoria). Possono essere usati nella logica di shell/profilo
per applicare regole specifiche del contesto.

## Variabili env della UI

- `OPENCLAW_THEME=light`: forza la palette chiara della TUI quando il terminale ha uno sfondo chiaro.
- `OPENCLAW_THEME=dark`: forza la palette scura della TUI.
- `COLORFGBG`: se il terminale la esporta, OpenClaw usa l'indicazione del colore di sfondo per scegliere automaticamente la palette TUI.

## Sostituzione delle variabili env nella configurazione

Puoi fare riferimento direttamente alle variabili env nei valori stringa della configurazione usando la sintassi `${VAR_NAME}`:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

Vedi [Configuration: Env var substitution](/it/gateway/configuration-reference#env-var-substitution) per i dettagli completi.

## Secret ref vs stringhe `${ENV}`

OpenClaw supporta due pattern guidati dalle env:

- Sostituzione di stringhe `${VAR}` nei valori di configurazione.
- Oggetti SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) per i campi che supportano riferimenti a secret.

Entrambi si risolvono dall'ambiente del processo al momento dell'attivazione. I dettagli dei SecretRef sono documentati in [Secrets Management](/it/gateway/secrets).

## Variabili env legate ai percorsi

| Variabile              | Scopo                                                                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | Sovrascrive la directory home usata per tutta la risoluzione interna dei percorsi (`~/.openclaw/`, directory agente, sessioni, credenziali). Utile quando OpenClaw viene eseguito come utente di servizio dedicato. |
| `OPENCLAW_STATE_DIR`   | Sovrascrive la directory di stato (predefinita `~/.openclaw`).                                                                                                                     |
| `OPENCLAW_CONFIG_PATH` | Sovrascrive il percorso del file di configurazione (predefinito `~/.openclaw/openclaw.json`).                                                                                     |

## Logging

| Variabile            | Scopo                                                                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Sovrascrive il livello di log sia per file sia per console (ad esempio `debug`, `trace`). Ha priorità su `logging.level` e `logging.consoleLevel` nella configurazione. I valori non validi vengono ignorati con un avviso. |

### `OPENCLAW_HOME`

Quando è impostato, `OPENCLAW_HOME` sostituisce la directory home di sistema (`$HOME` / `os.homedir()`) per tutta la risoluzione interna dei percorsi. Questo consente un isolamento completo del filesystem per account di servizio headless.

**Precedenza:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Esempio** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` può anche essere impostato su un percorso con tilde (ad esempio `~/svc`), che viene espanso usando `$HOME` prima dell'uso.

## Utenti nvm: errori TLS in web_fetch

Se Node.js è stato installato tramite **nvm** (non tramite il package manager di sistema), `fetch()` integrato usa
l'archivio CA incluso di nvm, che potrebbe non contenere CA root moderne (ISRG Root X1/X2 per Let's Encrypt,
DigiCert Global Root G2, ecc.). Questo fa fallire `web_fetch` con `"fetch failed"` sulla maggior parte dei siti HTTPS.

Su Linux, OpenClaw rileva automaticamente nvm e applica la correzione nell'ambiente di avvio effettivo:

- `openclaw gateway install` scrive `NODE_EXTRA_CA_CERTS` nell'ambiente del servizio systemd
- il punto d'ingresso CLI `openclaw` riesegue se stesso con `NODE_EXTRA_CA_CERTS` impostato prima dell'avvio di Node

**Correzione manuale (per versioni meno recenti o avvii diretti `node ...`):**

Esporta la variabile prima di avviare OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Non fare affidamento sul solo file `~/.openclaw/.env` per questa variabile; Node legge
`NODE_EXTRA_CA_CERTS` all'avvio del processo.

## Correlati

- [Gateway configuration](/it/gateway/configuration)
- [FAQ: env vars and .env loading](/it/help/faq#env-vars-and-env-loading)
- [Models overview](/it/concepts/models)
