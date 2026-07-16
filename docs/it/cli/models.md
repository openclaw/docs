---
read_when:
    - Si desidera cambiare i modelli predefiniti o visualizzare lo stato di autenticazione del provider
    - Si desidera esaminare i modelli/provider disponibili ed eseguire il debug dei profili di autenticazione
summary: Riferimento CLI per `openclaw models` (stato/elenco/impostazione/scansione, alias, fallback, autenticazione)
title: Modelli
x-i18n:
    generated_at: "2026-07-16T14:09:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 330598225664ff961ab41bf6358226ad64eb43e941be7f422cfde0fe9d93cea8
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Rilevamento, scansione e configurazione dei modelli (modello predefinito, fallback, profili di autenticazione).

Argomenti correlati:

- Provider e modelli: [Modelli](/it/providers/models)
- Concetti di selezione del modello e comando slash `/models`: [Concetti sui modelli](/it/concepts/models)
- Configurazione dell'autenticazione del provider: [Guida introduttiva](/it/start/getting-started)

## Comandi comuni

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

I sottocomandi `status` e `auth` accettano `--agent <id>` per indicare un agente configurato; `list`, `scan`, `aliases` e `fallbacks`/`image-fallbacks` usano sempre l'agente predefinito configurato, mentre `set`/`set-image` rifiutano categoricamente `--agent`. Se omesso, i comandi che supportano `--agent` usano `OPENCLAW_AGENT_DIR`, se impostato, altrimenti l'agente predefinito configurato.

### Stato

`openclaw models status` mostra il modello predefinito e i fallback risolti, insieme a una panoramica dell'autenticazione. Quando sono disponibili istantanee sull'utilizzo dei provider, la sezione sullo stato OAuth/chiave API include finestre di utilizzo e istantanee delle quote dei provider. Provider attualmente supportati per le finestre di utilizzo: Anthropic, GitHub Copilot, Gemini CLI, OpenAI, MiniMax, Xiaomi e z.ai. I dati di autenticazione per l'utilizzo provengono da hook specifici del provider, quando disponibili; altrimenti OpenClaw ricorre alle credenziali OAuth/chiave API corrispondenti nei profili di autenticazione, nelle variabili di ambiente o nella configurazione.

Nell'output di `--json`, `auth.providers` è la panoramica del provider che tiene conto di variabili di ambiente, configurazione e archivio, mentre `auth.oauth` riguarda esclusivamente lo stato dei profili nell'archivio di autenticazione.

Opzioni:

| Flag                      | Effetto                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--json`                  | Output JSON; la diagnostica dei profili di autenticazione, del provider e dell'avvio viene inviata a stderr, affinché stdout possa essere reindirizzato tramite pipe a `jq`. |
| `--plain`                 | Output in testo semplice.                                                                                            |
| `--check`                 | Termina con codice diverso da zero se l'autenticazione sta per scadere o è scaduta: `1` = scaduta/mancante, `2` = in scadenza.                             |
| `--probe`                 | Verifica in tempo reale dei profili di autenticazione configurati. Esegue richieste reali; può consumare token e attivare limiti di frequenza.            |
| `--probe-provider <name>` | Verifica un solo provider.                                                                                      |
| `--probe-profile <id>`    | Verifica ID specifici dei profili di autenticazione (ripetuti o separati da virgole).                                                  |
| `--probe-timeout <ms>`    | Timeout per singola verifica.                                                                                            |
| `--probe-concurrency <n>` | Verifiche simultanee.                                                                                            |
| `--probe-max-tokens <n>`  | Numero massimo di token per la verifica (nei limiti del possibile).                                                                               |
| `--agent <id>`            | ID dell'agente configurato; sostituisce `OPENCLAW_AGENT_DIR`.                                                          |

Le righe di verifica possono provenire da profili di autenticazione, credenziali nelle variabili di ambiente o `models.json`. Categorie dello stato di verifica: `ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`.

Codici di dettaglio/motivo previsti quando una verifica non raggiunge mai una chiamata al modello:

- `excluded_by_auth_order`: esiste un profilo archiviato, ma `auth.order.<provider>` esplicito lo ha omesso, quindi la verifica segnala l'esclusione anziché tentare di usarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`: il profilo è presente ma non è idoneo o risolvibile.
- `ineligible_profile`: il profilo è incompatibile con la configurazione del provider per un altro motivo.
- `no_model`: esiste l'autenticazione del provider, ma OpenClaw non è riuscito a risolvere un modello candidato verificabile per tale provider.

