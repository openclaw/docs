---
read_when:
    - Devi sapere quali variabili d'ambiente vengono caricate e in quale ordine
    - Stai eseguendo il debug delle chiavi API mancanti nel Gateway
    - Stai documentando l'autenticazione dei provider o gli ambienti di distribuzione
summary: Da dove OpenClaw carica le variabili d'ambiente e il relativo ordine di precedenza
title: Variabili di ambiente
x-i18n:
    generated_at: "2026-07-12T07:07:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0010465008969ea1ebf7bb79d01ee86b7be20f7b6d0d90da72d8b0a3b1ed273
    source_path: help/environment.md
    workflow: 16
---

OpenClaw acquisisce le variabili d'ambiente da più fonti. La regola è **non sovrascrivere mai i valori esistenti**.
I file `.env` dell'area di lavoro sono una fonte meno attendibile: OpenClaw ignora le credenziali dei provider e i controlli di runtime protetti presenti nel file `.env` dell'area di lavoro prima di applicare l'ordine di precedenza.

## Precedenza (dalla più alta alla più bassa)

1. **Ambiente del processo** (ciò che il processo Gateway ha già ricevuto dalla shell o dal daemon padre).
2. **`.env` nella directory di lavoro corrente** (impostazione predefinita di dotenv; non sovrascrive; le credenziali dei provider e i controlli di runtime protetti vengono ignorati).
3. **`.env` globale** in `~/.openclaw/.env` (ovvero `$OPENCLAW_STATE_DIR/.env`; consigliato per le chiavi API dei provider; non sovrascrive).
4. **Blocco di configurazione `env`** in `~/.openclaw/openclaw.json` (applicato solo se il valore manca).
5. **Importazione facoltativa dalla shell di login** (`env.shellEnv.enabled` o `OPENCLAW_LOAD_SHELL_ENV=1`), applicata solo alle chiavi previste mancanti.

Nelle nuove installazioni di Ubuntu che usano la directory di stato predefinita, OpenClaw considera anche `~/.config/openclaw/gateway.env` come ripiego di compatibilità dopo il file `.env` globale. Se entrambi i file esistono e contengono valori discordanti, OpenClaw mantiene `~/.openclaw/.env` e mostra un avviso.

Se il file di configurazione manca completamente, il passaggio 4 viene ignorato; l'importazione dalla shell viene comunque eseguita se abilitata.

## Credenziali dei provider e `.env` dell'area di lavoro

Non conservare le chiavi API dei provider esclusivamente in un file `.env` dell'area di lavoro. OpenClaw blocca nei file `.env` dell'area di lavoro un ampio insieme di chiavi relative alle credenziali dei provider e al reindirizzamento degli endpoint, incluse tutte le variabili d'ambiente di autenticazione note dei provider (ad esempio `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`), oltre a qualsiasi chiave che termina con `_API_HOST`, `_BASE_URL` o `_HOMESERVER` e agli interi spazi dei nomi `OPENCLAW_*`, `CLAWHUB_*`, `ANTHROPIC_API_KEY_*` e `OPENAI_API_KEY_*`.

Usa invece una delle seguenti fonti attendibili per le credenziali dei provider:

- L'ambiente del processo Gateway, ad esempio una shell, un'unità launchd/systemd, un segreto del contenitore o un segreto CI.
- Il file dotenv globale del runtime in `~/.openclaw/.env` o `$OPENCLAW_STATE_DIR/.env`.
- Il blocco di configurazione `env` in `~/.openclaw/openclaw.json`.
- L'importazione facoltativa dalla shell di login quando `env.shellEnv.enabled` o `OPENCLAW_LOAD_SHELL_ENV=1` è abilitato.

Se in precedenza conservavi le chiavi dei provider esclusivamente in un file `.env` dell'area di lavoro, spostale in una delle fonti attendibili indicate sopra. Il file `.env` dell'area di lavoro può continuare a fornire normali variabili di progetto che non siano credenziali, reindirizzamenti degli endpoint, sostituzioni degli host o controlli di runtime `OPENCLAW_*`.

