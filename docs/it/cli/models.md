---
read_when:
    - Vuoi modificare i modelli predefiniti o visualizzare lo stato dell'autenticazione del provider
    - Vuoi esaminare i modelli/provider disponibili ed eseguire il debug dei profili di autenticazione
summary: Riferimento CLI per `openclaw models` (status/list/set/scan, alias, meccanismi di ripiego, autenticazione)
title: Modelli
x-i18n:
    generated_at: "2026-04-30T08:44:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95e2361989b583f7f52947dad1faaaba44dc6a5f58719cc2e83c13fce7c33adc
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Rilevamento, scansione e configurazione dei modelli (modello predefinito, fallback, profili di autenticazione).

Correlati:

- Provider + modelli: [Modelli](/it/providers/models)
- Concetti di selezione dei modelli + comando slash `/models`: [Concetto sui modelli](/it/concepts/models)
- Configurazione dell'autenticazione del provider: [Primi passi](/it/start/getting-started)

## Comandi comuni

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` mostra il valore predefinito/i fallback risolti più una panoramica dell'autenticazione.
Quando sono disponibili snapshot dell'utilizzo dei provider, la sezione di stato OAuth/chiave API include
finestre di utilizzo dei provider e snapshot delle quote.
Provider attuali per le finestre di utilizzo: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi e z.ai. L'autenticazione per l'utilizzo proviene da hook specifici del provider
quando disponibili; altrimenti OpenClaw ripiega sulle credenziali OAuth/chiave API corrispondenti
da profili di autenticazione, env o config.
Nell'output `--json`, `auth.providers` è la panoramica dei provider consapevole di env/config/store,
mentre `auth.oauth` è solo lo stato di salute dei profili dell'auth-store.
Aggiungi `--probe` per eseguire verifiche live di autenticazione su ogni profilo provider configurato.
Le verifiche sono richieste reali (possono consumare token e attivare rate limit).
Usa `--agent <id>` per ispezionare lo stato modello/autenticazione di un agente configurato. Se omesso,
il comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se impostati, altrimenti l'agente
predefinito configurato.
Le righe di verifica possono provenire da profili di autenticazione, credenziali env o `models.json`.

Note:

- `models set <model-or-alias>` accetta `provider/model` o un alias.
- `models list` è di sola lettura: legge config, profili di autenticazione, stato del catalogo esistente
  e righe di catalogo di proprietà del provider, ma non riscrive
  `models.json`.
- La colonna `Auth` è a livello di provider e di sola lettura. È calcolata da metadati dei profili
  di autenticazione locali, marker env, chiavi provider configurate, marker di provider locali,
  marker env/profilo AWS Bedrock e metadati di autenticazione sintetica dei plugin;
  non carica il runtime del provider, non legge segreti dal keychain, non chiama API
  del provider e non dimostra l'esatta prontezza di esecuzione per modello.
- `models list --all --provider <id>` può includere righe di catalogo statiche di proprietà del provider
  da manifest di plugin o metadati di catalogo provider bundled anche quando non ti sei ancora autenticato
  con quel provider. Quelle righe continuano a risultare non disponibili finché non viene configurata
  l'autenticazione corrispondente.
- `models list --all` ampio unisce le righe di catalogo dei manifest sopra le righe del registro
  senza caricare gli hook supplementari del runtime del provider. I fast path dei manifest filtrati per provider usano solo provider marcati `static`; i provider marcati `refreshable`
  restano basati su registro/cache e aggiungono righe di manifest come supplementi, mentre
  i provider marcati `runtime` restano su rilevamento registro/runtime.
- `models list` mantiene distinti i metadati nativi del modello e i cap di runtime. Nell'output tabellare,
  `Ctx` mostra `contextTokens/contextWindow` quando un cap di runtime effettivo
  differisce dalla finestra di contesto nativa; le righe JSON includono `contextTokens`
  quando un provider espone quel cap.
- `models list --provider <id>` filtra per ID provider, come `moonshot` o
  `openai-codex`. Non accetta etichette visualizzate dai selettori provider interattivi,
  come `Moonshot AI`.
- I riferimenti ai modelli vengono analizzati dividendo sulla **prima** `/`. Se l'ID modello include `/` (stile OpenRouter), includi il prefisso del provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw risolve l'input prima come alias, poi
  come corrispondenza univoca di un provider configurato per quell'esatto ID modello, e solo dopo
  ripiega sul provider predefinito configurato con un avviso di deprecazione.
  Se quel provider non espone più il modello predefinito configurato, OpenClaw
  ripiega sul primo provider/modello configurato invece di mostrare un
  valore predefinito obsoleto di un provider rimosso.
- `models status` può mostrare `marker(<value>)` nell'output di autenticazione per placeholder non segreti (ad esempio `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) invece di mascherarli come segreti.