Per risolvere i problemi relativi all'OAuth di OpenAI ChatGPT/Codex, `openclaw models status`, `openclaw models auth list --provider openai` e `openclaw config get agents.defaults.model --json` costituiscono il modo più rapido per verificare se un agente dispone di un profilo OAuth `openai` utilizzabile per `openai/*` tramite il runtime Codex nativo. Consultare [Configurazione del provider OpenAI](/it/providers/openai#check-and-recover-codex-oauth-routing).

### Elenco

`openclaw models list` è di sola lettura: legge la configurazione, i profili di autenticazione, lo stato esistente del catalogo e le righe del catalogo gestite dai provider, ma non riscrive mai `models.json`.

Opzioni: `--all` (catalogo completo), `--local` (filtra i modelli locali), `--provider <id>`, `--json`, `--plain`.

Note:

- La colonna `Auth` è di sola lettura. Per le route dei modelli gestite dai provider, come OpenAI, associa la route API/URL di base di ogni riga ai profili idonei nell'`auth.order` effettivo, alle credenziali nelle variabili di ambiente o nella configurazione e ai SecretRef risolti nell'ambito del comando. Una riga OpenAI concreta rimane sconosciuta quando i criteri della relativa route non sono disponibili, anziché ereditare l'autenticazione a livello di provider; i controlli precedenti limitati al provider e gli altri provider mantengono il comportamento a livello di provider. I metadati di autenticazione sintetica del Plugin rappresentano solo un'indicazione delle capacità del runtime, non una prova dell'autenticazione nativa dell'account; pertanto, le route dipendenti dall'account rimangono sconosciute senza evidenze positive nel registro. Il comando non carica il runtime del provider, non legge segreti dal portachiavi, non chiama le API del provider e non dimostra l'esatta disponibilità all'esecuzione.
- `models list --all --provider <id>` può includere righe statiche del catalogo gestite dal provider provenienti dai manifest dei Plugin o dai metadati del catalogo dei provider inclusi, anche se l'autenticazione con tale provider non è ancora stata eseguita. Queste righe vengono comunque mostrate come non disponibili finché non viene configurata un'autenticazione corrispondente.
- `models list` mantiene reattivo il piano di controllo quando il rilevamento del catalogo del provider è lento. Le viste predefinite e configurate, dopo una breve attesa, ricorrono alle righe dei modelli configurate o sintetiche e consentono al rilevamento di terminare in background. Usare `--all` quando è necessario il catalogo completo rilevato con esattezza e si è disposti ad attendere il rilevamento del provider.
- Il comando generale `models list --all` sovrappone le righe del catalogo del manifest a quelle del registro senza caricare gli hook supplementari del runtime del provider. I percorsi rapidi dei manifest filtrati per provider usano solo i provider contrassegnati con `static`; i provider contrassegnati con `refreshable` continuano a basarsi su registro/cache e aggiungono le righe del manifest come integrazioni, mentre quelli contrassegnati con `runtime` continuano a usare il rilevamento tramite registro/runtime.
- `models list` mantiene distinti i metadati nativi del modello e i limiti del runtime. Nell'output tabellare, `Ctx` mostra `contextTokens/contextWindow` quando un limite effettivo del runtime differisce dalla finestra di contesto nativa; le righe JSON includono `contextTokens` quando un provider espone tale limite.
- Per le route gestite dal provider, `models list` proietta una riga logica provider/modello sulla route selezionata. `Input` e `Ctx` provengono esclusivamente da una riga del catalogo relativa alla route fisica esatta, applicando per ultime le sostituzioni logiche configurate esplicitamente; se la selezione della route non viene risolta, i campi delle capacità risultano sconosciuti anziché ereditare i metadati di route parallele.
- `models list --provider <id>` filtra per ID del provider, ad esempio `moonshot` o `openai`. Non accetta le etichette visualizzate dai selettori interattivi dei provider, come `Moonshot AI`.
- I riferimenti ai modelli vengono analizzati dividendoli alla **prima** occorrenza di `/`. Se l'ID del modello include `/` (stile OpenRouter), includere il prefisso del provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se il provider viene omesso, OpenClaw risolve prima l'input come alias, quindi come corrispondenza univoca tra i provider configurati per l'ID esatto del modello e solo successivamente ricorre al provider predefinito configurato, mostrando un avviso di deprecazione. Se tale provider non espone più il modello predefinito configurato, OpenClaw ricorre al primo provider/modello configurato anziché segnalare un'impostazione predefinita obsoleta relativa a un provider rimosso.
- `models status` può mostrare `marker(<value>)` nell'output di autenticazione per i segnaposto non segreti (ad esempio `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) invece di mascherarli come segreti.

