---
read_when:
    - Hai bisogno di sapere quali variabili env vengono caricate e in quale ordine
    - Stai eseguendo il debug di chiavi API mancanti nel Gateway
    - Stai documentando l'autenticazione dei provider o gli ambienti di deployment
summary: Dove OpenClaw carica le variabili d'ambiente e l'ordine di precedenza
title: Variabili d'ambiente
x-i18n:
    generated_at: "2026-04-05T13:54:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80aea69ca2ffe19a4e93140f05dd81fd576955562ff9913135d38a685a0353c
    source_path: help/environment.md
    workflow: 15
---

# Variabili d'ambiente

OpenClaw recupera le variabili d'ambiente da più fonti. La regola è **non sovrascrivere mai i valori esistenti**.

## Precedenza (dalla più alta → alla più bassa)

1. **Ambiente del processo** (ciò che il processo Gateway ha già dalla shell/dal demone padre).
2. **`.env` nella directory di lavoro corrente** (predefinito dotenv; non sovrascrive).
3. **`.env` globale** in `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`; non sovrascrive).
4. **Blocco `env` della configurazione** in `~/.openclaw/openclaw.json` (applicato solo se mancante).
5. **Import facoltativo della shell di login** (`env.shellEnv.enabled` o `OPENCLAW_LOAD_SHELL_ENV=1`), applicato solo per le chiavi attese mancanti.

Nelle installazioni Ubuntu appena eseguite che usano la directory di stato predefinita, OpenClaw tratta anche `~/.config/openclaw/gateway.env` come fallback di compatibilità dopo il `.env` globale. Se entrambi i file esistono e non coincidono, OpenClaw mantiene `~/.openclaw/.env` e stampa un avviso.

Se il file di configurazione manca del tutto, il passaggio 4 viene saltato; l'import della shell viene comunque eseguito se abilitato.

## Blocco `env` della configurazione

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

## Import env della shell

`env.shellEnv` esegue la tua shell di login e importa solo le chiavi attese **mancanti**:

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

Variabili env equivalenti:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Variabili env iniettate a runtime

OpenClaw inietta anche marcatori di contesto nei processi figlio generati:

- `OPENCLAW_SHELL=exec`: impostato per i comandi eseguiti tramite lo strumento `exec`.
- `OPENCLAW_SHELL=acp`: impostato per le generazioni di processi del backend runtime ACP (ad esempio `acpx`).
- `OPENCLAW_SHELL=acp-client`: impostato per `openclaw acp client` quando genera il processo bridge ACP.
- `OPENCLAW_SHELL=tui-local`: impostato per i comandi shell locali `!` della TUI.

Questi sono marcatori runtime (non una configurazione utente richiesta). Possono essere usati nella logica della shell/del profilo
per applicare regole specifiche del contesto.

## Variabili env della UI

- `OPENCLAW_THEME=light`: forza la palette TUI chiara quando il terminale ha uno sfondo chiaro.
- `OPENCLAW_THEME=dark`: forza la palette TUI scura.
- `COLORFGBG`: se il terminale la esporta, OpenClaw usa l'indizio sul colore di sfondo per scegliere automaticamente la palette TUI.

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

Vedi [Configurazione: sostituzione delle variabili env](/gateway/configuration-reference#env-var-substitution) per i dettagli completi.

## SecretRef vs stringhe `${ENV}`

OpenClaw supporta due modelli guidati da env:

- sostituzione di stringhe `${VAR}` nei valori di configurazione.
- oggetti SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) per i campi che supportano riferimenti ai segreti.

Entrambi vengono risolti dall'env del processo al momento dell'attivazione. I dettagli di SecretRef sono documentati in [Gestione dei segreti](/gateway/secrets).

## Variabili env relative ai percorsi

| Variabile             | Scopo                                                                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`       | Sovrascrive la directory home usata per tutta la risoluzione dei percorsi interni (`~/.openclaw/`, directory agente, sessioni, credenziali). Utile quando OpenClaw viene eseguito come utente di servizio dedicato. |
| `OPENCLAW_STATE_DIR`  | Sovrascrive la directory di stato (predefinita `~/.openclaw`).                                                                                                                     |
| `OPENCLAW_CONFIG_PATH`| Sovrascrive il percorso del file di configurazione (predefinito `~/.openclaw/openclaw.json`).                                                                                     |

## Logging

| Variabile            | Scopo                                                                                                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Sovrascrive il livello di log sia per il file sia per la console (ad esempio `debug`, `trace`). Ha precedenza su `logging.level` e `logging.consoleLevel` nella configurazione. I valori non validi vengono ignorati con un avviso. |

### `OPENCLAW_HOME`

Quando impostato, `OPENCLAW_HOME` sostituisce la directory home del sistema (`$HOME` / `os.homedir()`) per tutta la risoluzione dei percorsi interni. Questo consente un isolamento completo del filesystem per gli account di servizio headless.

**Precedenza:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Esempio** (LaunchDaemon macOS):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` può anche essere impostato su un percorso con tilde (ad esempio `~/svc`), che viene espanso usando `$HOME` prima dell'uso.

## Utenti nvm: errori TLS di `web_fetch`

Se Node.js è stato installato tramite **nvm** (non il gestore di pacchetti di sistema), il `fetch()` integrato usa
l'archivio CA incluso di nvm, che potrebbe non contenere CA root moderne (ISRG Root X1/X2 per Let's Encrypt,
DigiCert Global Root G2, ecc.). Questo fa fallire `web_fetch` con `"fetch failed"` sulla maggior parte dei siti HTTPS.

Su Linux, OpenClaw rileva automaticamente nvm e applica la correzione nell'ambiente di avvio effettivo:

- `openclaw gateway install` scrive `NODE_EXTRA_CA_CERTS` nell'ambiente del servizio systemd
- l'entrypoint della CLI `openclaw` riesegue se stesso con `NODE_EXTRA_CA_CERTS` impostato prima dell'avvio di Node

**Correzione manuale (per versioni più vecchie o avvii diretti `node ...`):**

Esporta la variabile prima di avviare OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Non fare affidamento sul solo inserimento di questa variabile in `~/.openclaw/.env`; Node legge
`NODE_EXTRA_CA_CERTS` all'avvio del processo.

## Correlati

- [Configurazione del Gateway](/gateway/configuration)
- [FAQ: variabili env e caricamento .env](/help/faq#env-vars-and-env-loading)
- [Panoramica dei modelli](/concepts/models)
