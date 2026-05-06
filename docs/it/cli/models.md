---
read_when:
    - Vuoi cambiare i modelli predefiniti o visualizzare lo stato dell'autenticazione del provider
    - Vuoi analizzare i modelli/provider disponibili ed eseguire il debug dei profili di autenticazione
summary: Riferimento CLI per `openclaw models` (status/list/set/scan, alias, fallback, auth)
title: Modelli
x-i18n:
    generated_at: "2026-05-06T08:43:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7a1cce7b1b21411540238b1858580a56b2271d54d0898e261b69bd21f88c0f5
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Rilevamento, scansione e configurazione dei modelli (modello predefinito, fallback, profili di autenticazione).

Correlati:

- Provider + modelli: [Modelli](/it/providers/models)
- Concetti di selezione del modello + comando slash `/models`: [Concetto di modelli](/it/concepts/models)
- Configurazione dell'autenticazione del provider: [Guida introduttiva](/it/start/getting-started)

## Comandi comuni

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` mostra il default/fallback risolti più una panoramica dell'autenticazione.
Quando sono disponibili snapshot dell'uso dei provider, la sezione di stato OAuth/chiave API include
finestre di uso dei provider e snapshot delle quote.
Provider attuali per le finestre di utilizzo: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi e z.ai. L'autenticazione dell'uso proviene da hook specifici del provider
quando disponibili; in caso contrario OpenClaw ripiega sulle credenziali OAuth/chiave API
corrispondenti da profili di autenticazione, env o configurazione.
Nell'output `--json`, `auth.providers` è la panoramica dei provider consapevole di env/config/store,
mentre `auth.oauth` è solo lo stato di salute dei profili dell'auth-store.
Aggiungi `--probe` per eseguire probe di autenticazione live su ogni profilo provider configurato.
I probe sono richieste reali (possono consumare token e attivare limiti di frequenza).
Usa `--agent <id>` per ispezionare lo stato modello/autenticazione di un agente configurato. Se omesso,
il comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se impostato, altrimenti l'agente
predefinito configurato.
Le righe dei probe possono provenire da profili di autenticazione, credenziali env o `models.json`.

Note:

- `models set <model-or-alias>` accetta `provider/model` o un alias.
- `models list` è di sola lettura: legge configurazione, profili di autenticazione, stato del catalogo
  esistente e righe di catalogo di proprietà del provider, ma non riscrive
  `models.json`.
- La colonna `Auth` è a livello di provider ed è di sola lettura. È calcolata da metadati dei profili
  di autenticazione locali, marker env, chiavi provider configurate, marker di provider locali,
  marker env/profilo AWS Bedrock e metadati di autenticazione sintetica dei plugin;
  non carica il runtime del provider, non legge segreti dal keychain, non chiama API del provider
  né dimostra l'esatta prontezza di esecuzione per singolo modello.
- `models list --all --provider <id>` può includere righe di catalogo statiche di proprietà del provider
  da manifest dei plugin o metadati di catalogo dei provider inclusi anche quando non hai ancora
  effettuato l'autenticazione con quel provider. Tali righe risultano comunque non disponibili finché
  non viene configurata un'autenticazione corrispondente.
- `models list` mantiene reattivo il control plane mentre il rilevamento del catalogo del provider
  è lento. Le viste predefinite e configurate ripiegano su righe di modelli configurate o sintetiche
  dopo una breve attesa e lasciano che il rilevamento termini in background. Usa `--all` quando ti serve
  l'esatto catalogo completo rilevato e sei disposto ad attendere il rilevamento del provider.
- `models list --all` ampio unisce le righe di catalogo del manifest sopra le righe del registro
  senza caricare gli hook supplementari del runtime del provider. I fast path dei manifest filtrati
  per provider usano solo provider contrassegnati come `static`; i provider contrassegnati come
  `refreshable` restano basati su registro/cache e aggiungono righe del manifest come supplementi,
  mentre i provider contrassegnati come `runtime` restano sul rilevamento registro/runtime.
- `models list` mantiene distinti i metadati nativi del modello e i cap del runtime. Nell'output tabellare,
  `Ctx` mostra `contextTokens/contextWindow` quando un cap runtime effettivo differisce dalla finestra
  di contesto nativa; le righe JSON includono `contextTokens` quando un provider espone quel cap.
- `models list --provider <id>` filtra per id provider, come `moonshot` o
  `openai-codex`. Non accetta etichette visualizzate dai selettori provider interattivi,
  come `Moonshot AI`.
- I riferimenti ai modelli vengono analizzati dividendo alla **prima** `/`. Se l'ID modello include `/` (stile OpenRouter), includi il prefisso del provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw risolve prima l'input come alias, poi
  come corrispondenza univoca di provider configurato per quell'esatto id modello, e solo dopo
  ripiega sul provider predefinito configurato con un avviso di deprecazione.
  Se quel provider non espone più il modello predefinito configurato, OpenClaw
  ripiega sul primo provider/modello configurato invece di mostrare un
  default obsoleto di provider rimosso.
- `models status` può mostrare `marker(<value>)` nell'output di autenticazione per placeholder non segreti (per esempio `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) invece di mascherarli come segreti.