### Impostazione del modello predefinito / per immagini

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set` scrive `agents.defaults.model.primary`; `set-image` scrive `agents.defaults.imageModel.primary`. Entrambi accettano `provider/model` o un alias configurato. `set` ripara inoltre le installazioni dei Plugin del runtime Codex/Copilot quando il modello appena selezionato ne richiede uno; `set-image` non lo fa. Nessuno dei due comandi accetta `--agent`; entrambi scrivono sempre le impostazioni predefinite dell'agente.

### Scansione

`models scan` legge il catalogo pubblico `:free` di OpenRouter e classifica i candidati per l'uso come fallback. Il catalogo è pubblico, quindi le scansioni dei soli metadati non richiedono una chiave OpenRouter.

Per impostazione predefinita, OpenClaw tenta di verificare il supporto per strumenti e immagini mediante chiamate reali ai modelli. Se non è configurata una chiave OpenRouter, il comando ricorre a un output di soli metadati e spiega che i modelli `:free` richiedono comunque `OPENROUTER_API_KEY` per le verifiche e l'inferenza.

Opzioni:

- `--no-probe` (solo metadati; nessuna consultazione di configurazione/segreti)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (timeout della richiesta al catalogo e per singola verifica)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` e `--set-image` richiedono verifiche in tempo reale; i risultati delle scansioni basate sui soli metadati sono informativi e non vengono applicati alla configurazione.

## Alias

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

Gli alias vengono archiviati per ogni voce del modello come `agents.defaults.models.<key>.alias`. `add` risolve prima `<model-or-alias>` in una chiave canonica provider/modello, quindi l'assegnazione di un alias a un altro alias lo reindirizza anziché creare una catena.

## Fallback

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

Gestisce `agents.defaults.model.fallbacks`. `openclaw models image-fallbacks list|add|remove|clear` gestisce l'elenco parallelo `agents.defaults.imageModel.fallbacks` con la stessa struttura dei sottocomandi.

