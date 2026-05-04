---
read_when:
    - Vuoi modificare i modelli predefiniti o visualizzare lo stato di autenticazione del provider
    - Vuoi esaminare i modelli/provider disponibili ed eseguire il debug dei profili di autenticazione
summary: Riferimento CLI per `openclaw models` (status/list/set/scan, alias, fallback, autenticazione)
title: Modelli
x-i18n:
    generated_at: "2026-05-04T18:23:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc7842f02e29aa0ac2ae88f3d42bba71f1890a58ab22d818dbee0585bc562fea
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Rilevamento, scansione e configurazione dei modelli (modello predefinito, fallback, profili di autenticazione).

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

`openclaw models status` mostra il valore predefinito risolto/i fallback risolti più una panoramica dell'autenticazione.
Quando sono disponibili snapshot dell'utilizzo dei provider, la sezione dello stato OAuth/chiave API include
finestre di utilizzo dei provider e snapshot delle quote.
Provider attuali per finestre di utilizzo: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi e z.ai. L'autenticazione per l'utilizzo proviene da hook specifici del provider
quando disponibili; altrimenti OpenClaw usa come fallback le credenziali OAuth/chiave API corrispondenti
da profili di autenticazione, env o configurazione.
Nell'output `--json`, `auth.providers` è la panoramica dei provider consapevole di env/configurazione/store,
mentre `auth.oauth` è solo lo stato di integrità dei profili dell'auth-store.
Aggiungi `--probe` per eseguire sonde di autenticazione live su ciascun profilo provider configurato.
Le sonde sono richieste reali (possono consumare token e attivare limiti di frequenza).
Usa `--agent <id>` per ispezionare lo stato di modello/autenticazione di un agente configurato. Se omesso,
il comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se impostato, altrimenti l'agente
predefinito configurato.
Le righe delle sonde possono provenire da profili di autenticazione, credenziali env o `models.json`.

Note:

- `models set <model-or-alias>` accetta `provider/model` o un alias.
- `models list` è di sola lettura: legge configurazione, profili di autenticazione, stato del catalogo
  esistente e righe del catalogo di proprietà del provider, ma non riscrive
  `models.json`.
- La colonna `Auth` è a livello di provider ed è di sola lettura. È calcolata da metadati locali
  dei profili di autenticazione, marker env, chiavi provider configurate, marker di provider locali,
  marker env/profilo AWS Bedrock e metadati di autenticazione sintetica dei Plugin;
  non carica il runtime del provider, non legge segreti dal portachiavi, non chiama API del provider
  né dimostra l'esatta prontezza di esecuzione per modello.
- `models list --all --provider <id>` può includere righe statiche del catalogo di proprietà del provider
  da manifest dei Plugin o metadati del catalogo dei provider inclusi anche quando non ti sei ancora
  autenticato con quel provider. Quelle righe vengono comunque mostrate come non disponibili
  finché non viene configurata l'autenticazione corrispondente.
- `models list` mantiene reattivo il piano di controllo mentre il rilevamento del catalogo del provider
  è lento. Le viste predefinita e configurata usano come fallback righe di modello configurate o
  sintetiche dopo una breve attesa e lasciano terminare il rilevamento in background.
  Usa `--all` quando ti serve l'esatto catalogo completo rilevato e sei disposto ad attendere
  il rilevamento del provider.
- `models list --all` ampio unisce le righe di catalogo dei manifest sopra le righe del registro
  senza caricare gli hook supplementari del runtime del provider. I percorsi rapidi dei manifest filtrati per provider
  usano solo i provider marcati `static`; i provider marcati `refreshable`
  restano basati su registro/cache e aggiungono righe dei manifest come supplementi, mentre
  i provider marcati `runtime` restano sul rilevamento registro/runtime.
- `models list` mantiene distinti i metadati nativi del modello e i limiti del runtime. Nell'output tabellare,
  `Ctx` mostra `contextTokens/contextWindow` quando un limite di runtime effettivo
  differisce dalla finestra di contesto nativa; le righe JSON includono `contextTokens`
  quando un provider espone tale limite.
- `models list --provider <id>` filtra per id provider, come `moonshot` o
  `openai-codex`. Non accetta le etichette visualizzate dai selettori interattivi dei provider,
  come `Moonshot AI`.
