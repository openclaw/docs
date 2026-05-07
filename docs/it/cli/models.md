---
read_when:
    - Vuoi cambiare i modelli predefiniti o visualizzare lo stato dell'autenticazione del fornitore
    - Vuoi esaminare i modelli/provider disponibili ed eseguire il debug dei profili di autenticazione
summary: Riferimento CLI per `openclaw models` (status/list/set/scan, alias, alternative di ripiego, autenticazione)
title: Modelli
x-i18n:
    generated_at: "2026-05-07T13:14:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e1a7a9304f9d03d11e38262487eae4f0cf8d7e0be7ca71bcc208030784728bf
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Individuazione, scansione e configurazione dei modelli (modello predefinito, fallback, profili di autenticazione).

Correlati:

- Fornitori + modelli: [Modelli](/it/providers/models)
- Concetti di selezione del modello + comando slash `/models`: [Concetto dei modelli](/it/concepts/models)
- Configurazione dell'autenticazione del fornitore: [Primi passi](/it/start/getting-started)

## Comandi comuni

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` mostra il default/fallback risolti più una panoramica dell'autenticazione.
Quando sono disponibili snapshot sull'uso dei fornitori, la sezione di stato OAuth/chiave API include
finestre di utilizzo del fornitore e snapshot delle quote.
Fornitori attuali con finestre di utilizzo: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi e z.ai. L'autenticazione di utilizzo deriva da hook specifici del fornitore
quando disponibili; altrimenti OpenClaw ricorre alle credenziali OAuth/chiave API corrispondenti
da profili di autenticazione, env o configurazione.
Nell'output `--json`, `auth.providers` è la panoramica dei fornitori consapevole di env/config/store,
mentre `auth.oauth` è solo lo stato di salute dei profili nell'auth-store.
Aggiungi `--probe` per eseguire probe di autenticazione live su ciascun profilo fornitore configurato.
I probe sono richieste reali (possono consumare token e attivare limiti di frequenza).
Usa `--agent <id>` per ispezionare lo stato modello/autenticazione di un agente configurato. Se omesso,
il comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se impostato, altrimenti l'agente
predefinito configurato.
Le righe dei probe possono provenire da profili di autenticazione, credenziali env o `models.json`.
Per risolvere problemi di OAuth Codex, `openclaw models status`,
`openclaw models auth list --provider openai-codex` e
`openclaw config get agents.defaults.model --json` sono il modo più rapido per
confermare se un agente ha un profilo di autenticazione `openai-codex` utilizzabile per
`openai/*` tramite il runtime Codex nativo. Vedi [Configurazione del fornitore OpenAI](/it/providers/openai#check-and-recover-codex-oauth-routing).

Note:

- `models set <model-or-alias>` accetta `provider/model` o un alias.
- `models list` è in sola lettura: legge configurazione, profili di autenticazione, stato del catalogo
  esistente e righe di catalogo gestite dal fornitore, ma non riscrive
  `models.json`.
- La colonna `Auth` è a livello di fornitore e in sola lettura. È calcolata da metadati locali
  dei profili di autenticazione, marker env, chiavi fornitore configurate, marker di fornitori locali,
  marker env/profilo AWS Bedrock e metadati di autenticazione sintetica dei plugin;
  non carica il runtime del fornitore, non legge segreti dal portachiavi, non chiama API
  del fornitore né prova l'esatta prontezza di esecuzione per modello.
- `models list --all --provider <id>` può includere righe di catalogo statiche gestite dal fornitore
  da manifest dei Plugin o metadati di catalogo dei fornitori integrati anche quando non ti sei ancora
  autenticato con quel fornitore. Quelle righe risultano comunque non disponibili finché non viene
  configurata l'autenticazione corrispondente.
- `models list` mantiene reattivo il piano di controllo quando l'individuazione del catalogo del fornitore
  è lenta. Le viste predefinita e configurata ricorrono a righe di modello configurate o sintetiche
  dopo una breve attesa e lasciano che l'individuazione termini in background.
  Usa `--all` quando ti serve l'intero catalogo individuato esatto e sei disposto ad attendere
  l'individuazione del fornitore.
- `models list --all` ampio unisce le righe di catalogo del manifest sopra le righe del registro
  senza caricare hook supplementari del runtime del fornitore. I percorsi rapidi del manifest filtrati
  per fornitore usano solo fornitori marcati `static`; i fornitori marcati `refreshable`
  restano basati su registro/cache e aggiungono righe del manifest come supplementi, mentre
  i fornitori marcati `runtime` restano sull'individuazione registro/runtime.
- `models list` mantiene distinti i metadati nativi del modello e i limiti del runtime. Nell'output tabellare,
  `Ctx` mostra `contextTokens/contextWindow` quando un limite runtime effettivo
  differisce dalla finestra di contesto nativa; le righe JSON includono `contextTokens`
  quando un fornitore espone quel limite.
- `models list --provider <id>` filtra per id del fornitore, come `moonshot` o
  `openai-codex`. Non accetta etichette visualizzate dai selettori interattivi di fornitori,
  come `Moonshot AI`.
- I riferimenti ai modelli vengono analizzati dividendo sulla **prima** `/`. Se l'ID del modello include `/` (stile OpenRouter), includi il prefisso del fornitore (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il fornitore, OpenClaw risolve l'input prima come alias, poi
  come corrispondenza univoca di fornitore configurato per quell'esatto id modello, e solo allora
  ricorre al fornitore predefinito configurato con un avviso di deprecazione.
  Se quel fornitore non espone più il modello predefinito configurato, OpenClaw
  ricorre invece alla prima coppia fornitore/modello configurata anziché mostrare un
  default obsoleto di un fornitore rimosso.
- `models status` può mostrare `marker(<value>)` nell'output di autenticazione per placeholder non segreti (per esempio `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) invece di mascherarli come segreti.

### Scansione dei modelli

`models scan` legge il catalogo pubblico `:free` di OpenRouter e classifica i candidati per
l'uso come fallback. Il catalogo in sé è pubblico, quindi le scansioni solo metadati non richiedono
una chiave OpenRouter.

Per impostazione predefinita OpenClaw prova a verificare il supporto per strumenti e immagini con chiamate live ai modelli.
Se non è configurata alcuna chiave OpenRouter, il comando ricorre all'output solo metadati
e spiega che i modelli `:free` richiedono comunque `OPENROUTER_API_KEY` per
probe e inferenza.

Opzioni:

- `--no-probe` (solo metadati; nessuna ricerca in config/segreti)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (timeout della richiesta al catalogo e per ciascun probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` e `--set-image` richiedono probe live; i risultati della scansione solo metadati
sono informativi e non vengono applicati alla configurazione.

### Stato dei modelli

Opzioni:

- `--json`
- `--plain`
- `--check` (exit 1=scaduto/mancante, 2=in scadenza)
- `--probe` (probe live dei profili di autenticazione configurati)
- `--probe-provider <name>` (verifica un fornitore)
- `--probe-profile <id>` (ripeti o usa id profilo separati da virgole)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agente configurato; sovrascrive `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` mantiene stdout riservato al payload JSON. Le diagnostiche dei profili di autenticazione,
dei fornitori e di avvio vengono instradate su stderr così gli script possono inviare stdout direttamente
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

- `excluded_by_auth_order`: esiste un profilo memorizzato, ma `auth.order.<provider>`
  esplicito lo ha omesso, quindi il probe segnala l'esclusione invece di
  provarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  il profilo è presente ma non è idoneo/risolvibile.
- `no_model`: l'autenticazione del fornitore esiste, ma OpenClaw non è riuscito a risolvere un candidato
  modello verificabile per quel fornitore.

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

`models auth add` è l'helper interattivo di autenticazione. Può avviare un flusso di autenticazione
del fornitore (OAuth/chiave API) o guidarti nell'incollare manualmente un token, a seconda del
fornitore che scegli.

`models auth list` elenca i profili di autenticazione salvati per l'agente selezionato senza
stampare token, chiavi API o materiale segreto OAuth. Usa `--provider <id>` per
filtrare su un fornitore, come `openai-codex`, e `--json` per gli script.

`models auth login` esegue il flusso di autenticazione di un Plugin fornitore (OAuth/chiave API). Usa
`openclaw plugins list` per vedere quali fornitori sono installati.
Usa `openclaw models auth --agent <id> <subcommand>` per scrivere i risultati di autenticazione in uno
store agente configurato specifico. Il flag padre `--agent` è rispettato da
`add`, `list`, `login`, `setup-token`, `paste-token` e
`login-github-copilot`.

Esempi:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Note:

- `setup-token` e `paste-token` restano comandi token generici per i fornitori
  che espongono metodi di autenticazione tramite token.
- `setup-token` richiede un TTY interattivo ed esegue il metodo di autenticazione tramite token
  del fornitore (con default al metodo `setup-token` di quel fornitore quando ne espone
  uno).
- `paste-token` accetta una stringa token generata altrove o dall'automazione.
- `paste-token` richiede `--provider`, chiede il valore del token e lo scrive
  nell'id profilo predefinito `<provider>:manual` salvo tu passi
  `--profile-id`.
- `paste-token --expires-in <duration>` memorizza una scadenza assoluta del token da una
  durata relativa come `365d` o `12h`.
- Nota Anthropic: lo staff Anthropic ci ha detto che l'uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi OpenClaw tratta il riuso di Claude CLI e l'uso di `claude -p` come autorizzati per questa integrazione salvo che Anthropic pubblichi una nuova policy.
- Anthropic `setup-token` / `paste-token` restano disponibili come percorso token OpenClaw supportato, ma OpenClaw ora preferisce il riuso di Claude CLI e `claude -p` quando disponibili.

## Correlati

- [Riferimento CLI](/it/cli)
- [Selezione del modello](/it/concepts/model-providers)
- [Failover del modello](/it/concepts/model-failover)