## Profili di autenticazione

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth login-github-copilot
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token --provider <id>
openclaw models auth order get --provider <id>
openclaw models auth order set --provider <id> <profileIds...>
openclaw models auth order clear --provider <id>
```

`models auth add` è l'assistente interattivo per l'autenticazione. Può avviare un flusso di autenticazione del provider (OAuth/chiave API) o guidare nell'inserimento manuale di un token, a seconda del provider selezionato.

`models auth list` elenca i profili di autenticazione salvati per l'agente selezionato senza mostrare token, chiavi API o materiale segreto OAuth. Usare `--provider <id>` per filtrare in base a un singolo provider, ad esempio `openai`, e `--json` per gli script.

`models auth login` esegue il flusso di autenticazione di un Plugin del provider (OAuth/chiave API). Usare `openclaw plugins list` per vedere quali provider sono installati. `login` accetta `--profile-id <id>` per i provider che supportano profili denominati durante l'accesso (usarlo per mantenere separati più accessi allo stesso provider), `--method <id>` per scegliere un metodo di autenticazione specifico, `--device-code` come scorciatoia per `--method device-code`, `--set-default` per applicare il modello predefinito consigliato dal provider e `--force` per rimuovere prima i profili esistenti per quel provider (usarlo quando un profilo OAuth memorizzato nella cache è bloccato o si desidera cambiare account).

`models auth login-github-copilot` è una scorciatoia per `models auth login --provider github-copilot --method device` (flusso del dispositivo GitHub); accetta `--yes` per sovrascrivere un profilo esistente senza richiedere conferma.

Usare `openclaw models auth --agent <id> <subcommand>` per scrivere i risultati dell'autenticazione nell'archivio di uno specifico agente configurato. Il flag padre `--agent` viene rispettato da `add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token`, `login-github-copilot` e `order get`/`set`/`clear`.

Per i modelli OpenAI, `--provider openai` usa per impostazione predefinita l'accesso con un account ChatGPT/Codex. Usare `--method api-key` solo quando si desidera aggiungere un profilo con chiave API OpenAI, solitamente come riserva in caso di raggiungimento dei limiti dell'abbonamento Codex. Eseguire `openclaw doctor --fix` per migrare il precedente stato legacy di autenticazione/profilo con prefisso OpenAI Codex a `openai`.

Esempi:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Note:

- `paste-api-key` accetta chiavi API generate altrove, richiede il valore della chiave e lo scrive nell'ID del profilo predefinito `<provider>:manual`, a meno che non venga passato `--profile-id`. Nell'automazione, passare la chiave tramite stdin, ad esempio `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` e `paste-token` rimangono comandi generici per i token destinati ai provider che espongono metodi di autenticazione tramite token.
- `setup-token` richiede un TTY interattivo ed esegue il metodo di autenticazione tramite token del provider (utilizzando per impostazione predefinita il metodo `setup-token` di quel provider, se disponibile).
- `paste-token` richiede `--provider`, richiede per impostazione predefinita il valore del token e lo scrive nell'ID del profilo predefinito `<provider>:manual`, a meno che non venga passato `--profile-id`. Nell'automazione, passare il token tramite stdin anziché come argomento, affinché le credenziali del provider non compaiano nella cronologia della shell o negli elenchi dei processi.
- `paste-token --expires-in <duration>` memorizza una scadenza assoluta del token a partire da una durata relativa, ad esempio `365d` o `12h`.
- Per `openai`, le chiavi API OpenAI e il materiale dei token ChatGPT/OAuth hanno forme di autenticazione diverse. Usare `paste-api-key` per le chiavi API OpenAI `sk-...` e `paste-token` solo per il materiale di autenticazione tramite token.
- Anthropic: `setup-token`/`paste-token` sono percorsi di autenticazione OpenClaw supportati per `anthropic`, ma OpenClaw preferisce riutilizzare la CLI Claude (`claude -p`) sull'host, quando disponibile.
- `auth order get/set/clear` gestisce, per un provider, una sostituzione dell'ordine dei profili di autenticazione specifica per agente, memorizzata in `auth-state.json` (separatamente dalla chiave di configurazione `auth.order.<provider>`). `set` accetta uno o più ID di profilo in ordine di priorità; `clear` torna all'ordinamento della configurazione/round-robin.

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Selezione del modello](/it/concepts/model-providers)
- [Failover del modello](/it/concepts/model-failover)
