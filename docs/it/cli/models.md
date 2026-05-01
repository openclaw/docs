---
read_when:
    - Vuoi modificare i modelli predefiniti o visualizzare lo stato dell'autenticazione del provider
    - Vuoi esaminare i modelli/fornitori disponibili e diagnosticare i profili di autenticazione.
summary: Riferimento CLI per `openclaw models` (status/list/set/scan, alias, meccanismi di ripiego, autenticazione)
title: Modelli
x-i18n:
    generated_at: "2026-05-01T08:28:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 538d3e4808329737fdc044dc6e14e5c7c78052e75d8a8b3b257b1ebd821c84d1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Individuazione, scansione e configurazione dei modelli (modello predefinito, fallback, profili di autenticazione).

Correlato:

- Provider + modelli: [Modelli](/it/providers/models)
- Concetti di selezione del modello + comando slash `/models`: [Concetto dei modelli](/it/concepts/models)
- Configurazione dell’autenticazione del provider: [Primi passi](/it/start/getting-started)

## Comandi comuni

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` mostra il valore risolto per predefinito/fallback più una panoramica dell’autenticazione.
Quando sono disponibili snapshot dell’utilizzo del provider, la sezione di stato OAuth/chiave API include
finestre di utilizzo del provider e snapshot delle quote.
Provider attuali con finestre di utilizzo: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi e z.ai. L’autenticazione per l’utilizzo proviene da hook specifici del provider
quando disponibili; altrimenti OpenClaw ripiega sulle credenziali OAuth/chiave API corrispondenti
da profili di autenticazione, env o configurazione.
Nell’output `--json`, `auth.providers` è la panoramica dei provider consapevole di env/config/store,
mentre `auth.oauth` è solo lo stato di salute dei profili dello store di autenticazione.
Aggiungi `--probe` per eseguire probe di autenticazione live su ciascun profilo provider configurato.
I probe sono richieste reali (possono consumare token e attivare rate limit).
Usa `--agent <id>` per ispezionare lo stato modello/autenticazione di un agente configurato. Se omesso,
il comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se impostato, altrimenti l’agente
predefinito configurato.
Le righe dei probe possono provenire da profili di autenticazione, credenziali env o `models.json`.

Note:

- `models set <model-or-alias>` accetta `provider/model` o un alias.
- `models list` è in sola lettura: legge configurazione, profili di autenticazione, stato del catalogo esistente
  e righe di catalogo possedute dal provider, ma non riscrive
  `models.json`.
- La colonna `Auth` è a livello di provider e in sola lettura. È calcolata da metadati locali
  dei profili di autenticazione, marcatori env, chiavi provider configurate, marcatori di provider locali,
  marcatori env/profilo AWS Bedrock e metadati di autenticazione sintetica dei plugin;
  non carica il runtime del provider, non legge segreti dal keychain, non chiama API
  del provider e non dimostra l’esatta prontezza di esecuzione per modello.
- `models list --all --provider <id>` può includere righe di catalogo statiche possedute dal provider
  da manifest di Plugin o metadati di catalogo provider inclusi anche quando
  non ti sei ancora autenticato con quel provider. Quelle righe continuano a comparire come
  non disponibili finché non viene configurata l’autenticazione corrispondente.
- `models list` mantiene reattivo il piano di controllo mentre la scoperta del catalogo provider
  è lenta. Le viste predefinita e configurata ripiegano su righe modello configurate o
  sintetiche dopo una breve attesa e lasciano completare la scoperta in
  background. Usa `--all` quando ti serve il catalogo scoperto completo esatto e
  sei disposto ad attendere la scoperta del provider.
- Un ampio `models list --all` unisce le righe di catalogo del manifest sopra le righe del registro
  senza caricare hook supplementari del runtime del provider. I percorsi rapidi del manifest filtrati per provider
  usano solo provider marcati `static`; i provider marcati `refreshable`
  restano basati su registro/cache e aggiungono righe del manifest come supplementi, mentre
  i provider marcati `runtime` restano su scoperta registro/runtime.
- `models list` mantiene distinti i metadati nativi del modello e i limiti del runtime. Nell’output tabellare,
  `Ctx` mostra `contextTokens/contextWindow` quando un limite effettivo del runtime
  differisce dalla finestra di contesto nativa; le righe JSON includono `contextTokens`
  quando un provider espone quel limite.
- `models list --provider <id>` filtra per id provider, come `moonshot` o
  `openai-codex`. Non accetta etichette visualizzate dai selettori interattivi dei provider,
  come `Moonshot AI`.
- I riferimenti ai modelli vengono analizzati dividendo sulla **prima** `/`. Se l’ID del modello include `/` (stile OpenRouter), includi il prefisso del provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw risolve prima l’input come alias, poi
  come corrispondenza univoca di provider configurato per quell’esatto id modello, e solo dopo
  ripiega sul provider predefinito configurato con un avviso di deprecazione.
  Se quel provider non espone più il modello predefinito configurato, OpenClaw
  ripiega sul primo provider/modello configurato invece di mostrare un
  predefinito di provider rimosso obsoleto.
- `models status` può mostrare `marker(<value>)` nell’output di autenticazione per segnaposto non segreti (per esempio `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) invece di mascherarli come segreti.

