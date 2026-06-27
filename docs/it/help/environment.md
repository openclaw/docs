---
read_when:
    - Devi sapere quali variabili di ambiente vengono caricate e in quale ordine
    - Stai eseguendo il debug di chiavi API mancanti nel Gateway
    - Stai documentando l’autenticazione del provider o gli ambienti di deployment
summary: Dove OpenClaw carica le variabili di ambiente e l'ordine di precedenza
title: Variabili d'ambiente
x-i18n:
    generated_at: "2026-06-27T17:36:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e36f93efe29f9cc0e9942659c323a635d21fcaa436427dcb21f5694e5d0458b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw carica le variabili d'ambiente da più fonti. La regola è **non sovrascrivere mai i valori esistenti**.
I file `.env` dell'area di lavoro sono una fonte con minore attendibilità: OpenClaw ignora le credenziali dei provider e i controlli runtime protetti dal `.env` dell'area di lavoro prima di applicare la precedenza.

## Precedenza (dalla più alta alla più bassa)

1. **Ambiente del processo** (ciò che il processo Gateway ha già dalla shell/daemon padre).
2. **`.env` nella directory di lavoro corrente** (predefinito dotenv; non sovrascrive; le credenziali dei provider e i controlli runtime protetti vengono ignorati).
3. **`.env` globale** in `~/.openclaw/.env` (ovvero `$OPENCLAW_STATE_DIR/.env`; consigliato per le chiavi API dei provider; non sovrascrive).
4. **Blocco `env` della configurazione** in `~/.openclaw/openclaw.json` (applicato solo se mancante).
5. **Importazione opzionale dalla shell di login** (`env.shellEnv.enabled` o `OPENCLAW_LOAD_SHELL_ENV=1`), applicata solo per le chiavi previste mancanti.

Nelle nuove installazioni su Ubuntu che usano la directory di stato predefinita, OpenClaw tratta anche `~/.config/openclaw/gateway.env` come fallback di compatibilità dopo il `.env` globale. Se entrambi i file esistono e non coincidono, OpenClaw mantiene `~/.openclaw/.env` e stampa un avviso.

Se il file di configurazione manca del tutto, il passaggio 4 viene saltato; l'importazione dalla shell viene comunque eseguita se abilitata.

## Credenziali dei provider e `.env` dell'area di lavoro

Non conservare le chiavi API dei provider solo in un `.env` dell'area di lavoro. OpenClaw ignora le variabili d'ambiente delle credenziali dei provider dai file `.env` dell'area di lavoro, incluse chiavi comuni come `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY` e `FIRECRAWL_API_KEY`.

Usa una di queste fonti attendibili per le credenziali dei provider:

- L'ambiente del processo Gateway, come una shell, un'unità launchd/systemd, un segreto del container o un segreto CI.
- Il file dotenv runtime globale in `~/.openclaw/.env` o `$OPENCLAW_STATE_DIR/.env`.
- Il blocco `env` della configurazione in `~/.openclaw/openclaw.json`.
- L'importazione opzionale dalla shell di login quando `env.shellEnv.enabled` o `OPENCLAW_LOAD_SHELL_ENV=1` è abilitato.

Se in precedenza hai archiviato le chiavi dei provider solo in un `.env` dell'area di lavoro, spostale in una delle fonti attendibili indicate sopra. Il `.env` dell'area di lavoro può ancora fornire normali variabili di progetto che non siano credenziali, reindirizzamenti di endpoint, override host o controlli runtime `OPENCLAW_*`.

