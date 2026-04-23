---
read_when:
    - Vuoi cambiare i modelli predefiniti o visualizzare lo stato di autenticazione del provider
    - Vuoi analizzare i modelli/provider disponibili ed eseguire il debug dei profili di autenticazione
summary: Riferimento CLI per `openclaw models` (status/list/set/scan, alias, fallback, autenticazione)
title: models
x-i18n:
    generated_at: "2026-04-23T08:26:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4ba72ca8acb7cc31796c119fce3816e6a919eb28a4ed4b03664d3b222498f5a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Rilevamento, scansione e configurazione dei modelli (modello predefinito, fallback, profili di autenticazione).

Correlati:

- Provider + modelli: [Models](/it/providers/models)
- Concetti di selezione del modello + comando slash `/models`: [Concetto Models](/it/concepts/models)
- Configurazione dell'autenticazione del provider: [Per iniziare](/it/start/getting-started)

## Comandi comuni

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` mostra il predefinito/fallback risolto più una panoramica dell'autenticazione.
Quando sono disponibili snapshot di utilizzo del provider, la sezione stato OAuth/API key include
finestre di utilizzo del provider e snapshot di quota.
Provider attuali con finestra di utilizzo: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi e z.ai. L'autenticazione di utilizzo proviene da hook specifici del provider
quando disponibili; altrimenti OpenClaw usa come fallback le credenziali
OAuth/API key corrispondenti dai profili di autenticazione, dall'env o dalla configurazione.
Nell'output `--json`, `auth.providers` è la panoramica del provider
consapevole di env/config/store, mentre `auth.oauth` è solo lo stato dei profili dell'auth store.
Aggiungi `--probe` per eseguire probe di autenticazione live su ogni profilo provider configurato.
I probe sono richieste reali (possono consumare token e attivare rate limit).
Usa `--agent <id>` per ispezionare lo stato modello/auth di un agente configurato. Se omesso,
il comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se impostato, altrimenti
l'agente predefinito configurato.
Le righe del probe possono provenire da profili di autenticazione, credenziali env o `models.json`.

Note:

- `models set <model-or-alias>` accetta `provider/model` o un alias.
- `models list --all` include righe di catalogo statico dei provider inclusi
  anche quando non hai ancora effettuato l'autenticazione con quel provider. Quelle righe risultano comunque
  non disponibili finché non viene configurata l'autenticazione corrispondente.
- `models list --provider <id>` filtra per ID provider, come `moonshot` o
  `openai-codex`. Non accetta etichette di visualizzazione dai selettori interattivi
  dei provider, come `Moonshot AI`.
- I riferimenti ai modelli vengono analizzati dividendo sulla **prima** `/`. Se l'ID del modello include `/` (stile OpenRouter), includi il prefisso provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw risolve prima l'input come alias, poi
  come corrispondenza univoca di provider configurato per quell'esatto ID modello, e solo successivamente
  usa come fallback il provider predefinito configurato con un avviso di deprecazione.
  Se quel provider non espone più il modello predefinito configurato, OpenClaw
  usa come fallback il primo provider/modello configurato invece di mostrare un
  predefinito obsoleto di un provider rimosso.
- `models status` può mostrare `marker(<value>)` nell'output auth per segnaposto non segreti (ad esempio `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) invece di mascherarli come segreti.

### `models status`

Opzioni:

- `--json`
- `--plain`
- `--check` (codice di uscita 1=mancante/scaduto, 2=in scadenza)
- `--probe` (probe live dell'autenticazione configurata)
- `--probe-provider <name>` (probe di un provider)
- `--probe-profile <id>` (ripetibile o ID profilo separati da virgola)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (ID agente configurato; override di `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Bucket di stato del probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casi di dettaglio/codice motivo del probe da aspettarsi:

- `excluded_by_auth_order`: esiste un profilo memorizzato, ma `auth.order.<provider>`
  esplicito lo ha omesso, quindi il probe segnala l'esclusione invece di
  provarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  il profilo è presente ma non è idoneo/risolvibile.
- `no_model`: esiste autenticazione provider, ma OpenClaw non è riuscito a risolvere
  un candidato modello sondabile per quel provider.

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

`models auth add` è l'helper interattivo per l'autenticazione. Può avviare un flusso di autenticazione del provider
(OAuth/API key) o guidarti nell'incollare manualmente un token, a seconda del
provider che scegli.

`models auth login` esegue il flusso di autenticazione di un Plugin provider (OAuth/API key). Usa
`openclaw plugins list` per vedere quali provider sono installati.

Esempi:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Note:

- `setup-token` e `paste-token` restano comandi token generici per i provider
  che espongono metodi di autenticazione tramite token.
- `setup-token` richiede un TTY interattivo ed esegue il metodo di autenticazione tramite token del provider
  (usando come predefinito il metodo `setup-token` di quel provider quando ne espone
  uno).
- `paste-token` accetta una stringa token generata altrove o da automazione.
- `paste-token` richiede `--provider`, richiede il valore del token e lo scrive
  nell'ID profilo predefinito `<provider>:manual` a meno che tu non passi
  `--profile-id`.
- `paste-token --expires-in <duration>` memorizza una scadenza assoluta del token a partire da una
  durata relativa come `365d` o `12h`.
- Nota Anthropic: il personale Anthropic ci ha detto che l'uso in stile Claude CLI di OpenClaw è di nuovo consentito, quindi OpenClaw tratta il riuso di Claude CLI e l'uso di `claude -p` come approvati per questa integrazione a meno che Anthropic non pubblichi una nuova policy.
- `setup-token` / `paste-token` per Anthropic restano disponibili come percorso token OpenClaw supportato, ma OpenClaw ora preferisce il riuso di Claude CLI e `claude -p` quando disponibili.