### Scansione dei modelli

`models scan` legge il catalogo pubblico `:free` di OpenRouter e classifica i candidati per
l'uso come fallback. Il catalogo stesso è pubblico, quindi le scansioni solo metadati non richiedono
una chiave OpenRouter.

Per impostazione predefinita OpenClaw prova a verificare il supporto per strumenti e immagini con chiamate live ai modelli.
Se non è configurata alcuna chiave OpenRouter, il comando ripiega sull'output solo metadati
e spiega che i modelli `:free` richiedono comunque `OPENROUTER_API_KEY` per
verifiche e inferenza.

Opzioni:

- `--no-probe` (solo metadati; nessuna ricerca config/segreti)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (timeout della richiesta catalogo e di ogni verifica)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` e `--set-image` richiedono verifiche live; i risultati della scansione
solo metadati sono informativi e non vengono applicati alla config.

### Stato dei modelli

Opzioni:

- `--json`
- `--plain`
- `--check` (exit 1=scaduto/mancante, 2=in scadenza)
- `--probe` (verifica live dei profili di autenticazione configurati)
- `--probe-provider <name>` (verifica un provider)
- `--probe-profile <id>` (ID profilo ripetuti o separati da virgole)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (ID agente configurato; sovrascrive `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` mantiene stdout riservato al payload JSON. Diagnostica dei profili di autenticazione, del provider
e dell'avvio viene instradata su stderr così gli script possono inviare stdout direttamente
a strumenti come `jq`.

Bucket di stato delle verifiche:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casi di dettaglio/codice motivo delle verifiche da aspettarsi:

- `excluded_by_auth_order`: esiste un profilo salvato, ma `auth.order.<provider>` esplicito
  lo ha omesso, quindi la verifica segnala l'esclusione invece di
  provarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  il profilo è presente ma non idoneo/risolvibile.
- `no_model`: esiste autenticazione del provider, ma OpenClaw non è riuscito a risolvere un candidato modello
  verificabile per quel provider.

## Alias + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Profili di autenticazione

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` è l'helper interattivo di autenticazione. Può avviare un flusso di autenticazione del provider
(OAuth/chiave API) o guidarti nell'incollare manualmente un token, a seconda del
provider che scegli.

`models auth login` esegue il flusso di autenticazione di un plugin provider (OAuth/chiave API). Usa
`openclaw plugins list` per vedere quali provider sono installati.
Usa `openclaw models auth --agent <id> <subcommand>` per scrivere i risultati di autenticazione in uno
store specifico di un agente configurato. Il flag padre `--agent` è rispettato da
`add`, `login`, `setup-token`, `paste-token` e `login-github-copilot`.

Esempi:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Note:

- `setup-token` e `paste-token` restano comandi token generici per i provider
  che espongono metodi di autenticazione tramite token.
- `setup-token` richiede una TTY interattiva ed esegue il metodo di autenticazione tramite token del provider
  (usando per impostazione predefinita il metodo `setup-token` di quel provider quando ne espone
  uno).
- `paste-token` accetta una stringa token generata altrove o da automazione.
- `paste-token` richiede `--provider`, richiede il valore del token e lo scrive
  nell'ID profilo predefinito `<provider>:manual` a meno che tu non passi
  `--profile-id`.
- `paste-token --expires-in <duration>` memorizza una scadenza assoluta del token da una
  durata relativa come `365d` o `12h`.
- Nota su Anthropic: lo staff Anthropic ci ha detto che l'uso in stile Claude CLI di OpenClaw è di nuovo consentito, quindi OpenClaw tratta il riuso di Claude CLI e l'uso di `claude -p` come autorizzati per questa integrazione salvo pubblicazione di una nuova policy da parte di Anthropic.
- Anthropic `setup-token` / `paste-token` restano disponibili come percorso token OpenClaw supportato, ma OpenClaw ora preferisce il riuso di Claude CLI e `claude -p` quando disponibili.

## Correlati

- [Riferimento CLI](/it/cli)
- [Selezione dei modelli](/it/concepts/model-providers)
- [Failover dei modelli](/it/concepts/model-failover)
