---
read_when:
    - Vuoi cambiare i modelli predefiniti o visualizzare lo stato di autenticazione del provider
    - Vuoi analizzare i modelli/provider disponibili ed eseguire il debug dei profili di autenticazione
summary: Riferimento CLI per `openclaw models` (status/list/set/scan, alias, fallback, autenticazione)
title: Modelli
x-i18n:
    generated_at: "2026-06-27T17:20:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15d0a01e0f8f971996359413306a1c694e5a787eaef69b13eb8ac63c2a7c8990
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Rilevamento, scansione e configurazione dei modelli (modello predefinito, fallback, profili di autenticazione).

Correlati:

- Provider + modelli: [Modelli](/it/providers/models)
- Concetti di selezione dei modelli + comando slash `/models`: [Concetto di modelli](/it/concepts/models)
- Configurazione dell'autenticazione del provider: [Guida introduttiva](/it/start/getting-started)

## Comandi comuni

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` mostra il valore predefinito/i fallback risolti più una panoramica dell'autenticazione.
Quando sono disponibili snapshot sull'utilizzo dei provider, la sezione dello stato OAuth/chiave API include
finestre di utilizzo del provider e snapshot delle quote.
Provider correnti con finestra di utilizzo: Anthropic, GitHub Copilot, Gemini CLI, OpenAI,
MiniMax, Xiaomi e z.ai. L'autenticazione per l'utilizzo proviene da hook specifici del provider
quando disponibili; altrimenti OpenClaw ripiega sulle credenziali OAuth/chiave API corrispondenti
provenienti da profili di autenticazione, env o configurazione.
Nell'output `--json`, `auth.providers` è la panoramica dei provider consapevole di env/configurazione/store,
mentre `auth.oauth` è solo lo stato dei profili dell'archivio di autenticazione.
Aggiungi `--probe` per eseguire sonde di autenticazione live su ogni profilo provider configurato.
Le sonde sono richieste reali (possono consumare token e attivare limiti di frequenza).
Usa `--agent <id>` per ispezionare lo stato modello/autenticazione di un agent configurato. Se omesso,
il comando usa `OPENCLAW_AGENT_DIR` se impostato, altrimenti l'agent predefinito
configurato.
Le righe delle sonde possono provenire da profili di autenticazione, credenziali env o `models.json`.
Per la risoluzione dei problemi OAuth di OpenAI ChatGPT/Codex, `openclaw models status`,
`openclaw models auth list --provider openai` e
`openclaw config get agents.defaults.model --json` sono il modo più rapido per
confermare se un agent ha un profilo OAuth `openai` utilizzabile per
`openai/*` tramite il runtime Codex nativo. Vedi [Configurazione del provider OpenAI](/it/providers/openai#check-and-recover-codex-oauth-routing).

Note:

- `models set <model-or-alias>` accetta `provider/model` o un alias.
- `models list` è di sola lettura: legge configurazione, profili di autenticazione, stato del catalogo
  esistente e righe del catalogo di proprietà del provider, ma non riscrive
  `models.json`.
- La colonna `Auth` è a livello di provider ed è di sola lettura. È calcolata dai metadati dei
  profili di autenticazione locali, marcatori env, chiavi provider configurate, marcatori di provider
  locali, marcatori env/profilo AWS Bedrock e metadati synthetic-auth dei Plugin;
  non carica il runtime del provider, non legge segreti dal keychain, non chiama API
  del provider e non prova l'esatta prontezza di esecuzione per modello.
- `models list --all --provider <id>` può includere righe di catalogo statiche di proprietà del provider
  provenienti da manifest di Plugin o metadati di catalogo dei provider integrati anche quando non
  ti sei ancora autenticato con quel provider. Quelle righe risultano comunque
  non disponibili finché non viene configurata l'autenticazione corrispondente.
- `models list` mantiene reattivo il control plane quando il rilevamento del catalogo del provider
  è lento. Le viste predefinita e configurata ripiegano su righe modello configurate o
  sintetiche dopo una breve attesa e lasciano che il rilevamento finisca in
  background. Usa `--all` quando ti serve il catalogo completo rilevato esatto e
  sei disposto ad attendere il rilevamento del provider.
- Un ampio `models list --all` unisce le righe del catalogo dei manifest sopra le righe del registro
  senza caricare gli hook supplementari del runtime del provider. I percorsi rapidi dei manifest filtrati per provider
  usano solo provider contrassegnati come `static`; i provider contrassegnati come `refreshable`
  restano supportati da registro/cache e aggiungono righe di manifest come supplementi, mentre
  i provider contrassegnati come `runtime` restano sul rilevamento tramite registro/runtime.
- `models list` mantiene distinti i metadati nativi del modello e i limiti del runtime. Nell'output tabellare,
  `Ctx` mostra `contextTokens/contextWindow` quando un limite effettivo del runtime
  differisce dalla finestra di contesto nativa; le righe JSON includono `contextTokens`
  quando un provider espone tale limite.
- `models list --provider <id>` filtra per id del provider, come `moonshot` o
  `openai`. Non accetta etichette visualizzate dai selettori interattivi dei provider,
  come `Moonshot AI`.
- I riferimenti ai modelli vengono analizzati dividendo alla **prima** `/`. Se l'ID modello include `/` (stile OpenRouter), includi il prefisso del provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw risolve l'input prima come alias, poi
  come corrispondenza univoca di provider configurato per quell'esatto id modello, e solo dopo
  ripiega sul provider predefinito configurato con un avviso di deprecazione.
  Se quel provider non espone più il modello predefinito configurato, OpenClaw
  ripiega invece sul primo provider/modello configurato invece di mostrare un
  valore predefinito obsoleto di un provider rimosso.
- `models status` può mostrare `marker(<value>)` nell'output di autenticazione per segnaposto non segreti (per esempio `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) invece di mascherarli come segreti.

### Scansione dei modelli

`models scan` legge il catalogo pubblico `:free` di OpenRouter e classifica i candidati per
l'uso come fallback. Il catalogo in sé è pubblico, quindi le scansioni solo metadati non richiedono
una chiave OpenRouter.

Per impostazione predefinita OpenClaw prova a verificare il supporto a strumenti e immagini con chiamate live ai modelli.
Se non è configurata alcuna chiave OpenRouter, il comando ripiega sull'output
solo metadati e spiega che i modelli `:free` richiedono comunque `OPENROUTER_API_KEY` per
sonde e inferenza.

Opzioni:

- `--no-probe` (solo metadati; nessuna ricerca di configurazione/segreti)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (timeout della richiesta catalogo e per sonda)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` e `--set-image` richiedono sonde live; i risultati delle scansioni
solo metadati sono informativi e non vengono applicati alla configurazione.

### Stato dei modelli

Opzioni:

- `--json`
- `--plain`
- `--check` (uscita 1=scaduto/mancante, 2=in scadenza)
- `--probe` (sonda live dei profili di autenticazione configurati)
- `--probe-provider <name>` (sonda un provider)
- `--probe-profile <id>` (id profilo ripetuti o separati da virgole)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agent configurato; sostituisce `OPENCLAW_AGENT_DIR`)

`--json` mantiene stdout riservato al payload JSON. Le diagnostiche dei profili di autenticazione, del provider
e di avvio sono instradate a stderr così gli script possono inviare direttamente stdout tramite pipe
a strumenti come `jq`.

Categorie di stato delle sonde:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casi di dettaglio/codice motivo delle sonde da aspettarsi:

- `excluded_by_auth_order`: esiste un profilo salvato, ma
  `auth.order.<provider>` esplicito lo ha omesso, quindi la sonda segnala l'esclusione invece di
  provarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  il profilo è presente ma non è idoneo/risolvibile.
- `no_model`: l'autenticazione del provider esiste, ma OpenClaw non è riuscito a risolvere un
  candidato modello verificabile per quel provider.

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
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` è l'helper interattivo per l'autenticazione. Può avviare un flusso di autenticazione del provider
(OAuth/chiave API) o guidarti nell'incollare manualmente un token, a seconda del
provider scelto.

`models auth list` elenca i profili di autenticazione salvati per l'agent selezionato senza
stampare token, chiavi API o materiale segreto OAuth. Usa `--provider <id>` per
filtrare su un provider, come `openai`, e `--json` per gli script.

`models auth login` esegue il flusso di autenticazione di un Plugin provider (OAuth/chiave API). Usa
`openclaw plugins list` per vedere quali provider sono installati.
Usa `openclaw models auth --agent <id> <subcommand>` per scrivere i risultati di autenticazione in uno
store di agent configurato specifico. Il flag padre `--agent` è rispettato da
`add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token` e
`login-github-copilot`.

Per i modelli OpenAI, `--provider openai` usa per impostazione predefinita l'accesso all'account ChatGPT/Codex.
Usa `--method api-key` solo quando vuoi aggiungere un profilo chiave API OpenAI,
di solito come backup per i limiti di abbonamento Codex. Esegui `openclaw doctor --fix`
per migrare il vecchio stato legacy di autenticazione/profili con prefisso OpenAI Codex a `openai`.

Esempi:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Note:

- `login` accetta `--profile-id <id>` per i provider che supportano profili
  nominati durante l'accesso. Usalo per mantenere separati più accessi per lo stesso
  provider.
- `paste-api-key` accetta chiavi API generate altrove, richiede il valore della chiave
  e la scrive nell'id profilo predefinito `<provider>:manual` a meno che tu non
  passi `--profile-id`. Nell'automazione, passa la chiave su stdin, per esempio
  `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` e `paste-token` restano comandi token generici per i provider
  che espongono metodi di autenticazione tramite token.
- `setup-token` richiede un TTY interattivo ed esegue il metodo token-auth
  del provider (per impostazione predefinita il metodo `setup-token` di quel provider quando ne espone
  uno).
- `paste-token` accetta una stringa token generata altrove o dall'automazione.
- `paste-token` richiede `--provider`, per impostazione predefinita richiede il valore del token,
  e lo scrive nell'id profilo predefinito `<provider>:manual` a meno che tu non passi
  `--profile-id`.
- Nell'automazione, passa il token su stdin invece di passarlo come argomento, così
  le credenziali del provider non appaiono nella cronologia della shell o negli elenchi dei processi.
- `paste-token --expires-in <duration>` archivia una scadenza assoluta del token da una
  durata relativa come `365d` o `12h`.
- Per `openai`, le chiavi API OpenAI e il materiale token ChatGPT/OAuth sono
  forme di autenticazione diverse. Usa `paste-api-key` per chiavi API OpenAI `sk-...` e
  `paste-token` solo per materiale di autenticazione tramite token.
- Nota Anthropic: lo staff Anthropic ci ha comunicato che l'uso in stile OpenClaw della Claude CLI è di nuovo consentito, quindi OpenClaw tratta il riuso della Claude CLI e l'uso di `claude -p` come autorizzati per questa integrazione, a meno che Anthropic non pubblichi una nuova policy.
- Anthropic `setup-token` / `paste-token` restano disponibili come percorso token OpenClaw supportato, ma OpenClaw ora preferisce il riuso della Claude CLI e `claude -p` quando disponibili.

## Correlati

- [Riferimento CLI](/it/cli)
- [Selezione dei modelli](/it/concepts/model-providers)
- [Failover dei modelli](/it/concepts/model-failover)
