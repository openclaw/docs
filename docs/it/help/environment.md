---
read_when:
    - Devi sapere quali variabili d'ambiente vengono caricate e in quale ordine
    - Stai eseguendo il debug di chiavi API mancanti nel Gateway
    - Stai documentando l'autenticazione dei fornitori o gli ambienti di distribuzione
summary: Dove OpenClaw carica le variabili di ambiente e l'ordine di precedenza
title: Variabili d'ambiente
x-i18n:
    generated_at: "2026-05-11T20:30:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b91e9bb3c386292f11a3ffe5ae718a74a800bd19fe95073da990d881e6069d
    source_path: help/environment.md
    workflow: 16
---

OpenClaw legge le variabili d'ambiente da più fonti. La regola è **non sovrascrivere mai i valori esistenti**.

## Precedenza (dalla più alta alla più bassa)

1. **Ambiente del processo** (ciò che il processo Gateway ha già dalla shell o dal daemon padre).
2. **`.env` nella directory di lavoro corrente** (valore predefinito di dotenv; non sovrascrive).
3. **`.env` globale** in `~/.openclaw/.env` (ovvero `$OPENCLAW_STATE_DIR/.env`; non sovrascrive).
4. **Blocco `env` della configurazione** in `~/.openclaw/openclaw.json` (applicato solo se mancante).
5. **Importazione login-shell opzionale** (`env.shellEnv.enabled` o `OPENCLAW_LOAD_SHELL_ENV=1`), applicata solo per le chiavi previste mancanti.

Nelle nuove installazioni Ubuntu che usano la directory di stato predefinita, OpenClaw tratta anche `~/.config/openclaw/gateway.env` come fallback di compatibilità dopo il `.env` globale. Se entrambi i file esistono e sono in conflitto, OpenClaw mantiene `~/.openclaw/.env` e stampa un avviso.

Se il file di configurazione manca del tutto, il passaggio 4 viene saltato; l'importazione shell viene comunque eseguita se abilitata.

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

## Importazione env shell

`env.shellEnv` esegue la tua shell di login e importa solo le chiavi previste **mancanti**:

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

OpenClaw inietta anche marcatori di contesto nei processi figlio avviati:

- `OPENCLAW_SHELL=exec`: impostata per i comandi eseguiti tramite lo strumento `exec`.
- `OPENCLAW_SHELL=acp`: impostata per gli avvii di processi backend runtime ACP (ad esempio `acpx`).
- `OPENCLAW_SHELL=acp-client`: impostata per `openclaw acp client` quando avvia il processo bridge ACP.
- `OPENCLAW_SHELL=tui-local`: impostata per i comandi shell `!` della TUI locale.

Questi sono marcatori runtime (non configurazione utente richiesta). Possono essere usati nella logica shell/profile
per applicare regole specifiche del contesto.

## Variabili d'ambiente dell'interfaccia utente

- `OPENCLAW_THEME=light`: forza la palette TUI chiara quando il terminale ha uno sfondo chiaro.
- `OPENCLAW_THEME=dark`: forza la palette TUI scura.
- `COLORFGBG`: se il terminale la esporta, OpenClaw usa l'indizio sul colore di sfondo per scegliere automaticamente la palette TUI.

## Sostituzione di variabili d'ambiente nella configurazione

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

Vedi [Configurazione: sostituzione di variabili d'ambiente](/it/gateway/configuration-reference#env-var-substitution) per i dettagli completi.

## Riferimenti ai segreti rispetto alle stringhe `${ENV}`

OpenClaw supporta due pattern basati sull'ambiente:

- Sostituzione di stringhe `${VAR}` nei valori della configurazione.
- Oggetti SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) per i campi che supportano i riferimenti ai segreti.

Entrambi vengono risolti dall'ambiente del processo al momento dell'attivazione. I dettagli di SecretRef sono documentati in [Gestione dei segreti](/it/gateway/secrets).

## Variabili d'ambiente relative ai percorsi

