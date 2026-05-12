---
read_when:
    - Vuoi modificare i modelli predefiniti o visualizzare lo stato di autenticazione del provider
    - Vuoi analizzare i modelli/provider disponibili ed eseguire il debug dei profili di autenticazione
summary: Riferimento CLI per `openclaw models` (status/list/set/scan, alias, fallback, autenticazione)
title: Modelli
x-i18n:
    generated_at: "2026-05-12T00:58:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 532bccd19b53517447ad784a1103fa65efe890bf35100bb88161a88aeb3c67b1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Scoperta, scansione e configurazione dei modelli (modello predefinito, fallback, profili di autenticazione).

Correlati:

- Provider + modelli: [Modelli](/it/providers/models)
- Concetti di selezione del modello + comando slash `/models`: [Concetto di modelli](/it/concepts/models)
- Configurazione dell'autenticazione del provider: [Per iniziare](/it/start/getting-started)

## Comandi comuni

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` mostra i fallback/predefiniti risolti più una panoramica dell'autenticazione.
Quando sono disponibili snapshot dell'uso dei provider, la sezione di stato OAuth/chiave API include
finestre di utilizzo del provider e snapshot delle quote.
Provider attuali con finestra di utilizzo: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi e z.ai. L'autenticazione dell'uso proviene dagli hook specifici del provider
quando disponibili; altrimenti OpenClaw ripiega sulle credenziali OAuth/chiave API corrispondenti
da profili di autenticazione, env o configurazione.
Nell'output `--json`, `auth.providers` è la panoramica dei provider consapevole di env/config/store,
mentre `auth.oauth` è solo lo stato di integrità dei profili auth-store.
Aggiungi `--probe` per eseguire probe di autenticazione live su ogni profilo provider configurato.
I probe sono richieste reali (possono consumare token e attivare limiti di frequenza).
Usa `--agent <id>` per ispezionare lo stato modello/autenticazione di un agent configurato. Se omesso,
il comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se impostato, altrimenti l'agent predefinito
configurato.
Le righe dei probe possono provenire da profili di autenticazione, credenziali env o `models.json`.
Per risolvere problemi di OAuth Codex, `openclaw models status`,
`openclaw models auth list --provider openai-codex` e
`openclaw config get agents.defaults.model --json` sono il modo più rapido per
confermare se un agent ha un profilo di autenticazione `openai-codex` utilizzabile per
`openai/*` tramite il runtime nativo Codex. Vedi [Configurazione del provider OpenAI](/it/providers/openai#check-and-recover-codex-oauth-routing).

Note:

- `models set <model-or-alias>` accetta `provider/model` o un alias.
- `models list` è di sola lettura: legge configurazione, profili di autenticazione, stato del catalogo esistente
  e righe del catalogo di proprietà del provider, ma non riscrive
  `models.json`.
- La colonna `Auth` è a livello di provider ed è di sola lettura. È calcolata dai metadati dei profili di autenticazione
  locali, marker env, chiavi provider configurate, marker di provider locali,
  marker env/profilo AWS Bedrock e metadati di autenticazione sintetica dei plugin;
  non carica il runtime del provider, non legge segreti dal portachiavi, non chiama API
  del provider e non dimostra l'esatta prontezza di esecuzione per modello.
- `models list --all --provider <id>` può includere righe di catalogo statico di proprietà del provider
  da manifest dei plugin o metadati del catalogo provider incluso anche quando
  non ti sei ancora autenticato con quel provider. Quelle righe risultano comunque
  non disponibili finché non viene configurata l'autenticazione corrispondente.
- `models list` mantiene il piano di controllo reattivo mentre la scoperta del catalogo provider
  è lenta. Le viste predefinite e configurate ripiegano su righe modello configurate o
  sintetiche dopo una breve attesa e lasciano che la scoperta finisca in
  background. Usa `--all` quando hai bisogno del catalogo completo scoperto esatto e
  sei disposto ad attendere la scoperta del provider.
- `models list --all` ad ampio raggio fonde le righe del catalogo manifest sopra le righe del registro
  senza caricare gli hook supplementari del runtime del provider. I percorsi rapidi del manifest filtrati per provider
  usano solo provider marcati `static`; i provider marcati `refreshable`
  restano basati su registro/cache e aggiungono righe manifest come supplementi, mentre
  i provider marcati `runtime` restano su scoperta registro/runtime.
- `models list` mantiene distinti i metadati nativi del modello e i limiti del runtime. Nell'output tabellare,
  `Ctx` mostra `contextTokens/contextWindow` quando un limite di runtime effettivo
  differisce dalla finestra di contesto nativa; le righe JSON includono `contextTokens`
  quando un provider espone quel limite.
- `models list --provider <id>` filtra per id provider, ad esempio `moonshot` o
  `openai-codex`. Non accetta etichette visualizzate dai selettori provider interattivi,
  come `Moonshot AI`.
- I riferimenti modello vengono analizzati dividendo sulla **prima** `/`. Se l'ID modello include `/` (stile OpenRouter), includi il prefisso del provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw risolve l'input prima come alias, poi
  come corrispondenza univoca di provider configurato per quell'id modello esatto, e solo dopo
  ripiega sul provider predefinito configurato con un avviso di deprecazione.
  Se quel provider non espone più il modello predefinito configurato, OpenClaw
  ripiega sul primo provider/modello configurato invece di mostrare un
  predefinito obsoleto di provider rimosso.
- `models status` può mostrare `marker(<value>)` nell'output di autenticazione per placeholder non segreti (ad esempio `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) invece di mascherarli come segreti.

### Scansione dei modelli

`models scan` legge il catalogo pubblico `:free` di OpenRouter e classifica i candidati per
l'uso come fallback. Il catalogo stesso è pubblico, quindi le scansioni solo metadati non richiedono
una chiave OpenRouter.

Per impostazione predefinita OpenClaw tenta di verificare il supporto per strumenti e immagini con chiamate live al modello.
Se non è configurata alcuna chiave OpenRouter, il comando ripiega sull'output solo metadati
e spiega che i modelli `:free` richiedono comunque `OPENROUTER_API_KEY` per
probe e inferenza.

Opzioni:

- `--no-probe` (solo metadati; nessuna ricerca di config/segreti)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (timeout della richiesta catalogo e per probe)
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
- `--check` (codice di uscita 1=scaduto/mancante, 2=in scadenza)
- `--probe` (probe live dei profili di autenticazione configurati)
- `--probe-provider <name>` (esegue il probe di un provider)
- `--probe-profile <id>` (id profilo ripetuti o separati da virgole)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agent configurato; sovrascrive `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` mantiene stdout riservato al payload JSON. Le diagnostiche di profilo di autenticazione, provider
e avvio vengono indirizzate a stderr così gli script possono convogliare stdout direttamente
in strumenti come `jq`.

Bucket di stato dei probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casi attesi di dettaglio/codice motivo del probe:

- `excluded_by_auth_order`: esiste un profilo salvato, ma
  `auth.order.<provider>` esplicito lo ha omesso, quindi il probe segnala l'esclusione invece di
  provarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  il profilo è presente ma non è idoneo/risolvibile.
- `no_model`: l'autenticazione del provider esiste, ma OpenClaw non è riuscito a risolvere un candidato
  modello verificabile per quel provider.

## Alias + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Profili di autenticazione

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` è l'helper interattivo per l'autenticazione. Può avviare un flusso di autenticazione
del provider (OAuth/chiave API) o guidarti nell'incollare manualmente il token, a seconda del
provider scelto.

`models auth list` elenca i profili di autenticazione salvati per l'agent selezionato senza
stampare token, chiavi API o materiale segreto OAuth. Usa `--provider <id>` per
filtrare su un provider, ad esempio `openai-codex`, e `--json` per gli script.

`models auth login` esegue il flusso di autenticazione di un provider plugin (OAuth/chiave API). Usa
`openclaw plugins list` per vedere quali provider sono installati.
Usa `openclaw models auth --agent <id> <subcommand>` per scrivere i risultati di autenticazione in un
archivio agent configurato specifico. Il flag padre `--agent` è rispettato da
`add`, `list`, `login`, `setup-token`, `paste-token` e
`login-github-copilot`.

Per i modelli OpenAI, `--provider openai` usa per impostazione predefinita il login account ChatGPT/Codex.
Usa `--method api-key` solo quando vuoi aggiungere un profilo chiave API OpenAI,
di solito come backup per i limiti dell'abbonamento Codex. La forma legacy
`--provider openai-codex` continua a funzionare per gli script esistenti.

Esempi:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth list --provider openai
```

Note:

- `setup-token` e `paste-token` restano comandi token generici per i provider
  che espongono metodi di autenticazione tramite token.
- `setup-token` richiede una TTY interattiva ed esegue il metodo di autenticazione tramite token
  del provider (predefinito al metodo `setup-token` di quel provider quando ne espone
  uno).
- `paste-token` accetta una stringa token generata altrove o dall'automazione.
- `paste-token` richiede `--provider`, chiede il valore del token e lo scrive
  nell'id profilo predefinito `<provider>:manual` a meno che tu non passi
  `--profile-id`.
- `paste-token --expires-in <duration>` archivia una scadenza assoluta del token da una
  durata relativa come `365d` o `12h`.
- Nota Anthropic: lo staff Anthropic ci ha detto che l'uso in stile OpenClaw della Claude CLI è di nuovo consentito, quindi OpenClaw considera il riuso della Claude CLI e l'uso di `claude -p` autorizzati per questa integrazione a meno che Anthropic non pubblichi una nuova policy.
- `setup-token` / `paste-token` di Anthropic restano disponibili come percorso token OpenClaw supportato, ma OpenClaw ora preferisce il riuso della Claude CLI e `claude -p` quando disponibili.

## Correlati

- [Riferimento CLI](/it/cli)
- [Selezione del modello](/it/concepts/model-providers)
- [Failover del modello](/it/concepts/model-failover)
