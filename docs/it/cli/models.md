---
read_when:
    - Vuoi cambiare i modelli predefiniti o visualizzare lo stato di autenticazione del provider
    - Vuoi analizzare i modelli/provider disponibili ed eseguire il debug dei profili di autenticazione
summary: Riferimento CLI per `openclaw models` (status/list/set/scan, alias, fallback, autenticazione)
title: models
x-i18n:
    generated_at: "2026-04-05T13:48:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ba33181d49b6bbf3b5d5fa413aa6b388c9f29fb9d4952055d68c79f7bcfea0
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Rilevamento, scansione e configurazione dei modelli (modello predefinito, fallback, profili di autenticazione).

Correlati:

- Provider + modelli: [Modelli](/providers/models)
- Configurazione dell'autenticazione del provider: [Per iniziare](/start/getting-started)

## Comandi comuni

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` mostra i valori predefiniti/fallback risolti più una panoramica dell'autenticazione.
Quando sono disponibili snapshot di utilizzo del provider, la sezione dello stato OAuth/API key include
finestre di utilizzo del provider e snapshot delle quote.
Provider attualmente con finestra di utilizzo: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi e z.ai. I dati di utilizzo per l'autenticazione provengono da hook specifici del provider
quando disponibili; altrimenti OpenClaw ricorre all'abbinamento delle
credenziali OAuth/API key dai profili di autenticazione, dall'ambiente o dalla configurazione.
Aggiungi `--probe` per eseguire probe di autenticazione live su ciascun profilo provider configurato.
Le probe sono richieste reali (possono consumare token e attivare rate limit).
Usa `--agent <id>` per ispezionare lo stato modello/autenticazione di un agente configurato. Se omesso,
il comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se impostati, altrimenti
l'agente predefinito configurato.
Le righe delle probe possono provenire da profili di autenticazione, credenziali env o `models.json`.

Note:

- `models set <model-or-alias>` accetta `provider/model` o un alias.
- I riferimenti ai modelli vengono analizzati dividendo sulla **prima** `/`. Se l'ID del modello include `/` (stile OpenRouter), includi il prefisso del provider (esempio: `openrouter/moonshotai/kimi-k2`).
- Se ometti il provider, OpenClaw risolve prima l'input come alias, poi
  come corrispondenza univoca di provider configurato per quell'esatto id modello, e solo dopo
  ricade sul provider predefinito configurato con un avviso di deprecazione.
  Se quel provider non espone più il modello predefinito configurato, OpenClaw
  ricade sul primo provider/modello configurato invece di mostrare un
  valore predefinito obsoleto di un provider rimosso.
- `models status` può mostrare `marker(<value>)` nell'output di autenticazione per placeholder non segreti (ad esempio `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) invece di mascherarli come segreti.

### `models status`

Opzioni:

- `--json`
- `--plain`
- `--check` (codice di uscita 1=mancante/scaduto, 2=in scadenza)
- `--probe` (probe live dei profili di autenticazione configurati)
- `--probe-provider <name>` (probe di un solo provider)
- `--probe-profile <id>` (ripetibile o separato da virgole)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agente configurato; sovrascrive `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Categorie di stato delle probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casi di dettaglio/codice motivo delle probe da aspettarsi:

- `excluded_by_auth_order`: esiste un profilo memorizzato, ma
  `auth.order.<provider>` esplicito lo ha omesso, quindi la probe segnala l'esclusione invece di
  provarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  il profilo è presente ma non è idoneo/risolvibile.
- `no_model`: esiste l'autenticazione del provider, ma OpenClaw non è riuscito a risolvere
  un candidato modello interrogabile per quel provider.

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
(OAuth/API key) oppure guidarti nell'incollare manualmente un token, a seconda del
provider che scegli.

`models auth login` esegue il flusso di autenticazione di un plugin provider (OAuth/API key). Usa
`openclaw plugins list` per vedere quali provider sono installati.

Esempi:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
openclaw models auth login --provider openai-codex --set-default
```

Note:

- `login --provider anthropic --method cli --set-default` riutilizza un login locale di Claude
  CLI e riscrive il percorso del modello predefinito principale di Anthropic in un riferimento
  canonico `claude-cli/claude-*`.
- `setup-token` e `paste-token` restano comandi generici per i token per i provider
  che espongono metodi di autenticazione tramite token.
- `setup-token` richiede un TTY interattivo ed esegue il metodo di autenticazione tramite token del provider
  (per impostazione predefinita usando il metodo `setup-token` di quel provider quando ne espone
  uno).
- `paste-token` accetta una stringa token generata altrove o dall'automazione.
- `paste-token` richiede `--provider`, richiede il valore del token e lo scrive
  nell'id profilo predefinito `<provider>:manual` a meno che tu non passi
  `--profile-id`.
- `paste-token --expires-in <duration>` memorizza una scadenza assoluta del token a partire da una
  durata relativa come `365d` o `12h`.
- Nota sulla fatturazione Anthropic: riteniamo che il fallback Claude Code CLI sia probabilmente consentito per automazione locale gestita dall'utente in base alla documentazione pubblica della CLI di Anthropic. Detto questo, la policy di Anthropic sugli harness di terze parti crea abbastanza ambiguità sull'uso con abbonamento in prodotti esterni da farci sconsigliare questa opzione per la produzione. Anthropic ha anche notificato agli utenti di OpenClaw il **4 aprile 2026 alle 12:00 PM PT / 8:00 PM BST** che il percorso di login Claude di **OpenClaw** conta come utilizzo di harness di terze parti e richiede **Extra Usage** fatturato separatamente rispetto all'abbonamento.
- `setup-token` / `paste-token` di Anthropic sono di nuovo disponibili come percorso legacy/manuale di OpenClaw. Usali aspettandoti che Anthropic abbia comunicato agli utenti di OpenClaw che questo percorso richiede **Extra Usage**.