| Variabile                | Scopo                                                                                                                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Sovrascrive la directory home usata per tutta la risoluzione dei percorsi interni (`~/.openclaw/`, directory agenti, sessioni, credenziali). Utile quando OpenClaw viene eseguito come utente di servizio dedicato. |
| `OPENCLAW_STATE_DIR`     | Sovrascrive la directory di stato (predefinita `~/.openclaw`).                                                                                                                                 |
| `OPENCLAW_CONFIG_PATH`   | Sovrascrive il percorso del file di configurazione (predefinito `~/.openclaw/openclaw.json`).                                                                                                  |
| `OPENCLAW_INCLUDE_ROOTS` | Elenco di percorsi di directory in cui le direttive `$include` possono risolvere file fuori dalla directory di configurazione (predefinito: nessuno: `$include` è confinato alla directory di configurazione). Con espansione della tilde. |

## Logging

| Variabile                        | Scopo                                                                                                                                                                                                     |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Sovrascrive il livello di log sia per file sia per console (ad esempio `debug`, `trace`). Ha precedenza su `logging.level` e `logging.consoleLevel` nella configurazione. I valori non validi vengono ignorati con un avviso. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Emette diagnostica mirata sui tempi di richiesta/risposta del modello a livello `info` senza abilitare i log di debug globali.                                                                             |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnostica del payload del modello: `summary`, `tools` o `full-redacted`. `full-redacted` è limitato e redatto, ma può includere testo di prompt/messaggi.                                               |
| `OPENCLAW_DEBUG_SSE`             | Diagnostica dello streaming: `events` per i tempi di primo/completato, `peek` per includere i primi cinque eventi SSE redatti.                                                                             |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnostica della superficie modello in modalità codice, inclusi l'occultamento degli strumenti del provider e l'applicazione di solo exec/wait.                                                          |

### `OPENCLAW_HOME`

Quando è impostata, `OPENCLAW_HOME` sostituisce la directory home di sistema (`$HOME` / `os.homedir()`) per tutta la risoluzione dei percorsi interni. Questo abilita l'isolamento completo del filesystem per account di servizio headless.

**Precedenza:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Esempio** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` può anche essere impostata su un percorso con tilde (ad esempio `~/svc`), che viene espanso usando `$HOME` prima dell'uso.

## utenti nvm: errori TLS di web_fetch

Se Node.js è stato installato tramite **nvm** (non tramite il gestore di pacchetti di sistema), il `fetch()` integrato usa
l'archivio CA fornito con nvm, che potrebbe non includere CA radice moderne (ISRG Root X1/X2 per Let's Encrypt,
DigiCert Global Root G2, ecc.). Questo causa il fallimento di `web_fetch` con `"fetch failed"` sulla maggior parte dei siti HTTPS.

Su Linux, OpenClaw rileva automaticamente nvm e applica la correzione nell'ambiente di avvio effettivo:

- `openclaw gateway install` scrive `NODE_EXTRA_CA_CERTS` nell'ambiente del servizio systemd
- l'entrypoint CLI `openclaw` riesegue se stesso con `NODE_EXTRA_CA_CERTS` impostata prima dell'avvio di Node

**Correzione manuale (per versioni precedenti o avvii diretti `node ...`):**

Esporta la variabile prima di avviare OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Non fare affidamento sulla sola scrittura di questa variabile in `~/.openclaw/.env`; Node legge
`NODE_EXTRA_CA_CERTS` all'avvio del processo.

## Variabili d'ambiente legacy

OpenClaw legge solo le variabili d'ambiente `OPENCLAW_*`. I prefissi legacy
`CLAWDBOT_*` e `MOLTBOT_*` delle versioni precedenti vengono ignorati silenziosamente.

Se qualcuno di questi è ancora impostato sul processo Gateway all'avvio, OpenClaw emette un
singolo avviso di deprecazione Node (`OPENCLAW_LEGACY_ENV_VARS`) che elenca i
prefissi rilevati e il conteggio totale. Rinomina ogni valore sostituendo il
prefisso legacy con `OPENCLAW_` (ad esempio `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); i vecchi nomi non hanno alcun effetto.

## Correlati

- [Configurazione del Gateway](/it/gateway/configuration)
- [FAQ: variabili d'ambiente e caricamento .env](/it/help/faq#env-vars-and-env-loading)
- [Panoramica dei modelli](/it/concepts/models)
