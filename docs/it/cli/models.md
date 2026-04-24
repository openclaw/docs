---
read_when:
    - Vuoi cambiare i modelli predefiniti o vedere lo stato di autenticazione del provider
    - Vuoi analizzare i modelli/provider disponibili ed eseguire il debug dei profili di autenticazione
summary: Riferimento CLI per `openclaw models` (status/list/set/scan, alias, fallback, autenticazione)
title: Modelli
x-i18n:
    generated_at: "2026-04-24T08:34:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08e04342ef240bf7a1f60c4d4e2667d17c9a97e985c1b170db8538c890dc8119
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Rilevamento, scansione e configurazione dei modelli (modello predefinito, fallback, profili di autenticazione).

Correlati:

- Provider + modelli: [Models](/it/providers/models)
- Concetti di selezione del modello + comando slash `/models`: [Concetto di modelli](/it/concepts/models)
- Configurazione dell’autenticazione del provider: [Per iniziare](/it/start/getting-started)

## Comandi comuni

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` mostra il valore risolto di predefinito/fallback più una panoramica dell’autenticazione.
Quando sono disponibili snapshot di utilizzo del provider, la sezione di stato OAuth/API key include
finestre di utilizzo del provider e snapshot della quota.
Provider attuali con finestra di utilizzo: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi e z.ai. L’autenticazione di utilizzo proviene da hook specifici del provider
quando disponibili; altrimenti OpenClaw usa come fallback le
credenziali OAuth/API key corrispondenti da profili di autenticazione, ambiente o configurazione.
Nell’output `--json`, `auth.providers` è la panoramica dei provider
consapevole di env/config/store, mentre `auth.oauth` rappresenta solo lo stato dei profili dell’archivio di autenticazione.
Aggiungi `--probe` per eseguire probe di autenticazione live su ogni profilo provider configurato.
I probe sono richieste reali (possono consumare token e attivare rate limit).
Usa `--agent <id>` per ispezionare lo stato modello/autenticazione di un agente configurato. Se omesso,
il comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se impostato, altrimenti
l’agente predefinito configurato.
Le righe probe possono provenire da profili di autenticazione, credenziali env o `models.json`.

Note:

- `models set <model-or-alias>` accetta `provider/model` oppure un alias.
- `models list` è in sola lettura: legge configurazione, profili di autenticazione, stato del catalogo esistente
  e righe di catalogo possedute dal provider, ma non riscrive
  `models.json`.
- `models list --all` include righe statiche del catalogo possedute dal provider e incluse nel bundle anche
  quando non ti sei ancora autenticato con quel provider. Quelle righe risultano comunque
  non disponibili finché non viene configurata un’autenticazione corrispondente.
- `models list --provider <id>` filtra per ID provider, come `moonshot` o
  `openai-codex`. Non accetta etichette visualizzate dai selettori interattivi del provider,
  come `Moonshot AI`.
- I riferimenti ai modelli vengono analizzati dividendo sul **primo** `/`. Se l’ID modello include `/` (stile OpenRouter), includi il prefisso provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw risolve prima l’input come alias, poi
  come corrispondenza univoca tra provider configurati per quell’esatto ID modello, e solo dopo
  usa come fallback il provider predefinito configurato con un avviso di deprecazione.
  Se quel provider non espone più il modello predefinito configurato, OpenClaw
  usa come fallback il primo provider/modello configurato invece di mostrare un
  valore predefinito obsoleto di provider rimosso.
- `models status` può mostrare `marker(<value>)` nell’output di autenticazione per placeholder non segreti (per esempio `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) invece di mascherarli come segreti.

### `models status`

Opzioni:

- `--json`
- `--plain`
- `--check` (uscita 1=scaduto/mancante, 2=in scadenza)
- `--probe` (probe live dei profili di autenticazione configurati)
- `--probe-provider <name>` (probe di un provider)
- `--probe-profile <id>` (ripetibile o ID profilo separati da virgole)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (ID agente configurato; sostituisce `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Categorie di stato probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casi di dettaglio/codice motivo del probe da aspettarsi:

- `excluded_by_auth_order`: esiste un profilo memorizzato, ma l’esplicito
  `auth.order.<provider>` lo ha omesso, quindi il probe segnala l’esclusione invece di
  provarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  il profilo è presente ma non è idoneo/risolvibile.
- `no_model`: l’autenticazione del provider esiste, ma OpenClaw non è riuscito a risolvere
  un candidato modello sondeggiabile per quel provider.

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

`models auth add` è l’assistente interattivo per l’autenticazione. Può avviare un flusso di autenticazione del provider
(OAuth/API key) oppure guidarti nell’incollare manualmente un token, a seconda del
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
- `setup-token` richiede una TTY interattiva ed esegue il metodo di autenticazione tramite token del provider
  (usando per impostazione predefinita il metodo `setup-token` di quel provider quando ne espone
  uno).
- `paste-token` accetta una stringa token generata altrove o tramite automazione.
- `paste-token` richiede `--provider`, chiede il valore del token e lo scrive
  nell’ID profilo predefinito `<provider>:manual` a meno che non venga passato
  `--profile-id`.
- `paste-token --expires-in <duration>` memorizza una scadenza assoluta del token a partire da una
  durata relativa come `365d` o `12h`.
- Nota Anthropic: il personale Anthropic ci ha detto che l’uso in stile OpenClaw di Claude CLI è di nuovo consentito, quindi OpenClaw considera il riuso di Claude CLI e l’uso di `claude -p` come approvati per questa integrazione, salvo che Anthropic pubblichi una nuova policy.
- `setup-token` / `paste-token` per Anthropic restano disponibili come percorso token supportato da OpenClaw, ma OpenClaw ora preferisce il riuso di Claude CLI e `claude -p` quando disponibili.

## Correlati

- [Riferimento CLI](/it/cli)
- [Selezione del modello](/it/concepts/model-providers)
- [Failover del modello](/it/concepts/model-failover)
