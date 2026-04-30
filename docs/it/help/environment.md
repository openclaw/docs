---
read_when:
    - È necessario sapere quali variabili d'ambiente vengono caricate e in quale ordine
    - Stai eseguendo il debug delle chiavi API mancanti nel Gateway
    - Stai documentando l'autenticazione del provider o gli ambienti di distribuzione
summary: Da dove OpenClaw carica le variabili d'ambiente e l'ordine di precedenza
title: Variabili d'ambiente
x-i18n:
    generated_at: "2026-04-30T08:55:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: d19b9053207a088b3eb39d03e36fc2d415295feb80da51bd71339884466b101b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw carica le variabili d'ambiente da più sorgenti. La regola è **non sovrascrivere mai i valori esistenti**.

## Precedenza (dalla più alta alla più bassa)

1. **Ambiente del processo** (ciò che il processo Gateway ha già ricevuto dalla shell o dal daemon padre).
2. **`.env` nella directory di lavoro corrente** (impostazione predefinita di dotenv; non sovrascrive).
3. **`.env` globale** in `~/.openclaw/.env` (ovvero `$OPENCLAW_STATE_DIR/.env`; non sovrascrive).
4. **Blocco `env` della configurazione** in `~/.openclaw/openclaw.json` (applicato solo se mancante).
5. **Importazione opzionale dalla shell di login** (`env.shellEnv.enabled` o `OPENCLAW_LOAD_SHELL_ENV=1`), applicata solo per le chiavi attese mancanti.

Nelle installazioni Ubuntu nuove che usano la directory di stato predefinita, OpenClaw tratta anche `~/.config/openclaw/gateway.env` come fallback di compatibilità dopo il `.env` globale. Se entrambi i file esistono e non concordano, OpenClaw mantiene `~/.openclaw/.env` e stampa un avviso.

Se il file di configurazione manca del tutto, il passaggio 4 viene saltato; l'importazione dalla shell viene comunque eseguita se abilitata.

## Blocco `env` della configurazione

Due modi equivalenti per impostare variabili d'ambiente inline (entrambi non sovrascrivono):

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

## Importazione delle variabili d'ambiente dalla shell

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

Equivalenti come variabili d'ambiente:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Variabili d'ambiente iniettate a runtime

OpenClaw inietta anche marcatori di contesto nei processi figli avviati:

- `OPENCLAW_SHELL=exec`: impostato per i comandi eseguiti tramite lo strumento `exec`.
- `OPENCLAW_SHELL=acp`: impostato per gli avvii dei processi backend runtime ACP (per esempio `acpx`).
- `OPENCLAW_SHELL=acp-client`: impostato per `openclaw acp client` quando avvia il processo bridge ACP.
- `OPENCLAW_SHELL=tui-local`: impostato per i comandi shell `!` locali della TUI.

Questi sono marcatori di runtime (non configurazione utente obbligatoria). Possono essere usati nella logica di shell/profilo
per applicare regole specifiche del contesto.

## Variabili d'ambiente della UI

- `OPENCLAW_THEME=light`: forza la palette chiara della TUI quando il terminale ha uno sfondo chiaro.
- `OPENCLAW_THEME=dark`: forza la palette scura della TUI.
- `COLORFGBG`: se il terminale la esporta, OpenClaw usa il suggerimento sul colore di sfondo per scegliere automaticamente la palette della TUI.

## Sostituzione delle variabili d'ambiente nella configurazione

Puoi fare riferimento direttamente alle variabili d'ambiente nei valori stringa della configurazione usando la sintassi `${VAR_NAME}`:

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

Consulta [Configurazione: sostituzione delle variabili d'ambiente](/it/gateway/configuration-reference#env-var-substitution) per i dettagli completi.

## Riferimenti ai secret vs stringhe `${ENV}`

OpenClaw supporta due pattern basati sull'ambiente:

- Sostituzione di stringhe `${VAR}` nei valori di configurazione.
- Oggetti SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) per i campi che supportano riferimenti ai secret.

Entrambi vengono risolti dall'ambiente del processo al momento dell'attivazione. I dettagli di SecretRef sono documentati in [Gestione dei secret](/it/gateway/secrets).

## Variabili d'ambiente relative ai percorsi

| Variabile              | Scopo                                                                                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | Sovrascrive la directory home usata per tutta la risoluzione dei percorsi interni (`~/.openclaw/`, directory degli agenti, sessioni, credenziali). Utile quando si esegue OpenClaw come utente di servizio dedicato. |
| `OPENCLAW_STATE_DIR`   | Sovrascrive la directory di stato (predefinita `~/.openclaw`).                                                                                                                                                        |
| `OPENCLAW_CONFIG_PATH` | Sovrascrive il percorso del file di configurazione (predefinito `~/.openclaw/openclaw.json`).                                                                                                                         |

## Logging

| Variabile            | Scopo                                                                                                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Sovrascrive il livello di log sia per file sia per console (ad es. `debug`, `trace`). Ha precedenza su `logging.level` e `logging.consoleLevel` nella configurazione. I valori non validi vengono ignorati con un avviso. |

### `OPENCLAW_HOME`

Quando è impostato, `OPENCLAW_HOME` sostituisce la directory home di sistema (`$HOME` / `os.homedir()`) per tutta la risoluzione dei percorsi interni. Questo consente un isolamento completo del filesystem per account di servizio headless.

**Precedenza:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Esempio** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` può anche essere impostato su un percorso con tilde (ad es. `~/svc`), che viene espanso usando `$HOME` prima dell'uso.

## Utenti nvm: errori TLS di web_fetch

Se Node.js è stato installato tramite **nvm** (non tramite il gestore pacchetti di sistema), il `fetch()` integrato usa
lo store CA incluso in nvm, che potrebbe non contenere CA radice moderne (ISRG Root X1/X2 per Let's Encrypt,
DigiCert Global Root G2, ecc.). Questo causa il fallimento di `web_fetch` con `"fetch failed"` sulla maggior parte dei siti HTTPS.

Su Linux, OpenClaw rileva automaticamente nvm e applica la correzione nell'ambiente di avvio effettivo:

- `openclaw gateway install` scrive `NODE_EXTRA_CA_CERTS` nell'ambiente del servizio systemd
- l'entrypoint della CLI `openclaw` riesegue se stesso con `NODE_EXTRA_CA_CERTS` impostato prima dell'avvio di Node

**Correzione manuale (per versioni precedenti o avvii diretti con `node ...`):**

Esporta la variabile prima di avviare OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Non fare affidamento sulla sola scrittura di questa variabile in `~/.openclaw/.env`; Node legge
`NODE_EXTRA_CA_CERTS` all'avvio del processo.

## Variabili d'ambiente legacy

OpenClaw legge solo variabili d'ambiente `OPENCLAW_*`. I prefissi legacy
`CLAWDBOT_*` e `MOLTBOT_*` delle versioni precedenti vengono ignorati
silenziosamente.

Se una di queste è ancora impostata sul processo Gateway all'avvio, OpenClaw emette un
singolo avviso di deprecazione Node (`OPENCLAW_LEGACY_ENV_VARS`) che elenca i
prefissi rilevati e il conteggio totale. Rinomina ogni valore sostituendo il
prefisso legacy con `OPENCLAW_` (per esempio `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); i vecchi nomi non hanno alcun effetto.

## Correlati

- [Configurazione del Gateway](/it/gateway/configuration)
- [FAQ: variabili d'ambiente e caricamento di .env](/it/help/faq#env-vars-and-env-loading)
- [Panoramica dei modelli](/it/concepts/models)
