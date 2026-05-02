---
read_when:
    - È necessario sapere quali variabili d'ambiente vengono caricate e in quale ordine
    - Stai eseguendo il debug delle chiavi API mancanti nel Gateway
    - Stai documentando l'autenticazione dei provider o gli ambienti di distribuzione
summary: Dove OpenClaw carica le variabili d'ambiente e l'ordine di precedenza
title: Variabili d'ambiente
x-i18n:
    generated_at: "2026-05-02T08:24:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 66787dd6f87dcaf81f721465e88dda519421b1a598179f71bce0239bb4791c46
    source_path: help/environment.md
    workflow: 16
---

OpenClaw carica le variabili d'ambiente da più fonti. La regola è **non sovrascrivere mai i valori esistenti**.

## Precedenza (dalla più alta alla più bassa)

1. **Ambiente del processo** (ciò che il processo Gateway ha già dalla shell/daemon padre).
2. **`.env` nella directory di lavoro corrente** (predefinito di dotenv; non sovrascrive).
3. **`.env` globale** in `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`; non sovrascrive).
4. **Blocco `env` della configurazione** in `~/.openclaw/openclaw.json` (applicato solo se mancante).
5. **Importazione opzionale della shell di login** (`env.shellEnv.enabled` o `OPENCLAW_LOAD_SHELL_ENV=1`), applicata solo per le chiavi attese mancanti.

Nelle nuove installazioni su Ubuntu che usano la directory di stato predefinita, OpenClaw tratta anche `~/.config/openclaw/gateway.env` come fallback di compatibilità dopo il `.env` globale. Se entrambi i file esistono e sono in disaccordo, OpenClaw mantiene `~/.openclaw/.env` e stampa un avviso.

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

## Importazione dell'ambiente della shell

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

OpenClaw inietta anche marcatori di contesto nei processi figli generati:

- `OPENCLAW_SHELL=exec`: impostata per i comandi eseguiti tramite lo strumento `exec`.
- `OPENCLAW_SHELL=acp`: impostata per la generazione di processi del backend runtime ACP (per esempio `acpx`).
- `OPENCLAW_SHELL=acp-client`: impostata per `openclaw acp client` quando genera il processo bridge ACP.
- `OPENCLAW_SHELL=tui-local`: impostata per i comandi shell `!` della TUI locale.

Questi sono marcatori di runtime (non configurazione utente richiesta). Possono essere usati nella logica di shell/profilo
per applicare regole specifiche del contesto.

## Variabili d'ambiente della UI

- `OPENCLAW_THEME=light`: forza la palette TUI chiara quando il terminale ha uno sfondo chiaro.
- `OPENCLAW_THEME=dark`: forza la palette TUI scura.
- `COLORFGBG`: se il terminale la esporta, OpenClaw usa l'indizio sul colore di sfondo per scegliere automaticamente la palette TUI.

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

## Riferimenti ai segreti rispetto alle stringhe `${ENV}`

OpenClaw supporta due pattern basati sull'ambiente:

- Sostituzione di stringhe `${VAR}` nei valori di configurazione.
- Oggetti SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) per i campi che supportano i riferimenti ai segreti.

Entrambi vengono risolti dall'ambiente del processo al momento dell'attivazione. I dettagli di SecretRef sono documentati in [Gestione dei segreti](/it/gateway/secrets).

## Variabili d'ambiente relative ai percorsi

| Variabile                | Scopo                                                                                                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Sovrascrive la directory home usata per tutta la risoluzione dei percorsi interni (`~/.openclaw/`, directory degli agenti, sessioni, credenziali). Utile quando si esegue OpenClaw come utente di servizio dedicato.              |
| `OPENCLAW_STATE_DIR`     | Sovrascrive la directory di stato (predefinita `~/.openclaw`).                                                                                                                                                                     |
| `OPENCLAW_CONFIG_PATH`   | Sovrascrive il percorso del file di configurazione (predefinito `~/.openclaw/openclaw.json`).                                                                                                                                      |
| `OPENCLAW_INCLUDE_ROOTS` | Elenco di percorsi di directory in cui le direttive `$include` possono risolvere file fuori dalla directory di configurazione (predefinito: nessuno — `$include` è confinato alla directory di configurazione). Espande la tilde. |

## Logging

| Variabile            | Scopo                                                                                                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Sovrascrive il livello di log sia per file sia per console (ad es. `debug`, `trace`). Ha precedenza su `logging.level` e `logging.consoleLevel` nella configurazione. I valori non validi vengono ignorati con un avviso. |

### `OPENCLAW_HOME`

Quando impostata, `OPENCLAW_HOME` sostituisce la directory home di sistema (`$HOME` / `os.homedir()`) per tutta la risoluzione dei percorsi interni. Questo abilita l'isolamento completo del filesystem per gli account di servizio headless.

**Precedenza:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Esempio** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` può anche essere impostata su un percorso con tilde (ad es. `~/svc`), che viene espanso usando `$HOME` prima dell'uso.

## Utenti nvm: errori TLS di web_fetch

Se Node.js è stato installato tramite **nvm** (non tramite il gestore di pacchetti del sistema), il `fetch()` integrato usa
lo store CA incluso in nvm, che potrebbe non includere CA radice moderne (ISRG Root X1/X2 per Let's Encrypt,
DigiCert Global Root G2, ecc.). Questo fa sì che `web_fetch` fallisca con `"fetch failed"` sulla maggior parte dei siti HTTPS.

Su Linux, OpenClaw rileva automaticamente nvm e applica la correzione nell'ambiente di avvio effettivo:

- `openclaw gateway install` scrive `NODE_EXTRA_CA_CERTS` nell'ambiente del servizio systemd
- l'entrypoint CLI `openclaw` riesegue se stesso con `NODE_EXTRA_CA_CERTS` impostata prima dell'avvio di Node

**Correzione manuale (per versioni precedenti o avvii diretti `node ...`):**

Esporta la variabile prima di avviare OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Non fare affidamento sulla scrittura solo in `~/.openclaw/.env` per questa variabile; Node legge
`NODE_EXTRA_CA_CERTS` all'avvio del processo.

## Variabili d'ambiente legacy

OpenClaw legge solo variabili d'ambiente `OPENCLAW_*`. I prefissi legacy
`CLAWDBOT_*` e `MOLTBOT_*` delle versioni precedenti vengono ignorati silenziosamente.

Se qualcuno è ancora impostato sul processo Gateway all'avvio, OpenClaw emette un
singolo avviso di deprecazione Node (`OPENCLAW_LEGACY_ENV_VARS`) che elenca i
prefissi rilevati e il conteggio totale. Rinomina ogni valore sostituendo il
prefisso legacy con `OPENCLAW_` (per esempio `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); i vecchi nomi non hanno alcun effetto.

## Correlati

- [Configurazione del Gateway](/it/gateway/configuration)
- [FAQ: variabili d'ambiente e caricamento di .env](/it/help/faq#env-vars-and-env-loading)
- [Panoramica dei modelli](/it/concepts/models)