Per le motivazioni di sicurezza, consulta [File `.env` dell'area di lavoro](/it/gateway/security#workspace-env-files).

## Blocco di configurazione `env`

Esistono due modi equivalenti per impostare variabili d'ambiente inline (entrambi senza sovrascrittura):

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

Il blocco di configurazione `env` accetta esclusivamente valori stringa letterali. Non espande i valori
`file:...`; ad esempio, `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
viene passato ai provider esattamente come tale stringa.

Per le chiavi dei provider basate su file, usa un SecretRef nel campo delle credenziali che
lo supporta:

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

Consulta [Gestione dei segreti](/it/gateway/secrets) e la
[superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface) per conoscere
i campi supportati.

## Importazione dell'ambiente dalla shell

`env.shellEnv` esegue la shell di login e importa esclusivamente le chiavi previste **mancanti**:

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

Variabili d'ambiente equivalenti:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000` (valore predefinito `15000`)

## Snapshot della shell di esecuzione

Negli host Gateway diversi da Windows, i comandi `exec` di bash e zsh usano per impostazione predefinita uno snapshot di avvio.
Imposta `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` nell'ambiente del processo Gateway per disabilitare questo percorso.
Anche i valori `false`, `no` e `off` lo disabilitano. I valori `exec.env` delle singole chiamate non possono attivare o disattivare
gli snapshot né reindirizzare la relativa cache.

## Variabili d'ambiente inserite dal runtime

OpenClaw inserisce inoltre indicatori di contesto nei processi figli avviati:

- `OPENCLAW_SHELL=exec`: impostata per i comandi eseguiti tramite lo strumento `exec`.
- `OPENCLAW_SHELL=acp-client`: impostata per `openclaw acp client` quando avvia il processo bridge ACP.
- `OPENCLAW_SHELL=tui-local`: impostata per i comandi shell `!` della TUI locale.
- `OPENCLAW_CLI=1`: impostata per i processi figli avviati dal punto di ingresso della CLI.

Questi sono indicatori del runtime (non configurazioni utente obbligatorie). Possono essere usati nella logica della shell o del profilo
per applicare regole specifiche per il contesto.

## Variabili d'ambiente dell'interfaccia utente

- `OPENCLAW_THEME=light`: forza la tavolozza chiara della TUI quando il terminale ha uno sfondo chiaro.
- `OPENCLAW_THEME=dark`: forza la tavolozza scura della TUI.
- `COLORFGBG`: se il terminale la esporta, OpenClaw usa l'indicazione del colore di sfondo per scegliere automaticamente la tavolozza della TUI.

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

Per informazioni complete, consulta [Configurazione: sostituzione delle variabili d'ambiente](/it/gateway/configuration-reference#env-var-substitution).

## Riferimenti ai segreti e stringhe `${ENV}`

OpenClaw supporta due modelli basati sulle variabili d'ambiente:

- Sostituzione delle stringhe `${VAR}` nei valori di configurazione.
- Oggetti SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) per i campi che supportano i riferimenti ai segreti.

Entrambi vengono risolti dall'ambiente del processo al momento dell'attivazione. I dettagli su SecretRef sono documentati in [Gestione dei segreti](/it/gateway/secrets).
Il blocco di configurazione `env` non risolve autonomamente i SecretRef né
i valori abbreviati `file:...`.

## Variabili d'ambiente relative ai percorsi

| Variabile                | Scopo                                                                                                                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Sostituisce la directory home usata per i percorsi interni predefiniti di OpenClaw (`~/.openclaw/`, directory degli agenti, sessioni, credenziali, configurazione iniziale del programma di installazione e checkout di sviluppo predefinito). Utile quando OpenClaw viene eseguito con un utente di servizio dedicato. |
| `OPENCLAW_STATE_DIR`     | Sostituisce la directory di stato (valore predefinito `~/.openclaw`).                                                                                                                                                                                       |
| `OPENCLAW_CONFIG_PATH`   | Sostituisce il percorso del file di configurazione (valore predefinito `~/.openclaw/openclaw.json`).                                                                                                                                                        |
| `OPENCLAW_INCLUDE_ROOTS` | Elenco di percorsi delle directory in cui le direttive `$include` possono risolvere file esterni alla directory di configurazione (valore predefinito: nessuno; `$include` è limitato alla directory di configurazione). La tilde viene espansa.               |

## Registrazione

| Variabile                        | Scopo                                                                                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Sostituisce il livello di registrazione sia per il file sia per la console (ad esempio `debug`, `trace`). Ha la precedenza su `logging.level` e `logging.consoleLevel` nella configurazione. I valori non validi vengono ignorati con un avviso.        |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Emette diagnostica mirata sui tempi delle richieste e delle risposte del modello al livello `info` senza abilitare i registri di debug globali.                                                                                                       |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnostica del payload del modello: `summary`, `tools` o `full-redacted`. `full-redacted` è soggetto a un limite e oscurato, ma può includere il testo dei prompt o dei messaggi.                                                                    |
| `OPENCLAW_DEBUG_SSE`             | Diagnostica dello streaming: `events` per i tempi del primo evento e del completamento, `peek` per includere i primi cinque eventi SSE oscurati.                                                                                                      |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnostica della superficie del modello in modalità codice, inclusi l'occultamento degli strumenti del provider e l'applicazione diretta e compatta dei controlli.                                                                                  |

### `OPENCLAW_HOME`

Quando impostata, `OPENCLAW_HOME` sostituisce la directory home di sistema (`$HOME` / `os.homedir()`) per i percorsi interni predefiniti di OpenClaw. Sono inclusi la directory di stato predefinita, il percorso della configurazione, le directory degli agenti, le credenziali, l'area di lavoro per la configurazione iniziale del programma di installazione e il checkout di sviluppo predefinito usato da `openclaw update --channel dev`.

**Precedenza:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > directory home alternativa di Termux tramite `PREFIX` su Android > `os.homedir()`

**Esempio** (LaunchDaemon di macOS):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` può anche essere impostata su un percorso con tilde (ad esempio `~/svc`), che viene espansa prima dell'uso tramite la stessa catena di directory home alternative del sistema operativo.

Le variabili di percorso esplicite come `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` e `OPENCLAW_GIT_DIR` continuano ad avere la precedenza. Le attività relative all'account del sistema operativo, come il rilevamento dei file di avvio della shell, la configurazione del gestore di pacchetti e l'espansione di `~` sull'host, possono continuare a usare la directory home reale del sistema.

## Utenti nvm: errori TLS di web_fetch

Se Node.js è stato installato tramite **nvm** (e non tramite il gestore di pacchetti di sistema), la funzione `fetch()` integrata usa
l'archivio di CA incluso in nvm, nel quale potrebbero mancare CA radice moderne (ISRG Root X1/X2 per Let's Encrypt,
DigiCert Global Root G2 e così via). Di conseguenza, `web_fetch` restituisce l'errore `"fetch failed"` sulla maggior parte dei siti HTTPS.

Su Linux, OpenClaw rileva automaticamente nvm e applica la correzione nell'ambiente di avvio effettivo:

- `openclaw gateway install` scrive `NODE_EXTRA_CA_CERTS` nell'ambiente del servizio systemd
- il punto di ingresso della CLI `openclaw` si riesegue con `NODE_EXTRA_CA_CERTS` impostata prima dell'avvio di Node

**Correzione manuale (per versioni precedenti o avvii diretti con `node ...`):**

Esporta la variabile prima di avviare OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Non fare affidamento sulla sola scrittura di questa variabile in `~/.openclaw/.env`; Node legge
`NODE_EXTRA_CA_CERTS` all'avvio del processo.

## Variabili d'ambiente obsolete

OpenClaw legge esclusivamente le variabili d'ambiente `OPENCLAW_*`. I prefissi obsoleti
`CLAWDBOT_*` e `MOLTBOT_*` delle versioni precedenti vengono ignorati
senza alcuna segnalazione.

Se una di queste variabili è ancora impostata nel processo Gateway all'avvio, OpenClaw emette un
unico avviso di deprecazione di Node (`OPENCLAW_LEGACY_ENV_VARS`) che elenca i
prefissi rilevati e il numero totale. Rinomina ciascun valore sostituendo il
prefisso obsoleto con `OPENCLAW_` (ad esempio da `CLAWDBOT_GATEWAY_TOKEN` a
`OPENCLAW_GATEWAY_TOKEN`); i vecchi nomi non hanno alcun effetto.

## Contenuti correlati

- [Configurazione del Gateway](/it/gateway/configuration)
- [Domande frequenti: variabili d'ambiente e caricamento dei file .env](/it/help/faq#env-vars-and-env-loading)
- [Panoramica dei modelli](/it/concepts/models)