### Scansione dei modelli

`models scan` legge il catalogo pubblico `:free` di OpenRouter e classifica i candidati per
l’uso come fallback. Il catalogo stesso è pubblico, quindi le scansioni solo metadati non richiedono
una chiave OpenRouter.

Per impostazione predefinita OpenClaw prova a verificare il supporto per strumenti e immagini con chiamate live ai modelli.
Se non è configurata alcuna chiave OpenRouter, il comando ripiega sull’output solo metadati
e spiega che i modelli `:free` richiedono comunque `OPENROUTER_API_KEY` per
probe e inferenza.

Opzioni:

- `--no-probe` (solo metadati; nessuna ricerca di config/segreti)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (richiesta al catalogo e timeout per probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` e `--set-image` richiedono probe live; i risultati della scansione
solo metadati sono informativi e non vengono applicati alla configurazione.

### Stato dei modelli

Opzioni:

- `--json`
- `--plain`
- `--check` (uscita 1=scaduto/mancante, 2=in scadenza)
- `--probe` (probe live dei profili di autenticazione configurati)
- `--probe-provider <name>` (probe di un provider)
- `--probe-profile <id>` (id profilo ripetuti o separati da virgole)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agente configurato; sovrascrive `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` mantiene stdout riservato al payload JSON. I diagnostici di profili di autenticazione, provider
e avvio vengono indirizzati a stderr così gli script possono inoltrare stdout direttamente
a strumenti come `jq`.

Categorie di stato dei probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casi di dettaglio/codice motivo dei probe da aspettarsi:

- `excluded_by_auth_order`: esiste un profilo memorizzato, ma l’esplicito
  `auth.order.<provider>` lo ha omesso, quindi il probe segnala l’esclusione invece di
  provarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  il profilo è presente ma non è idoneo/risolvibile.
- `no_model`: l’autenticazione del provider esiste, ma OpenClaw non è riuscito a risolvere un
  modello candidato verificabile per quel provider.

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

`models auth add` è l’helper interattivo di autenticazione. Può avviare un flusso di autenticazione del provider
(OAuth/chiave API) o guidarti nell’incollare manualmente un token, a seconda del
provider scelto.

`models auth login` esegue il flusso di autenticazione di un Plugin provider (OAuth/chiave API). Usa
`openclaw plugins list` per vedere quali provider sono installati.
Usa `openclaw models auth --agent <id> <subcommand>` per scrivere i risultati dell’autenticazione in uno
store agente configurato specifico. Il flag padre `--agent` è rispettato da
`add`, `login`, `setup-token`, `paste-token` e `login-github-copilot`.

Esempi:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Note:

- `setup-token` e `paste-token` restano comandi token generici per i provider
  che espongono metodi di autenticazione tramite token.
- `setup-token` richiede un TTY interattivo ed esegue il metodo di autenticazione tramite token
  del provider (usando per impostazione predefinita il metodo `setup-token` di quel provider quando ne espone
  uno).
- `paste-token` accetta una stringa token generata altrove o da automazione.
- `paste-token` richiede `--provider`, chiede il valore del token e lo scrive
  nell’id profilo predefinito `<provider>:manual` a meno che tu non passi
  `--profile-id`.
- `paste-token --expires-in <duration>` memorizza una scadenza assoluta del token da una
  durata relativa come `365d` o `12h`.
- Nota Anthropic: lo staff di Anthropic ci ha detto che l’uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi OpenClaw tratta il riuso di Claude CLI e l’uso di `claude -p` come autorizzati per questa integrazione, a meno che Anthropic non pubblichi una nuova policy.
- Anthropic `setup-token` / `paste-token` restano disponibili come percorso token OpenClaw supportato, ma OpenClaw ora preferisce il riuso di Claude CLI e `claude -p` quando disponibili.

## Correlato

- [Riferimento CLI](/it/cli)
- [Selezione del modello](/it/concepts/model-providers)
- [Failover dei modelli](/it/concepts/model-failover)