Vedi [File `.env` dell'area di lavoro](/it/gateway/security#workspace-env-files) per la motivazione di sicurezza.

## Blocco `env` della configurazione

Due modi equivalenti per impostare variabili d'ambiente inline (entrambi senza sovrascrittura):

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

Il blocco `env` della configurazione accetta solo valori stringa letterali. Non espande
i valori `file:...`; per esempio, `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
viene passato ai provider come quella stringa esatta.

Per chiavi dei provider basate su file, usa una SecretRef sul campo credenziale che
la supporta:

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

Vedi [Gestione dei segreti](/it/gateway/secrets) e la
[superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface) per
i campi supportati.

## Importazione env dalla shell

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

Variabili d'ambiente equivalenti:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Snapshot della shell exec

Sugli host Gateway non Windows, i comandi `exec` di bash e zsh usano per impostazione predefinita uno snapshot di avvio.
Imposta `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` nell'ambiente del processo Gateway per disabilitare questo percorso.
Anche i valori `false`, `no` e `off` lo disabilitano. I valori `exec.env` per singola chiamata non possono attivare o disattivare
gli snapshot né reindirizzare la cache degli snapshot.

## Variabili d'ambiente iniettate dal runtime

OpenClaw inietta anche marker di contesto nei processi figli generati:

- `OPENCLAW_SHELL=exec`: impostato per i comandi eseguiti tramite lo strumento `exec`.
- `OPENCLAW_SHELL=acp`: impostato per gli spawn dei processi backend runtime ACP (per esempio `acpx`).
- `OPENCLAW_SHELL=acp-client`: impostato per `openclaw acp client` quando genera il processo bridge ACP.
- `OPENCLAW_SHELL=tui-local`: impostato per i comandi shell `!` della TUI locale.
- `OPENCLAW_CLI=1`: impostato per i processi figli generati dall'entry point della CLI.

Questi sono marker runtime (non configurazione utente richiesta). Possono essere usati nella logica shell/profilo
per applicare regole specifiche del contesto.

## Variabili d'ambiente UI

- `OPENCLAW_THEME=light`: forza la palette TUI chiara quando il terminale ha uno sfondo chiaro.
- `OPENCLAW_THEME=dark`: forza la palette TUI scura.
- `COLORFGBG`: se il terminale la esporta, OpenClaw usa il suggerimento sul colore di sfondo per scegliere automaticamente la palette TUI.

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

Vedi [Configurazione: sostituzione delle variabili d'ambiente](/it/gateway/configuration-reference#env-var-substitution) per tutti i dettagli.

## Riferimenti ai segreti rispetto a stringhe `${ENV}`

OpenClaw supporta due pattern guidati dall'ambiente:

- Sostituzione di stringhe `${VAR}` nei valori di configurazione.
- Oggetti SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) per i campi che supportano riferimenti ai segreti.

Entrambi vengono risolti dall'ambiente del processo al momento dell'attivazione. I dettagli di SecretRef sono documentati in [Gestione dei segreti](/it/gateway/secrets).
Il blocco `env` della configurazione stesso non risolve SecretRef o valori abbreviati
`file:...`.

## Variabili d'ambiente relative ai percorsi

| Variabile                | Scopo                                                                                                                                                                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Sovrascrive la directory home usata per i percorsi predefiniti interni di OpenClaw (`~/.openclaw/`, directory degli agenti, sessioni, credenziali, onboarding dell'installer e checkout dev predefinito). Utile quando si esegue OpenClaw come utente di servizio dedicato. |
| `OPENCLAW_STATE_DIR`     | Sovrascrive la directory di stato (predefinita `~/.openclaw`).                                                                                                                                                                         |
| `OPENCLAW_CONFIG_PATH`   | Sovrascrive il percorso del file di configurazione (predefinito `~/.openclaw/openclaw.json`).                                                                                                                                          |
| `OPENCLAW_INCLUDE_ROOTS` | Elenco di percorsi di directory in cui le direttive `$include` possono risolvere file al di fuori della directory di configurazione (predefinito: nessuna — `$include` è confinato alla directory di configurazione). Espanso con tilde. |

## Logging

| Variabile                        | Scopo                                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Sovrascrive il livello di log sia per file sia per console (es. `debug`, `trace`). Ha precedenza su `logging.level` e `logging.consoleLevel` nella configurazione. I valori non validi vengono ignorati con un avviso. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Emette diagnostica mirata sui tempi di richiesta/risposta del modello a livello `info` senza abilitare i log di debug globali.                                                                        |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Diagnostica del payload del modello: `summary`, `tools` o `full-redacted`. `full-redacted` è limitato e redatto, ma può includere testo di prompt/messaggi.                                           |
| `OPENCLAW_DEBUG_SSE`             | Diagnostica dello streaming: `events` per il timing first/done, `peek` per includere i primi cinque eventi SSE redatti.                                                                               |
| `OPENCLAW_DEBUG_CODE_MODE`       | Diagnostica della superficie del modello in modalità codice, incluse l'occultazione degli strumenti del provider e l'applicazione solo di exec/wait.                                                   |

### `OPENCLAW_HOME`

Quando impostato, `OPENCLAW_HOME` sostituisce la directory home di sistema (`$HOME` / `os.homedir()`) per i percorsi predefiniti interni di OpenClaw. Ciò include la directory di stato predefinita, il percorso di configurazione, le directory degli agenti, le credenziali, l'area di lavoro di onboarding dell'installer e il checkout dev predefinito usato da `openclaw update --channel dev`.

**Precedenza:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > fallback della home Termux `PREFIX` su Android > `os.homedir()`

**Esempio** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` può anche essere impostato su un percorso con tilde (es. `~/svc`), che viene espanso usando la stessa catena di fallback della home del sistema operativo prima dell'uso.

Le variabili di percorso esplicite come `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` e `OPENCLAW_GIT_DIR` hanno comunque precedenza. Le attività dell'account del sistema operativo, come il rilevamento dei file di avvio della shell, la configurazione del gestore pacchetti e l'espansione di `~` dell'host, possono comunque usare la vera home di sistema.

## Utenti nvm: errori TLS di web_fetch

Se Node.js è stato installato tramite **nvm** (non tramite il gestore pacchetti di sistema), il `fetch()` integrato usa
l'archivio CA incluso in nvm, che potrebbe non contenere CA radice moderne (ISRG Root X1/X2 per Let's Encrypt,
DigiCert Global Root G2, ecc.). Questo fa fallire `web_fetch` con `"fetch failed"` sulla maggior parte dei siti HTTPS.