### Scansione dei modelli

`models scan` legge il catalogo pubblico `:free` di OpenRouter e classifica i candidati per
l'uso come fallback. Il catalogo stesso è pubblico, quindi le scansioni solo metadati non richiedono
una chiave OpenRouter.

Per impostazione predefinita OpenClaw prova a verificare il supporto di tool e immagini con chiamate live ai modelli.
Se non è configurata alcuna chiave OpenRouter, il comando ripiega su un output solo metadati
e spiega che i modelli `:free` richiedono comunque `OPENROUTER_API_KEY` per
probe e inferenza.

Opzioni:

- `--no-probe` (solo metadati; nessuna ricerca di configurazione/segreti)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (richiesta catalogo e timeout per probe)
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
- `--probe-provider <name>` (esegui probe su un provider)
- `--probe-profile <id>` (ripeti o usa id profilo separati da virgole)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agente configurato; sovrascrive `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` mantiene stdout riservato al payload JSON. Diagnostica dei profili di autenticazione, dei provider
e di avvio viene instradata a stderr, così gli script possono convogliare stdout direttamente
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

Casi di dettaglio/codice motivo dei probe da aspettarsi:

- `excluded_by_auth_order`: esiste un profilo archiviato, ma
  `auth.order.<provider>` esplicito lo ha omesso, quindi il probe segnala l'esclusione invece di
  provarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  il profilo è presente ma non idoneo/risolvibile.
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
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` è l'helper di autenticazione interattivo. Può avviare un flusso di autenticazione del provider
(OAuth/chiave API) o guidarti nell'incollare manualmente il token, a seconda del
provider che scegli.

`models auth list` elenca i profili di autenticazione salvati per l'agente selezionato senza
stampare token, chiavi API o materiale segreto OAuth. Usa `--provider <id>` per
filtrare a un provider, come `openai-codex`, e `--json` per scripting.

`models auth login` esegue il flusso di autenticazione di un Plugin provider (OAuth/chiave API). Usa
`openclaw plugins list` per vedere quali provider sono installati.
Usa `openclaw models auth --agent <id> <subcommand>` per scrivere i risultati di autenticazione in uno
store specifico di un agente configurato. Il flag padre `--agent` è rispettato da
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
- `setup-token` richiede un TTY interattivo ed esegue il metodo di autenticazione tramite token del provider
  (predefinito al metodo `setup-token` di quel provider quando ne espone
  uno).
- `paste-token` accetta una stringa token generata altrove o da automazione.
- `paste-token` richiede `--provider`, chiede il valore del token e lo scrive
  nell'id profilo predefinito `<provider>:manual` a meno che tu non passi
  `--profile-id`.
- `paste-token --expires-in <duration>` archivia una scadenza assoluta del token da una
  durata relativa come `365d` o `12h`.
- Nota su Anthropic: il personale Anthropic ci ha comunicato che l'uso in stile OpenClaw della CLI Claude è di nuovo consentito, quindi OpenClaw considera il riuso della CLI Claude e l'uso di `claude -p` autorizzati per questa integrazione, salvo pubblicazione di una nuova policy da parte di Anthropic.
- Anthropic `setup-token` / `paste-token` restano disponibili come percorso token OpenClaw supportato, ma OpenClaw ora preferisce il riuso della CLI Claude e `claude -p` quando disponibili.

## Correlati

- [Riferimento CLI](/it/cli)
- [Selezione del modello](/it/concepts/model-providers)
- [Failover dei modelli](/it/concepts/model-failover)