- I riferimenti ai modelli vengono analizzati dividendo alla **prima** `/`. Se l'ID modello include `/` (stile OpenRouter), includi il prefisso del provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw risolve prima l'input come alias, poi
  come corrispondenza unica del provider configurato per quell'esatto id modello, e solo allora
  usa come fallback il provider predefinito configurato con un avviso di deprecazione.
  Se quel provider non espone più il modello predefinito configurato, OpenClaw
  usa come fallback il primo provider/modello configurato invece di mostrare un
  predefinito obsoleto di un provider rimosso.
- `models status` può mostrare `marker(<value>)` nell'output di autenticazione per segnaposto non segreti (per esempio `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) invece di mascherarli come segreti.

### Scansione dei modelli

`models scan` legge il catalogo pubblico `:free` di OpenRouter e classifica i candidati per
l'uso come fallback. Il catalogo stesso è pubblico, quindi le scansioni solo metadati non richiedono
una chiave OpenRouter.

Per impostazione predefinita OpenClaw prova a sondare il supporto per strumenti e immagini con chiamate live ai modelli.
Se non è configurata alcuna chiave OpenRouter, il comando ripiega su output solo metadati
e spiega che i modelli `:free` richiedono comunque `OPENROUTER_API_KEY` per
sonde e inferenza.

Opzioni:

- `--no-probe` (solo metadati; nessuna ricerca di configurazione/segreti)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (richiesta del catalogo e timeout per sonda)
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
- `--check` (codici di uscita 1=scaduto/mancante, 2=in scadenza)
- `--probe` (sonda live dei profili di autenticazione configurati)
- `--probe-provider <name>` (sonda un provider)
- `--probe-profile <id>` (id profilo ripetuti o separati da virgole)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agente configurato; sostituisce `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` mantiene stdout riservato al payload JSON. Le diagnostiche di profilo di autenticazione, provider
e avvio vengono indirizzate a stderr così gli script possono collegare stdout direttamente
a strumenti come `jq`.

Bucket dello stato della sonda:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casi di dettaglio/codice motivo della sonda da aspettarsi:

- `excluded_by_auth_order`: esiste un profilo salvato, ma un
  `auth.order.<provider>` esplicito lo ha omesso, quindi la sonda segnala l'esclusione invece di
  provarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  il profilo è presente ma non è idoneo/risolvibile.
- `no_model`: l'autenticazione del provider esiste, ma OpenClaw non è riuscito a risolvere un candidato
  modello sondabile per quel provider.

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

`models auth add` è l'helper interattivo per l'autenticazione. Può avviare un flusso di autenticazione del provider
(OAuth/chiave API) o guidarti nell'incollare manualmente un token, a seconda del
provider che scegli.

`models auth list` elenca i profili di autenticazione salvati per l'agente selezionato senza
stampare token, chiavi API o materiale segreto OAuth. Usa `--provider <id>` per
filtrare su un provider, come `openai-codex`, e `--json` per gli script.

`models auth login` esegue il flusso di autenticazione di un Plugin provider (OAuth/chiave API). Usa
`openclaw plugins list` per vedere quali provider sono installati.
Usa `openclaw models auth --agent <id> <subcommand>` per scrivere i risultati di autenticazione in uno
store di agente configurato specifico. Il flag padre `--agent` è rispettato da
`add`, `list`, `login`, `setup-token`, `paste-token` e
`login-github-copilot`.

Esempi:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Note:

- `setup-token` e `paste-token` restano comandi token generici per i provider
  che espongono metodi di autenticazione tramite token.
- `setup-token` richiede un TTY interattivo ed esegue il metodo di autenticazione tramite token del provider
  (per impostazione predefinita il metodo `setup-token` di quel provider quando ne espone
  uno).
- `paste-token` accetta una stringa token generata altrove o dall'automazione.
- `paste-token` richiede `--provider`, chiede il valore del token e lo scrive
  nell'id profilo predefinito `<provider>:manual` a meno che tu non passi
  `--profile-id`.
- `paste-token --expires-in <duration>` salva una scadenza assoluta del token da una
  durata relativa come `365d` o `12h`.
- Nota su Anthropic: lo staff di Anthropic ci ha detto che l'uso in stile Claude CLI di OpenClaw è di nuovo consentito, quindi OpenClaw considera il riuso di Claude CLI e l'uso di `claude -p` come autorizzati per questa integrazione, salvo pubblicazione di una nuova policy da parte di Anthropic.
- Anthropic `setup-token` / `paste-token` restano disponibili come percorso token OpenClaw supportato, ma ora OpenClaw preferisce il riuso di Claude CLI e `claude -p` quando disponibili.

## Correlati

- [Riferimento CLI](/it/cli)
- [Selezione del modello](/it/concepts/model-providers)
- [Failover del modello](/it/concepts/model-failover)
