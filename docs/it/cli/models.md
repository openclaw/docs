---
read_when:
    - Vuoi modificare i modelli predefiniti o visualizzare lo stato dell'autenticazione del provider
    - Vuoi esaminare i modelli/provider disponibili ed eseguire il debug dei profili di autenticazione
summary: Riferimento CLI per `openclaw models` (status/list/set/scan, alias, ripieghi, autenticazione)
title: Modelli
x-i18n:
    generated_at: "2026-05-06T19:35:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7749d97382529587d54ea96466edc880a731f2c2d39eed1677e4fbf129f11435
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Individuazione, scansione e configurazione dei modelli (modello predefinito, alternative di riserva, profili di autenticazione).

Correlato:

- Provider + modelli: [Modelli](/it/providers/models)
- Concetti di selezione dei modelli + comando slash `/models`: [Concetto sui modelli](/it/concepts/models)
- Configurazione autenticazione provider: [Introduzione](/it/start/getting-started)

## Comandi comuni

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` mostra il valore predefinito/le alternative di riserva risolti, più una panoramica dell'autenticazione.
Quando sono disponibili snapshot dell'utilizzo dei provider, la sezione di stato OAuth/chiave API include
finestre di utilizzo dei provider e snapshot delle quote.
Provider attuali con finestre di utilizzo: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi e z.ai. L'autenticazione dell'utilizzo proviene da hook specifici del provider
quando disponibili; altrimenti OpenClaw ripiega sulle credenziali OAuth/chiave API corrispondenti
da profili di autenticazione, env o configurazione.
Nell'output `--json`, `auth.providers` è la panoramica dei provider consapevole di env/config/store,
mentre `auth.oauth` riguarda solo l'integrità dei profili dell'archivio di autenticazione.
Aggiungi `--probe` per eseguire verifiche di autenticazione live su ciascun profilo provider configurato.
Le verifiche sono richieste reali (possono consumare token e attivare limiti di frequenza).
Usa `--agent <id>` per ispezionare lo stato modello/autenticazione di un agente configurato. Se omesso,
il comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se impostato, altrimenti l'agente predefinito
configurato.
Le righe di verifica possono provenire da profili di autenticazione, credenziali env o `models.json`.
Per la risoluzione dei problemi di Codex OAuth, `openclaw models status`,
`openclaw models auth list --provider openai-codex` e
`openclaw config get agents.defaults.model --json` sono il modo più rapido per
confermare se un agente sta usando `openai-codex/*` tramite PI oppure `openai/*`
tramite il runtime nativo Codex. Vedi [Configurazione del provider OpenAI](/it/providers/openai#check-and-recover-codex-oauth-routing).

Note:

- `models set <model-or-alias>` accetta `provider/model` o un alias.
- `models list` è in sola lettura: legge configurazione, profili di autenticazione, stato del catalogo esistente
  e righe di catalogo di proprietà dei provider, ma non riscrive
  `models.json`.
- La colonna `Auth` è a livello di provider e in sola lettura. È calcolata da metadati locali
  dei profili di autenticazione, marcatori env, chiavi provider configurate, marcatori di provider locali,
  marcatori env/profilo AWS Bedrock e metadati di autenticazione sintetica dei plugin;
  non carica il runtime del provider, non legge segreti del keychain, non chiama API provider
  né prova l'esatta prontezza di esecuzione per modello.
- `models list --all --provider <id>` può includere righe di catalogo statiche di proprietà del provider
  da manifest dei plugin o metadati di catalogo dei provider in bundle anche quando
  non ti sei ancora autenticato con quel provider. Quelle righe risultano comunque
  non disponibili finché non viene configurata un'autenticazione corrispondente.
- `models list` mantiene il piano di controllo reattivo quando l'individuazione del catalogo provider
  è lenta. Le viste predefinite e configurate ripiegano su righe di modello configurate o
  sintetiche dopo una breve attesa e lasciano che l'individuazione finisca in
  background. Usa `--all` quando ti serve l'esatto catalogo completo individuato e
  sei disposto ad attendere l'individuazione del provider.
- Un `models list --all` ampio unisce le righe di catalogo del manifest sopra le righe del registro
  senza caricare hook supplementari del runtime provider. I percorsi rapidi del manifest filtrati per provider
  usano solo provider marcati `static`; i provider marcati `refreshable`
  restano basati su registro/cache e aggiungono righe del manifest come supplementi, mentre
  i provider marcati `runtime` restano su individuazione registro/runtime.
- `models list` mantiene distinti i metadati nativi del modello e i limiti del runtime. Nell'output tabellare,
  `Ctx` mostra `contextTokens/contextWindow` quando un limite runtime effettivo
  differisce dalla finestra di contesto nativa; le righe JSON includono `contextTokens`
  quando un provider espone quel limite.
- `models list --provider <id>` filtra per ID provider, come `moonshot` o
  `openai-codex`. Non accetta etichette di visualizzazione dai selettori provider
  interattivi, come `Moonshot AI`.
- I riferimenti ai modelli vengono analizzati dividendo sulla **prima** `/`. Se l'ID modello include `/` (stile OpenRouter), includi il prefisso del provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw risolve prima l'input come alias, poi
  come corrispondenza unica di provider configurato per quell'ID modello esatto, e solo allora
  ripiega sul provider predefinito configurato con un avviso di deprecazione.
  Se quel provider non espone più il modello predefinito configurato, OpenClaw
  ripiega sul primo provider/modello configurato invece di mostrare un
  valore predefinito obsoleto di un provider rimosso.
- `models status` può mostrare `marker(<value>)` nell'output di autenticazione per segnaposto non segreti (per esempio `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) invece di mascherarli come segreti.

### Scansione modelli

`models scan` legge il catalogo pubblico `:free` di OpenRouter e classifica i candidati per
l'uso come alternative di riserva. Il catalogo stesso è pubblico, quindi le scansioni solo metadati non richiedono
una chiave OpenRouter.

Per impostazione predefinita OpenClaw prova a verificare il supporto per strumenti e immagini con chiamate live ai modelli.
Se non è configurata alcuna chiave OpenRouter, il comando ripiega sull'output solo metadati
e spiega che i modelli `:free` richiedono comunque `OPENROUTER_API_KEY` per
verifiche e inferenza.

Opzioni:

- `--no-probe` (solo metadati; nessuna ricerca di configurazione/segreti)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (richiesta al catalogo e timeout per verifica)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` e `--set-image` richiedono verifiche live; i risultati delle scansioni
solo metadati sono informativi e non vengono applicati alla configurazione.

### Stato modelli

Opzioni:

- `--json`
- `--plain`
- `--check` (codice di uscita 1=scaduto/mancante, 2=in scadenza)
- `--probe` (verifica live dei profili di autenticazione configurati)
- `--probe-provider <name>` (verifica un provider)
- `--probe-profile <id>` (ID profilo ripetuti o separati da virgole)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (ID agente configurato; sovrascrive `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` mantiene stdout riservato al payload JSON. Diagnostica dei profili di autenticazione, dei provider
e dell'avvio viene instradata a stderr, così gli script possono convogliare stdout direttamente
in strumenti come `jq`.

Categorie di stato delle verifiche:

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
  il profilo è presente ma non è idoneo/risolvibile.
- `no_model`: l'autenticazione del provider esiste, ma OpenClaw non è riuscito a risolvere un candidato modello
  verificabile per quel provider.

## Alias + alternative di riserva

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

`models auth add` è l'assistente interattivo di autenticazione. Può avviare un flusso di autenticazione del provider
(OAuth/chiave API) o guidarti nell'incollare manualmente il token, a seconda del
provider che scegli.

`models auth list` elenca i profili di autenticazione salvati per l'agente selezionato senza
stampare token, chiavi API o materiale segreto OAuth. Usa `--provider <id>` per
filtrare su un provider, come `openai-codex`, e `--json` per gli script.

`models auth login` esegue il flusso di autenticazione di un plugin provider (OAuth/chiave API). Usa
`openclaw plugins list` per vedere quali provider sono installati.
Usa `openclaw models auth --agent <id> <subcommand>` per scrivere i risultati dell'autenticazione in uno
store agente configurato specifico. Il flag padre `--agent` è rispettato da
`add`, `list`, `login`, `setup-token`, `paste-token` e
`login-github-copilot`.

Esempi:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Note:

- `setup-token` e `paste-token` restano comandi token generici per provider
  che espongono metodi di autenticazione tramite token.
- `setup-token` richiede un TTY interattivo ed esegue il metodo di autenticazione tramite token
  del provider (con impostazione predefinita al metodo `setup-token` di quel provider quando ne espone
  uno).
- `paste-token` accetta una stringa token generata altrove o dall'automazione.
- `paste-token` richiede `--provider`, chiede il valore del token e lo scrive
  nell'ID profilo predefinito `<provider>:manual`, a meno che non passi
  `--profile-id`.
- `paste-token --expires-in <duration>` memorizza una scadenza assoluta del token da una
  durata relativa come `365d` o `12h`.
- Nota su Anthropic: lo staff di Anthropic ci ha detto che l'uso in stile OpenClaw della Claude CLI è nuovamente consentito, quindi OpenClaw tratta il riuso della Claude CLI e l'uso di `claude -p` come autorizzati per questa integrazione, a meno che Anthropic non pubblichi una nuova policy.
- Anthropic `setup-token` / `paste-token` restano disponibili come percorso token OpenClaw supportato, ma OpenClaw ora preferisce il riuso della Claude CLI e `claude -p` quando disponibili.

## Correlato

- [Riferimento CLI](/it/cli)
- [Selezione modello](/it/concepts/model-providers)
- [Failover dei modelli](/it/concepts/model-failover)