Su Linux, OpenClaw rileva automaticamente nvm e applica la correzione nell'ambiente di avvio effettivo:

- `openclaw gateway install` scrive `NODE_EXTRA_CA_CERTS` nell'ambiente del servizio systemd
- l'entrypoint CLI `openclaw` riesegue se stesso con `NODE_EXTRA_CA_CERTS` impostato prima dell'avvio di Node

**Correzione manuale (per versioni precedenti o avvii diretti `node ...`):**

Esporta la variabile prima di avviare OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Non fare affidamento sulla sola scrittura in `~/.openclaw/.env` per questa variabile; Node legge
`NODE_EXTRA_CA_CERTS` all'avvio del processo.

## Variabili d'ambiente legacy

OpenClaw legge solo le variabili d'ambiente `OPENCLAW_*`. I prefissi legacy
`CLAWDBOT_*` e `MOLTBOT_*` delle versioni precedenti vengono ignorati
silenziosamente.

Se alcune sono ancora impostate sul processo Gateway all'avvio, OpenClaw emette un
singolo avviso di deprecazione Node (`OPENCLAW_LEGACY_ENV_VARS`) che elenca i
prefissi rilevati e il conteggio totale. Rinomina ogni valore sostituendo il
prefisso legacy con `OPENCLAW_` (per esempio `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); i vecchi nomi non hanno alcun effetto.

## Correlati

- [Configurazione del Gateway](/it/gateway/configuration)
- [FAQ: variabili d'ambiente e caricamento .env](/it/help/faq#env-vars-and-env-loading)
- [Panoramica dei modelli](/it/concepts/models)
